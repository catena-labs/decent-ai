import * as Sentry from "@sentry/react-native"
import { useMutation } from "@tanstack/react-query"
import { type OpenAI } from "openai"

import { getModelAndProviderFromResponse } from "@/lib/ai/get-model-and-provider-from-composite-slug"
import { createLogger } from "@/lib/logger"
import { isAbortError } from "@/lib/utils/errors/is-abort-error"

import { useApiErrorHandler } from "../api-client/use-api-error-handler"

type MutationResult = {
  data: OpenAI.Images.ImagesResponse
  response: Response
  model?: string
  provider?: string
}

export type AspectRatio = OpenAI.Images.ImageGenerateParams["size"]

type MutationParams = OpenAI.Images.ImageGenerateParams & {
  signal?: AbortSignal
}

type HookParams = {
  openai: OpenAI
}

const logger = createLogger("hooks/openai/use-generate-image")

/**
 * A hook to generate an image using the OpenAI SDK. This returns the same
 * response as the OpenAI SDK, augmented with the model and provider.
 *
 * This mutation can be aborted
 *
 * Note: This hook is not responsible for persisting the generated image to the
 * database. That can be achieved using the onSuccess callback.
 */
export function useGenerateImage({ openai }: HookParams) {
  const { unauthorizedError, notFoundError, rateLimitError, unknownError } =
    useApiErrorHandler()

  return useMutation<MutationResult, Error, MutationParams>({
    mutationKey: ["ai/images-generate"],
    mutationFn: async ({ signal, ...params }) => {
      const { data, response } = await openai.images
        .generate(params, {
          signal
        })
        .withResponse()

      const modelAndProvider = getModelAndProviderFromResponse(response)

      return {
        data,
        response,
        ...modelAndProvider
      }
    },
    onError: (e) => {
      if (isAbortError(e)) {
        logger.info("Image generation aborted")
        return
      }

      logger.error("Error generating image", e)
      Sentry.captureException(e)

      const errorStatus: number =
        "status" in e ? ((e.status ?? 500) as number) : 500

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
    }
  })
}
