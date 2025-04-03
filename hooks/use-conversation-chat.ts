import * as Sentry from "@sentry/react-native"
import { useCallback, useMemo } from "react"

import { AUDIO_DATA_PREFIX } from "@/components/audio/audio-mode-constants"
import { getModelAndProviderFromResponse } from "@/lib/ai/get-model-and-provider-from-composite-slug"
import { type Message, convertDatabaseMessageToMessage } from "@/lib/ai/message"
import { isCustomModel } from "@/lib/ai/models"
import { createLogger } from "@/lib/logger"

import { type UseChatOptions, useChat } from "./ai/use-chat"
import { useApiErrorHandler } from "./api-client/use-api-error-handler"
import { useConversation } from "./conversations/use-conversation"
import { useCustomModelSlug } from "./custom-models/use-custom-model-slug"
import { useCreateMessage } from "./messages/use-create-message"
import { useMessages } from "./messages/use-messages"
import { useOpenAI } from "./openai/use-openai"
import { useModel } from "./use-model"

const logger = createLogger("hooks:use-conversation-chat")

type Params = {
  /**
   * The conversationId for this chat
   */
  conversationId: string
  /**
   * Additional headers to send
   */
  headers?: Record<string, string>

  onResponse?: UseChatOptions["onResponse"]
  onError?: UseChatOptions["onError"]
  onFinish?: UseChatOptions["onFinish"]
}

export function useConversationChat({
  conversationId,
  headers,
  onResponse,
  onError,
  onFinish
}: Params) {
  const { unauthorizedError, rateLimitError, notFoundError, unknownError } =
    useApiErrorHandler()

  const { mutate: createMessage } = useCreateMessage(conversationId)
  const { data: conversation } = useConversation(conversationId)
  const { data: databaseMessages } = useMessages(conversationId)
  const { getCustomModelSlug } = useCustomModelSlug()
  const { model } = useModel(conversation)

  const initialMessages = useMemo<Message[]>(
    () =>
      databaseMessages
        ?.toReversed()
        .map((message) => convertDatabaseMessageToMessage(message)) ?? [],
    [databaseMessages]
  )

  const openaiMode = model.endpoint ? "external" : "internal"
  const { openai } = useOpenAI(openaiMode, {
    defaultHeaders: headers,
    apiKey: model.endpoint?.apiKey,
    baseURL: model.endpoint?.baseURL
  })

  // A custom model's slug needs to be looked up separately, since for custom models
  // we overload the model slug with the model id to distinguish between custom models
  // with the same model slug.
  const modelSlug = isCustomModel(model)
    ? getCustomModelSlug(model.slug)
    : model.slug

  const { append, messages, setMessages, error, isLoading, stop } = useChat({
    openai,
    model: modelSlug,
    /**
     * An optional callback that will be called with the response from the API
     * endpoint.
     *
     * Due to using the OpenAI SDK, this is only called on successful responses,
     * not errors.
     */
    onResponse(response) {
      onResponse?.(response)
    },
    /**
     * An optional callback that will be called when the endpoint encounters
     * an error.
     */
    onError(err) {
      Sentry.captureException(err)
      logger.error("Error streaming response", err)

      const errorStatus: number =
        "status" in err ? ((err.status ?? 500) as number) : 500
      if (errorStatus === 401) {
        // Unauthorized. This is likely due to an expired token. Sign out
        unauthorizedError()
      } else if (errorStatus === 404) {
        notFoundError()
      } else if (errorStatus === 429) {
        // Rate Limit Error
        rateLimitError()
      } else {
        // All other errors
        unknownError()
      }

      return onError?.(err)
    },
    /**
     * An optional callback function that is called when the completion stream
     * ends.
     */
    onFinish(message, response) {
      const modelAndProvider = getModelAndProviderFromResponse(response) ?? {
        model: model.slug
      }

      createMessage({ message, ...modelAndProvider })
      return onFinish?.(message, response)
    },
    initialMessages,
    systemPrompt: conversation?.systemPrompt
  })

  const appendWithStorage = useCallback(
    (message: Message) => {
      if (!message.content.startsWith(AUDIO_DATA_PREFIX)) {
        createMessage({ message })
      }
      append(message)
    },
    [append, createMessage]
  )

  return {
    append: appendWithStorage,
    stop,
    messages,
    setMessages,
    error,
    isLoading
  }
}
