import * as Sentry from "@sentry/react-native"
import { useMutation } from "@tanstack/react-query"

import { createLogger } from "@/lib/logger"
import { isAbortError } from "@/lib/utils/errors/is-abort-error"

import type { OpenAI } from "openai"
import type { Stream } from "openai/streaming"

type MutationResult = {
  data: OpenAI.Chat.ChatCompletion | Stream<OpenAI.Chat.ChatCompletionChunk>
  response: Response
}

type MutationParams = OpenAI.Chat.ChatCompletionCreateParams & {
  signal?: AbortSignal
}

type HookParams = {
  openai: OpenAI
}

const logger = createLogger("hooks/openai/use-chat-completion")

/**
 * A hook to generate a chat completion
 *
 * This mutation can be aborted by passing in a `signal` param.
 * You can abort a stream using data.controller.abort()
 */
export function useChatCompletion({ openai }: HookParams) {
  return useMutation<MutationResult, Error, MutationParams>({
    mutationKey: ["ai/chat-completion"],
    mutationFn: async ({ signal, ...params }) => {
      const { data, response } = await openai.chat.completions
        .create(params, { signal })
        .withResponse()

      return {
        data,
        response
      }
    },
    onError: (e) => {
      if (isAbortError(e)) {
        logger.info("Chat completion generation aborted")
        return
      }

      logger.error("Error generating completion", e)
      Sentry.captureException(e)
    },
    retry: 0
  })
}
