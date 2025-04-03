import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { createLogger } from "@/lib/logger"

import { useApiClient } from "./api-client/use-api-client"
import { useAuthentication } from "./use-authentication"

const logger = createLogger("use-audio-status")

const responseSchema = z.object({
  status: z.number(),
  body: z.string()
})

/**
 * A hook that fetches both STT and TTS availability. This is used in audio mode.
 */
export function useAudioAccessStatus() {
  return useAccessStatus(["stt", "tts"])
}

/**
 * A hook that fetches STT availability. STT can be used outside of audio mode.
 */
export function useSTTAccessStatus() {
  return useAccessStatus(["stt"])
}

function useAccessStatus(entitlements: string[]) {
  const apiClient = useApiClient()
  const { userId } = useAuthentication()
  const apiPath = `/api/audio/chat/access/${entitlements.join("/")}`
  const queryKey = ["audio-access", userId, apiPath]

  const { data, isLoading, refetch } = useQuery({
    enabled: Boolean(userId),
    queryKey,
    queryFn: async () => {
      logger.debug(`Fetching access status for ${apiPath}`)
      const response = await apiClient.fetch(apiPath)
      return responseSchema.parse(await response.json())
    }
  })

  return {
    status: data?.status ?? 500,
    body: data?.body,
    isLoading,
    refetch
  }
}
