import { createId } from "@paralleldrive/cuid2"
import * as Sentry from "@sentry/react-native"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react"

import { useApiFetch } from "@/hooks/api-client/use-api-fetch"
import { useUserSettings } from "@/hooks/use-user-settings"
import { type Voice, useVoiceSelections } from "@/hooks/use-voice-selections"
import { type Message } from "@/lib/ai/message"
import { createLogger } from "@/lib/logger"
import {
  type AudioSampleEventPayload,
  type NativeAudioModuleLogPayload,
  addAudioSampleListener,
  addLogListener,
  cleanupNativeAudioModule,
  initializeNativeAudioModule,
  nativePlayAudioFromBase64,
  nativeStopAudio
} from "@/modules/native-audio-module"

import { AudioModeState, DEFAULT_VOICE } from "./audio-mode-constants"

type FetchWebSocketResponse = {
  wsUrl: string
  wsAuthorization: string
}

type StreamingVoiceResponse = {
  context_id: string
  status_code: number
  done: boolean
  data: string
  step_time: number
}

type VoiceParams = {
  mode: "id" | "embedding"
  id?: string
  embedding?: number[]
  __experimental_controls?: {
    speed?: string
  }
}

type MessagePayload = {
  context_id: string
  model_id: string
  transcript: string
  voice: VoiceParams
  continue: boolean
  output_format: {
    container: string
    encoding: string
    sample_rate: number
  }
}

type TextToSpeechProps = {
  audioError?: Error
  audioModeState?: AudioModeState
  messages: Message[]
  isLoading: boolean
  onAudioSampleReceived?: (sampleData: number[]) => void
  setAudioError?: (error: Error | undefined) => void
  setAudioModeState: (state: AudioModeState) => void
}

export type TextToSpeechRef = {
  onExitAudioMode: () => void
}

/**
 * The server can handle several formats. The type is not surfaced in a setting.
 * Older clients default to pcm_32le and 22050 sample rate, newer clients have the ability to change this for lower latency.
 * This setting has a large impact on the underlying native module behavior, as they handle the raw audio data.
 * Generally, this represents a tradeoff between latency vs quality. We're defaulting to improve latency at the cost of quality.
 */
type SpeechOutputFormat = {
  container: "raw"
  encoding: "pcm_f32le" | "pcm_s16le"
  sample_rate: number
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- document the original default, which is a valid option for the future
const FORMAT_32BIT: SpeechOutputFormat = {
  container: "raw",
  encoding: "pcm_f32le",
  sample_rate: 22050
}
const FORMAT_16BIT: SpeechOutputFormat = {
  container: "raw",
  encoding: "pcm_s16le",
  sample_rate: 16000
}
const SPEECH_OUTPUT_FORMAT: SpeechOutputFormat = FORMAT_16BIT

const MIN_CHUNK_SIZE = 96
const logger = createLogger("components:audio:native-text-to-speech")

const TextToSpeechComponent = forwardRef<TextToSpeechRef, TextToSpeechProps>(
  (
    {
      audioError,
      audioModeState,
      messages,
      isLoading,
      onAudioSampleReceived,
      setAudioError,
      setAudioModeState
    },
    ref
  ) => {
    const isPlayingRef = useRef(false)
    const wsRef = useRef<WebSocket | null>(null)
    const contextId = useRef<string>(createId())
    const { apiFetch } = useApiFetch()
    const wasStreaming = useRef(false)
    const lastProcessedCharacterIndex = useRef<number>(0)
    const messageQueue = useRef<string[]>([])
    const isCreatingWS = useRef(false)
    const lastAudioEventTime = useRef(Date.now())

    /* we use our saved voice, but recheck it against available voices in case it is no longer supported */
    const savedVoice = useUserSettings((state) => state.voice)
    const { availableVoices } = useVoiceSelections() as {
      availableVoices: Voice[] | undefined
    }
    const [selectedVoice, setSelectedVoice] = useState<Voice>(savedVoice)
    useEffect(() => {
      if (availableVoices && availableVoices.length > 0) {
        const voiceMatch = availableVoices.find(
          (v) => v.voiceId === savedVoice.voiceId
        )
        setSelectedVoice(
          voiceMatch ? voiceMatch : (availableVoices[0] ?? DEFAULT_VOICE)
        )
      }
    }, [availableVoices, savedVoice])

    /* voice speed is a string */
    const voiceSpeed = useUserSettings((state) => state.voiceSpeed)

    /**
     * The parent component calls this function to clean up various artifacts.
     * Note audio mode state can't be relied upon in a useEffect hook to execute this logic
     * because the parent component is not rendered when audio mode is not visible, so the hook
     * would not execute.
     */
    useImperativeHandle(ref, () => ({
      onExitAudioMode: () => {
        isPlayingRef.current = false
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
        stopAudio()
        cleanupNativeAudioModule()
      }
    }))

    const createWSPayload = useCallback(
      (message: string) => {
        const voice = selectedVoice
        const voiceParams: VoiceParams = voice.voiceEmbedding
          ? {
              mode: "embedding",
              embedding: voice.voiceEmbedding
            }
          : {
              mode: "id",
              id: voice.voiceId
            }
        voiceParams.__experimental_controls = { speed: voiceSpeed }
        const messagePayload = {
          context_id: contextId.current,
          model_id: voice.modelId,
          transcript: message,
          voice: voiceParams,
          continue: true,
          output_format: SPEECH_OUTPUT_FORMAT
        } as MessagePayload
        return messagePayload
      },
      [selectedVoice, voiceSpeed]
    )

    const handleSocketEvents = useCallback(
      (ws: WebSocket) => {
        ws.onopen = () => {
          logger.debug("WebSocket connected")
          while (messageQueue.current.length > 0) {
            const messagePayload = messageQueue.current.shift()
            if (messagePayload) {
              ws.send(messagePayload)
            }
          }
          isCreatingWS.current = false
        }

        ws.onmessage = (event) => {
          const speechResponse = JSON.parse(
            event.data as string
          ) as StreamingVoiceResponse

          if (
            isPlayingRef.current &&
            !speechResponse.done &&
            speechResponse.data
          ) {
            nativePlayAudioFromBase64(speechResponse.data)
              .then(() => {
                setAudioModeState(AudioModeState.PLAYING)
                // track this both on play start and sample received
                lastAudioEventTime.current = Date.now()
              })
              .catch((error: unknown) => {
                logger.debug("Error playing audio:", error)
                setAudioModeState(AudioModeState.IDLE)
                Sentry.captureException(error)
              })
          }
        }

        ws.onerror = (error) => {
          setAudioError?.(new Error("Audio connection failed"))
          logger.debug("WebSocket error:", error)
          ws.close()
          wsRef.current = null
          isCreatingWS.current = false
        }

        ws.onclose = () => {
          wsRef.current = null
          isCreatingWS.current = false
        }
      },
      [setAudioError, setAudioModeState]
    )

    const createWebsocket = useCallback(async () => {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return
      if (isCreatingWS.current) return // avoid race conditions with the fetch api call
      isCreatingWS.current = true

      try {
        // fetch the ws url and token needed to use it
        logger.debug("Fetching WebSocket info")
        const response = await apiFetch(`/api/audio/chat/tts`, {
          method: "GET"
        })
        if (!response.ok) {
          if (response.status === 403) {
            let authMsg = (await response.json()) as string
            if (!authMsg || authMsg.length)
              authMsg = "Voice Chat Requires a Subscription"
            throw new Error(authMsg)
          }
          throw new Error(`${response.status} Unable to start voice streaming`)
        }
        const jsonResponse = (await response.json()) as FetchWebSocketResponse
        const { wsUrl, wsAuthorization } = jsonResponse
        if (!wsUrl || !wsAuthorization) {
          throw new Error("Failed to connect to voice")
        }
        logger.debug("Creating WebSocket connection")
        const ws = new WebSocket(`${wsUrl}?auth=${wsAuthorization}`)
        wsRef.current = ws
      } catch (error) {
        logger.debug(
          "Error fetching websocket info and creating WebSocket:",
          error
        )
        wsRef.current = null
        isCreatingWS.current = false
        setAudioError?.(error as Error)
        Sentry.captureException(error)
        setAudioModeState(AudioModeState.IDLE)
      }
      if (wsRef.current) {
        handleSocketEvents(wsRef.current)
      }
    }, [apiFetch, handleSocketEvents, setAudioError, setAudioModeState])

    const getSpeechForText = useCallback(
      async (text: string) => {
        if (!isPlayingRef.current) return
        const messagePayload = createWSPayload(text)
        const messagePayloadString = JSON.stringify(messagePayload)

        // if we don't have a websocket or it's closed
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          // only queue if not already queued
          if (!messageQueue.current.includes(messagePayloadString)) {
            messageQueue.current.push(messagePayloadString)
          }
          await createWebsocket()
        } else if (wsRef.current.readyState === WebSocket.OPEN) {
          if (messageQueue.current.length > 0) {
            // message should already be in queue if needed
            if (!messageQueue.current.includes(messagePayloadString)) {
              messageQueue.current.push(messagePayloadString)
            }
          } else {
            // no queue, send immediately
            wsRef.current.send(messagePayloadString)
          }
        } else if (!messageQueue.current.includes(messagePayloadString)) {
          // socket is connecting, just queue if not already queued
          messageQueue.current.push(messagePayloadString)
        }
      },
      [createWSPayload, createWebsocket]
    )

    const stopAudio = () => {
      void nativeStopAudio()
      isPlayingRef.current = false
    }

    const handleAudioSample = useCallback(
      (event: AudioSampleEventPayload) => {
        if (
          audioModeState === AudioModeState.PLAYING &&
          event.sampleData.length > 0
        ) {
          if (onAudioSampleReceived) {
            onAudioSampleReceived(event.sampleData)
          }
          if (event.sampleData[0] !== 0) {
            lastAudioEventTime.current = Date.now()
          }
        }
      },
      [audioModeState, onAudioSampleReceived]
    )

    useEffect(() => {
      if (
        messages.length === 0 ||
        (audioModeState !== AudioModeState.PROMPTING &&
          audioModeState !== AudioModeState.PLAYING)
      )
        return

      const isStreaming =
        isLoading && messages[messages.length - 1]?.role === "assistant"
      if (!wasStreaming.current && !isStreaming) return

      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.role !== "assistant") return

      let currentIndex = lastProcessedCharacterIndex.current

      if (isStreaming && !wasStreaming.current) {
        // we just started receiving a new conversational turn
        wasStreaming.current = true
        stopAudio()
        contextId.current = createId()
        lastProcessedCharacterIndex.current = 0
        currentIndex = 0
        isPlayingRef.current = true
        messageQueue.current = []
        return
      }

      const splitCharacters = [".", "\n", "!", "?"]

      const processChunk = async () => {
        const newContent = lastMessage.content.slice(currentIndex).trim()
        const newContentLength = newContent.length

        if (
          newContentLength >= MIN_CHUNK_SIZE &&
          splitCharacters.some((char) => newContent.includes(char))
        ) {
          // find the last occurrence of any split character
          const splitIndices = splitCharacters.map((char) =>
            newContent.lastIndexOf(char)
          )
          const validSplitFound = splitIndices.some((index) => index !== -1)

          if (validSplitFound) {
            const splitIndex = Math.max(...splitIndices)
            const endIndex = splitIndex + 1

            if (endIndex > MIN_CHUNK_SIZE) {
              const contentChunk = newContent.slice(0, endIndex).trim()
              currentIndex += endIndex
              lastProcessedCharacterIndex.current = currentIndex
              //logger.debug("Processing chunk:", contentChunk)
              await getSpeechForText(contentChunk)
            }
          }
          // if no valid split found, wait for more content or end of stream
        } else if (
          !isStreaming &&
          newContentLength > 0 &&
          currentIndex < lastMessage.content.length
        ) {
          // process any remaining content when streaming ends, regardless of delimiters
          //logger.debug("Processing final chunk:", newContent)
          await getSpeechForText(newContent)
          lastProcessedCharacterIndex.current = lastMessage.content.length
        }
      }

      void processChunk()

      if (!isStreaming && wasStreaming.current) {
        wasStreaming.current = false
      }
    }, [messages, isLoading, getSpeechForText, audioModeState])

    useEffect(() => {
      initializeNativeAudioModule(
        SPEECH_OUTPUT_FORMAT.encoding === FORMAT_16BIT.encoding
      )
      const logSubscription = addLogListener(
        (event: NativeAudioModuleLogPayload) => {
          logger.debug("Native log:", event.message)
        }
      )
      return () => {
        logSubscription.remove()
      }
    }, [])

    useEffect(() => {
      const sampleSubscription = addAudioSampleListener(handleAudioSample)

      return () => {
        sampleSubscription.remove()
      }
    }, [handleAudioSample, onAudioSampleReceived])

    useEffect(() => {
      const setupWebsocket = async () => {
        await createWebsocket()
      }
      void setupWebsocket()
    }, [createWebsocket])

    useEffect(() => {
      if (
        audioError &&
        audioModeState !== AudioModeState.IDLE &&
        audioModeState !== AudioModeState.LOADING
      ) {
        setAudioModeState(AudioModeState.IDLE)
      } else if (
        isPlayingRef.current &&
        audioModeState !== AudioModeState.PROMPTING &&
        audioModeState !== AudioModeState.PLAYING
      ) {
        stopAudio()
      }
    }, [audioError, audioModeState, setAudioModeState])

    useEffect(() => {
      const intervalId = setInterval(() => {
        if (audioModeState === AudioModeState.PLAYING) {
          const sinceSamplesReceived = Date.now() - lastAudioEventTime.current
          if (onAudioSampleReceived && sinceSamplesReceived > 50) {
            onAudioSampleReceived([0, 0, 0, 0])
            if (sinceSamplesReceived > 800) {
              setAudioModeState(AudioModeState.IDLE)
            }
          }
        }
      }, 300)

      return () => {
        clearInterval(intervalId)
      }
    }, [audioModeState, onAudioSampleReceived, setAudioModeState])

    return null
  }
)

TextToSpeechComponent.displayName = "TextToSpeech"

export const TextToSpeech = TextToSpeechComponent
