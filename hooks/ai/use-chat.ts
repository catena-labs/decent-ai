import { type OpenAI } from "openai"
import { type Stream } from "openai/streaming"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  type ModelAndProvider,
  getModelAndProviderFromResponse
} from "@/lib/ai/get-model-and-provider-from-composite-slug"
import { isStreamingChatCompletion } from "@/lib/ai/is-streaming-chat-completion"
import {
  type Message,
  convertMessageToChatCompletionMessageParam,
  convertOpenAICompletionChunkToMessage,
  messageSchema
} from "@/lib/ai/message"
import { createLogger } from "@/lib/logger"
import { compact } from "@/lib/utils/array-fns/compact"
import { isAbortError } from "@/lib/utils/errors/is-abort-error"

import { useChatCompletion } from "../openai/use-chat-completion"

const logger = createLogger("hooks:ai:use-chat2")

const MAX_CHUNK_BUFFER_SIZE = 5

export type UseChatOptions = {
  openai: OpenAI
  model: string
  initialMessages?: Message[]
  systemPrompt?: string | null
  onResponse?: (response: Response) => void
  onError?: (error: Error) => void
  onFinish?: (message: Message, response?: Response) => void
}

export function useChat({
  openai,
  model,
  initialMessages,
  systemPrompt,
  onResponse,
  onError,
  onFinish
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>(
    compact([
      systemPrompt
        ? messageSchema.parse({ role: "system", content: systemPrompt })
        : undefined,
      ...(initialMessages ?? [])
    ])
  )
  const [currentStream, setCurrentStream] =
    useState<Stream<OpenAI.Chat.Completions.ChatCompletionChunk> | null>(null)

  const [abortController, setAbortController] =
    useState<AbortController | null>(null)
  const {
    mutate: createChatCompletion,
    isPending: isGeneratingCompletion,
    error
  } = useChatCompletion({
    openai
  })

  /**
   * When the initialMessages array changes, see if we need to append the new
   * messages to the existing messages
   */
  useEffect(() => {
    // If we don't have initial messages, don't do anything
    if (!initialMessages) {
      return
    }

    setMessages((prev) => {
      // If we already have messages in our list, don't append the initial messages
      if (prev.filter((m) => m.role !== "system").length > 0) {
        return prev
      }

      return [...prev, ...initialMessages]
    })
  }, [initialMessages])

  // On system prompt change, fire this effect to update the current messages stored by the vercel hook.
  useEffect(() => {
    // Don't update the system prompt on first load - we initialize it above.
    const currentPrompt = messages.find((m) => m.role === "system")?.content
    if (!systemPrompt || currentPrompt === systemPrompt) {
      return
    }

    logger.debug("Updating system prompt")
    // Set the system prompt as first message, removing any existing system prompt
    setMessages([
      messageSchema.parse({ role: "system", content: systemPrompt }),
      ...messages.filter((m) => m.role !== "system")
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only execute on system prompt change. Including vercelMessages will cause infinite render loop
  }, [systemPrompt, setMessages])

  /**
   * Determine if the chat is currently loading. This will return true from the
   * moment the user sends a message until the end of the response is streamed.
   */
  const isLoading = useMemo(
    () => isGeneratingCompletion || currentStream !== null,
    [currentStream, isGeneratingCompletion]
  )

  /**
   * Adds the provided chunks being loaded from the stream to the last message in the
   * message list. Returns the accumulated assistant message currently being built.
   *
   * @param chunks - The openai message chunks to accumulate into the new message
   * @param modelAndProvider - The model and provider associated with the response.
   * If not provided, the model and provider will be extracted from the chunk.
   */
  const addMessageChunks = useCallback(
    (
      chunks: OpenAI.Chat.Completions.ChatCompletionChunk[],
      modelAndProvider?: ModelAndProvider
    ): Message | undefined => {
      // Accumulate the chunks into a single message type. Will be undefined if
      // no new chunks were provided.
      const newMessage: Message | undefined = chunks.reduce<
        Message | undefined
      >((acc, chunk) => {
        const nextMessageChunk = convertOpenAICompletionChunkToMessage(chunk)
        nextMessageChunk.content = `${acc?.content ?? ""}${nextMessageChunk.content}`

        if (modelAndProvider) {
          nextMessageChunk.model = modelAndProvider.model
          nextMessageChunk.provider = modelAndProvider.provider
        }

        return nextMessageChunk
      }, undefined)

      // This is the full, accumualted message so far. We return this to the caller.
      let fullMessage: Message | undefined

      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]

        // If the last message is not from the assistant, we are receiving the first
        // chunks for a new assistant message.
        if (lastMessage?.role !== "assistant") {
          // Append the new message to the end of the list, or return the previous list if
          // there were no chunks returned.
          fullMessage = newMessage
          return newMessage ? [...prev, newMessage] : prev
        }

        // No new message chunks were provided, so we'll just return the last message
        if (!newMessage) {
          fullMessage = lastMessage
          return prev
        }

        fullMessage = {
          ...lastMessage,
          content: `${lastMessage.content}${newMessage.content}`
        }

        // Remove the last message because we're appending to it and will re-add it
        return [...prev.slice(0, -1), fullMessage]
      })

      return fullMessage
    },
    []
  )

  /**
   * Set the current streaming response, and read the content
   */
  const readStreamingResponse = useCallback(
    async (
      stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk>,
      response: Response
    ) => {
      setCurrentStream(stream)
      const modelAndProvider = getModelAndProviderFromResponse(response)

      // An object to contain the full message as its being built
      let message: Message | undefined

      let chunkBuffer: OpenAI.Chat.Completions.ChatCompletionChunk[] = []
      let isFirstChunk = true

      try {
        logger.debug("Reading streaming response", stream)
        for await (const chunk of stream) {
          chunkBuffer.push(chunk)

          if (isFirstChunk || chunkBuffer.length >= MAX_CHUNK_BUFFER_SIZE) {
            message = addMessageChunks(chunkBuffer, modelAndProvider)
            chunkBuffer = []
            isFirstChunk = false
          }
        }

        // Flush any remaining chunks
        message = addMessageChunks(chunkBuffer, modelAndProvider)
      } catch (err) {
        logger.error("readStreamingResponse error", err)
      } finally {
        setCurrentStream(null)
      }

      if (message) {
        onFinish?.(message, response)
      }
    },
    [addMessageChunks, onFinish]
  )

  const readNonStreamingResponse = useCallback(
    (data: OpenAI.Chat.Completions.ChatCompletion, response: Response) => {
      const message = messageSchema.parse({
        role: "assistant",
        content: data.choices[0]?.message.content
      })

      onFinish?.(message, response)
      setMessages((prev) => [...prev, message])
    },
    [onFinish]
  )

  /**
   *
   */
  const stop = useCallback(() => {
    if (isGeneratingCompletion) {
      abortController?.abort()
    }

    if (currentStream !== null) {
      currentStream.controller.abort()
      setCurrentStream(null)
    }
  }, [abortController, currentStream, isGeneratingCompletion])

  /**
   *
   */
  const append = useCallback(
    (userMessage: Message) => {
      const controller = new AbortController()
      setAbortController(controller)

      setMessages((prev) => [...prev, userMessage])

      createChatCompletion(
        {
          model,
          messages: [...messages, userMessage].map((m) =>
            convertMessageToChatCompletionMessageParam(m)
          ),
          signal: controller.signal,
          stream: true
        },
        {
          onSuccess({ data, response }) {
            if (isStreamingChatCompletion(data)) {
              void readStreamingResponse(data, response)
            } else {
              readNonStreamingResponse(data, response)
            }

            onResponse?.(response)
          },
          onError(err) {
            if (isAbortError(err)) {
              return
            }

            onError?.(err)
          }
        }
      )
    },
    [
      createChatCompletion,
      messages,
      model,
      onError,
      onResponse,
      readNonStreamingResponse,
      readStreamingResponse
    ]
  )

  return {
    stop,
    append,
    error,
    isLoading,
    messages,
    setMessages
  }
}
