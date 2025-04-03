import * as Sentry from "@sentry/react-native"
import {
  type AVPlaybackStatus,
  type AVPlaybackStatusSuccess,
  Audio
} from "expo-av"
import { type AudioSample } from "expo-av/build/Audio/Sound"
import * as Speech from "expo-speech"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from "react"
import ReactNativeBlobUtil from "react-native-blob-util"

import { useApiHeaders } from "@/hooks/api-client/use-api-headers"
import { useAudioAccessStatus } from "@/hooks/use-audio-access"
import { useUserSettings } from "@/hooks/use-user-settings"
import { type Message } from "@/lib/ai/message"
import { createLogger } from "@/lib/logger"

import { AUDIO_CHAT_API_URL, AudioModeState } from "./audio-mode-constants"

const logger = createLogger("components:audio:text-to-speech")

/**
 * The minimum and maximum chunk sizes for audio streaming. These refer to character counts on outputs.
 * Lower min size decreases latency and file size, but increases API calls. Max size ensures that
 * we do not hit the limit of the audio streaming API.
 */
const MIN_CHUNK_SIZE = 128
const MAX_CHUNK_SIZE = 500

/**
 * Content is queued for download and playback. This object holds the content and the audio uri for a chunk.
 */
type ContentChunk = {
  content: string
  audioUri?: string
}

/**
 * This component's configurable properties, set in the component's parent.
 */
type TextToSpeechProps = {
  audioError?: Error
  audioModeState: AudioModeState
  messages: Message[]
  isLoading: boolean
  setAudioError?: (error: Error | undefined) => void
  setAudioModeState: (state: AudioModeState) => void
  setSampleData: (data: number[]) => void
  setVolume: (volume: number) => void
}

export type TextToSpeechRef = {
  onExitAudioMode: () => Promise<void>
}

const TextToSpeechComponent = forwardRef<TextToSpeechRef, TextToSpeechProps>(
  (
    {
      audioError,
      audioModeState,
      messages,
      isLoading,
      setAudioError,
      setAudioModeState,
      setSampleData,
      setVolume
    },
    ref
  ) => {
    const soundRef = useRef<Audio.Sound | null>(null)
    const isPlayingRef = useRef(false)
    const wasStreaming = useRef(false)
    const queuedContentRef = useRef<ContentChunk[]>([])
    const isDownloadingRef = useRef(false)
    const lastProcessedCharacterIndex = useRef<number>(0)
    const { apiHeaders } = useApiHeaders()

    /** Rules for access to STT and TTS are defined server-side */
    const audioAccessStatus = useAudioAccessStatus()

    /** The user's selected voice provider and voice ID */
    const voice = useUserSettings((state) => state.voice)

    /**
     * The parent component calls this function to clean up various artifacts.
     * Note audio mode state can't be relied upon in a useEffect hook to execute this logic
     * because the parent component is not rendered when audio mode is not visible, so the hook
     * would not execute.
     */
    useImperativeHandle(ref, () => ({
      onExitAudioMode: async () => {
        if (
          soundRef.current &&
          (await soundRef.current
            .getStatusAsync()
            .then((status) => status.isLoaded))
        ) {
          try {
            await soundRef.current.stopAsync()
            await soundRef.current.unloadAsync()
          } catch (e) {
            logger.debug("Error stopping voice streaming:", e)
          }
        }
        isPlayingRef.current = false
        lastProcessedCharacterIndex.current = 0
        queuedContentRef.current.forEach(cleanupCachedFile)
        queuedContentRef.current = []
      }
    }))

    /**
     * Stops the current voice streaming. Does not unload it or set any state.
     */
    const stopVoiceStreaming = useCallback(async () => {
      isPlayingRef.current = false
      queuedContentRef.current = []
      if (
        soundRef.current &&
        (await soundRef.current
          .getStatusAsync()
          .then((status) => status.isLoaded))
      ) {
        try {
          await soundRef.current.stopAsync()
          await soundRef.current.unloadAsync()
        } catch (e) {
          logger.debug("Error stopping voice streaming:", e)
        }
      }
      queuedContentRef.current.forEach(cleanupCachedFile)
      queuedContentRef.current = []
    }, [soundRef])

    /**
     * Respond to state changes to stop voice streaming if necessary.
     */
    useEffect(() => {
      void (async () => {
        if (
          audioError &&
          audioModeState !== AudioModeState.IDLE &&
          audioModeState !== AudioModeState.LOADING
        ) {
          await stopVoiceStreaming()
          setAudioModeState(AudioModeState.IDLE)
        } else if (
          isPlayingRef.current &&
          audioModeState !== AudioModeState.PROMPTING &&
          audioModeState !== AudioModeState.PLAYING
        ) {
          await stopVoiceStreaming()
        }
      })()
    }, [audioError, audioModeState, setAudioModeState, stopVoiceStreaming])

    /**
     * We take a blob of audio data and save it to local cache, then play it from there.
     * This function cleans up the cached audio file. Since content is chunked, there may be
     * multiple files to clean up if playback was stopped prematurely or an error occurred.
     */
    const cleanupCachedFile = (cachedContent: ContentChunk) => {
      const audioFileUri = cachedContent.audioUri
      if (audioFileUri && audioFileUri.length > 0) {
        ReactNativeBlobUtil.fs.unlink(audioFileUri).catch((error: unknown) => {
          logger.debug("Error deleting temp file in cleanup:", error)
          Sentry.captureException(error)
        })
      }
    }

    /**
     * Play a voice speech locally on the device. Does not use a server TTS call.
     */
    const playLocalVoiceSpeech = useCallback(
      async (input: string) => {
        const voices = await Speech.getAvailableVoicesAsync()
        const enUSVoice = voices.find((v) => v.language === "en-US")
        if (enUSVoice) {
          const speechOptions = {
            voice: enUSVoice.identifier,
            onBoundary: () => {
              if (!isPlayingRef.current) {
                void Speech.stop()
              }
            },
            onDone: () => {
              setAudioModeState(AudioModeState.IDLE)
            }
          }
          Speech.speak(input, speechOptions)
          isPlayingRef.current = true
          setVolume(0)
          setAudioModeState(AudioModeState.PLAYING)
        } else if (setAudioError) {
          setAudioError(new Error("No retro voice is available."))
        }
      },
      [setAudioError, setAudioModeState, setVolume]
    )

    /**
     * Plays the next queued audio file. If there is no audio, it will enter the IDLE state.
     */
    const playNextQueuedAudio = useCallback(async () => {
      if (isPlayingRef.current) return

      if (queuedContentRef.current.length > 0) {
        if (!queuedContentRef.current[0]?.audioUri) return

        const queuedContent = queuedContentRef.current.shift()
        if (!queuedContent) return

        if (voice.provider === "local") {
          if (queuedContent.content)
            await playLocalVoiceSpeech(queuedContent.content)
          return
        }

        isPlayingRef.current = true
        setAudioModeState(AudioModeState.PLAYING)

        if (!soundRef.current) {
          soundRef.current = new Audio.Sound()
        } else {
          await soundRef.current.unloadAsync()
        }

        try {
          await soundRef.current.loadAsync(
            { uri: `file://${queuedContent.audioUri}` },
            { shouldPlay: true },
            false
          )

          setVolume(0)
          soundRef.current.setOnPlaybackStatusUpdate(
            async (playbackStatus: AVPlaybackStatus) => {
              if ((playbackStatus as AVPlaybackStatusSuccess).didJustFinish) {
                cleanupCachedFile(queuedContent)
                isPlayingRef.current = false
                await playNextQueuedAudio()
              }
            }
          )

          soundRef.current.setOnAudioSampleReceived((sample: AudioSample) => {
            const audioData = sample.channels[0]?.frames
            if (audioData) {
              setSampleData(audioData)
            }
          })
        } catch (error) {
          logger.debug("Error playing audio file:", error)
          Sentry.captureException(error)
          isPlayingRef.current = false
          setAudioModeState(AudioModeState.IDLE)
          cleanupCachedFile(queuedContent)
          if (setAudioError)
            setAudioError(new Error("Voice playback stopped unexpectedly"))
        }
      } else {
        isPlayingRef.current = false
        setAudioModeState(AudioModeState.IDLE)
      }
    }, [
      voice.provider,
      setAudioModeState,
      playLocalVoiceSpeech,
      setVolume,
      setSampleData,
      setAudioError
    ])

    /**
     * Fetches a chunk of audio data from the server and queues it for playback.
     */
    const fetchAudioChunk = useCallback(
      async (input: string | ContentChunk) => {
        // we are either queuing new content or downloading audio for existing queued content
        let queuedContent: ContentChunk
        if (typeof input === "string") {
          queuedContent = { content: input }
          queuedContentRef.current.push(queuedContent)
        } else {
          queuedContent = input
          // if we already have a uri for this content, we're done (this should not happen)
          if (queuedContent.audioUri) return
        }

        // local voice doesn't need a server trip
        if (voice.provider === "local") {
          void playNextQueuedAudio()
          return
        }

        try {
          if (isDownloadingRef.current) return
          isDownloadingRef.current = true

          const response = await ReactNativeBlobUtil.config({
            fileCache: true,
            appendExt: voice.outputFormat ?? "mp3"
          }).fetch(
            "POST",
            `${AUDIO_CHAT_API_URL}/tts`,
            {
              "Content-Type": "application/json",
              ...apiHeaders
            },
            JSON.stringify({
              text: queuedContent.content,
              provider: voice.provider,
              voiceId: voice.voiceId,
              isMidStream: queuedContentRef.current.length > 0,
              access: audioAccessStatus.body
            })
          )

          // the download either landed an audio file in a temp location or failed
          const { status } = response.respInfo
          if (status !== 200) {
            throw new Error(
              `Voice streaming is currently unavailable: ${status}`
            )
          }
          queuedContent.audioUri = response.path()
          isDownloadingRef.current = false

          // try to play the downloaded chunk
          void playNextQueuedAudio()

          // get the next queued content that is missing an audioUri and fetch its audio
          const nextContent = queuedContentRef.current.find((c) => !c.audioUri)
          if (nextContent) {
            await fetchAudioChunk(nextContent)
          }
        } catch (error) {
          Sentry.captureException(error)
          isDownloadingRef.current = false
          if (setAudioError) {
            setAudioError(error as Error)
          }
        }
      },
      [
        voice,
        apiHeaders,
        audioAccessStatus.body,
        playNextQueuedAudio,
        setAudioError
      ]
    )

    /**
     * This hook monitors chat message output and streams the text to speech audio.
     * It chunks content into audio-friendly sizes and plays them sequentially.
     */
    useEffect(() => {
      if (
        messages.length === 0 ||
        (audioModeState !== AudioModeState.PROMPTING &&
          audioModeState !== AudioModeState.PLAYING)
      ) {
        return
      }

      const isStreaming =
        isLoading && messages[messages.length - 1]?.role === "assistant"
      if (!wasStreaming.current && !isStreaming) return

      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.role !== "assistant") return

      let currentIndex = lastProcessedCharacterIndex.current

      if (isStreaming && !wasStreaming.current) {
        wasStreaming.current = true
        lastProcessedCharacterIndex.current = 0
        currentIndex = 0
        queuedContentRef.current = []
        isPlayingRef.current = false
        return
      }

      const newContent = lastMessage.content.slice(currentIndex).trim()
      const newContentLength = newContent.length
      const splitCharacters = [".", ";", "\n"]

      if (
        !isStreaming &&
        newContentLength > 0 &&
        !splitCharacters.includes(newContent)
      ) {
        // if streaming has completed and there is remaining message content to play:
        void fetchAudioChunk(newContent)
      } else if (
        newContentLength >= MIN_CHUNK_SIZE &&
        splitCharacters.some((char) => newContent.includes(char))
      ) {
        // if we're over the min size for an audio chunk and there is a good splitting character somewhere:
        const splitIndex = Math.max(
          ...splitCharacters.map((char) => newContent.lastIndexOf(char))
        )
        // ensure contentChunk is at least MIN_CHUNK_SIZE
        const endIndex = splitIndex + 1
        if (endIndex > MIN_CHUNK_SIZE) {
          const contentChunk = newContent.slice(0, endIndex).trim()
          void fetchAudioChunk(contentChunk)
          currentIndex += endIndex
          lastProcessedCharacterIndex.current = currentIndex
        }
      } else if (newContentLength >= MAX_CHUNK_SIZE) {
        const contentChunk = newContent.slice(0, MIN_CHUNK_SIZE).trim()
        void fetchAudioChunk(contentChunk)
        currentIndex += MAX_CHUNK_SIZE
        lastProcessedCharacterIndex.current = currentIndex
      }

      if (!isStreaming && wasStreaming.current) {
        wasStreaming.current = false
      }
    }, [
      audioModeState,
      messages,
      isLoading,
      fetchAudioChunk,
      playNextQueuedAudio
    ])

    /**
     * This is a non-visual component. The UI is handled by the parent component.
     * Volume and other audio events are surfaced to visualizers through the function properties, such as setVolume.
     */
    return null
  }
)

TextToSpeechComponent.displayName = "TextToSpeech"

export const TextToSpeech = TextToSpeechComponent
