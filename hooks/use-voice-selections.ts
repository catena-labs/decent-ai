import { useQuery } from "@tanstack/react-query"
import { Audio } from "expo-av"
import * as Speech from "expo-speech"
import { useEffect, useState } from "react"
import { z } from "zod"

import {
  VOICES_API_URL,
  VOICE_SAMPLE_URL
} from "@/components/audio/audio-mode-constants"
import { createLogger } from "@/lib/logger"

import { useApiClient } from "./api-client/use-api-client"
import { useAuthentication } from "./use-authentication"

const logger = createLogger("use-voice-selections")

const voiceSchema = z.object({
  name: z.string(),
  voiceId: z.string(),
  provider: z.string(),
  sampleFile: z.string(),
  modelId: z.string().optional(),
  voiceEmbedding: z.array(z.number()).optional(),
  outputFormat: z.string().optional()
})

const apiResponseSchema = z.array(voiceSchema)

export type Voice = z.infer<typeof voiceSchema>

/**
 * A hook that fetches the available voices for audio mode.
 */
export function useVoiceSelections() {
  const apiClient = useApiClient()
  const { userId } = useAuthentication()
  const queryKey = ["voices", userId]

  const { data } = useQuery({
    enabled: Boolean(userId),
    queryKey,
    queryFn: async () => {
      const response = await apiClient.fetch(VOICES_API_URL)
      return apiResponseSchema.parse(await response.json())
    }
  })

  const voiceSelectorOptions = data?.map((voice) => ({
    id: getVoiceCompositeId(voice),
    title: voice.name
  }))

  return {
    voiceSelectorOptions,
    availableVoices: data
  }
}

export function usePlayVoiceSample() {
  const [currentSound, setCurrentSound] = useState<Audio.Sound>()

  useEffect(() => {
    return () => {
      void currentSound?.stopAsync()
      void currentSound?.unloadAsync()
    }
  }, [currentSound])

  const playVoiceSample = async (voice: Voice) => {
    if (voice.provider === "local") {
      const voices = await Speech.getAvailableVoicesAsync()
      // find first voice that has language "en-US"
      const enUSVoice = voices.find((v) => v.language === "en-US")
      if (enUSVoice) {
        const speechOptions = {
          voice: enUSVoice.identifier
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false, // needed to play through speaker
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true
        })
        setCurrentSound(undefined)
        Speech.speak("Hello. Beep boop beep.", speechOptions)
      }
    } else {
      const sound = await getSampleForVoice(voice)
      setCurrentSound(sound)
      await sound.playAsync()
    }
  }
  return playVoiceSample
}

export function getVoiceCompositeId(voice: Voice) {
  return `${voice.provider}:${voice.voiceId}`
}

export function getVoiceForProviderAndId(
  provider: string,
  voiceId: string,
  voices: Voice[]
) {
  return voices.find(
    (voice) => voice.provider === provider && voice.voiceId === voiceId
  )
}

export function getVoiceForCompositeId(compositeId: string, voices: Voice[]) {
  const [provider, voiceId] = compositeId.split(":")
  if (!provider || !voiceId) {
    return
  }
  return getVoiceForProviderAndId(provider, voiceId, voices)
}

export async function getSampleForVoice(voice: Voice): Promise<Audio.Sound> {
  logger.debug(`Playing voice sample: ${VOICE_SAMPLE_URL}${voice.sampleFile}`)
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false, // needed to play through speaker
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true
  })
  const { sound } = await Audio.Sound.createAsync(
    { uri: `${VOICE_SAMPLE_URL}${voice.sampleFile}` },
    { shouldPlay: true }
  )
  return sound
}
