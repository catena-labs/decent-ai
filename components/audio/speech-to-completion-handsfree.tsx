import * as Sentry from "@sentry/react-native"
import { Audio } from "expo-av"
import { type Recording } from "expo-av/build/Audio"
import * as FileSystem from "expo-file-system"
import { usePostHog } from "posthog-react-native"
import { useCallback, useEffect, useRef, useState } from "react"
import { Alert } from "react-native"

import { useSTTAccessStatus } from "@/hooks/use-audio-access"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { createLogger } from "@/lib/logger"
import {
  isHeadphonesConnected,
  trimAudioFile
} from "@/modules/native-audio-module"

import {
  AUDIO_DATA_PREFIX,
  AudioModeRecordingOptions,
  AudioModeState,
  RECORDING_MAX_DURATION,
  RECORDING_SILENCE_HANDSFREE_MAX_MILLIS,
  RECORDING_VOLUME_FLOOR
} from "./audio-mode-constants"

const logger = createLogger("components:audio:speech-to-completion-handsfree")

type SpeechToCompletionProps = {
  audioModeState?: AudioModeState
  onMessageSend: (message: string) => void
  setVolume?: (volume: number) => void
  setAudioError?: (error: Error | undefined) => void
  setAudioModeState?: (state: AudioModeState) => void
  stop: () => void
}

export function SpeechToCompletionHandsFree({
  audioModeState,
  onMessageSend,
  setAudioError,
  setAudioModeState,
  setVolume,
  stop
}: SpeechToCompletionProps) {
  const isListeningRef = useRef(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const speechRecording = useRef<Recording | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastVolumeTime = useRef<number>(0)
  const isRecordingAboveVolumeFloor = useRef<boolean>(false)
  const posthog = usePostHog()
  const retryTranscriptionAttempt = useRef<number>(0)
  const isStoppingRef = useRef<boolean>(false)
  const listenStartTime = useRef<number>(0)
  const recordingStartTime = useRef<number | null>(null)

  // make audio mode state available to callbacks that memoize the state at closure creation time
  const latestAudioModeState = useRef(audioModeState)

  /** Rules for access to STT are defined server-side */
  const sttAccessStatus = useSTTAccessStatus()

  /** Android permissions checking is extremely slow, so we track whether we've done it */
  const hasPermissions = useRef<boolean>(false)

  const MAX_RETRY_ATTEMPTS = 3
  const RETRY_BASE_DELAY = 500
  const MIN_RECORDING_DURATION = 1600

  /**
   * Get the appropriate permissions for recording from the device's mic.
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      hasPermissions.current =
        permission.status === Audio.PermissionStatus.GRANTED
      if (!hasPermissions.current) {
        logger.warn("Audio permissions not granted")
      }
    } catch (error) {
      logger.error("Error requesting audio permissions:", error)
      Sentry.captureException(error)
    }
    return hasPermissions.current
  }, [])

  /**
   * Deallocate the Recording instance and delete any file created.
   */
  const cleanupAudio = useCallback(async () => {
    if (speechRecording.current) {
      try {
        await speechRecording.current.stopAndUnloadAsync()
      } catch (e) {
        logger.debug("Error unloading recording on cleanup:", e)
      }
      try {
        const fileUri = speechRecording.current.getURI()
        speechRecording.current = null
        if (fileUri) {
          await FileSystem.deleteAsync(fileUri)
        }
      } catch (e) {
        logger.debug("Error removing temp file on cleanup:", e)
      }
    }
  }, [])

  /**
   * Send the recorded audio to the API.
   */
  const sendAudioMessage = useCallback(
    async (fileUri: string) => {
      if (isTranscribing) return
      setIsTranscribing(true)
      if (setAudioModeState) setAudioModeState(AudioModeState.PROMPTING)

      try {
        const fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64
        })
        onMessageSend(`${AUDIO_DATA_PREFIX}${fileData}`)
        retryTranscriptionAttempt.current = 0
      } catch (error) {
        const errMsg =
          typeof error === "string" ? error : (error as Error).message
        const retriableError = "Network request failed: Stream Closed"
        if (
          errMsg.includes(retriableError) &&
          retryTranscriptionAttempt.current < MAX_RETRY_ATTEMPTS
        ) {
          const delay =
            RETRY_BASE_DELAY * 2 ** retryTranscriptionAttempt.current
          logger.error(
            `Retrying transcription attempt #${
              retryTranscriptionAttempt.current + 1
            } after ${delay}ms`
          )
          retryTranscriptionAttempt.current += 1
          setTimeout(() => {
            void sendAudioMessage(fileUri)
          }, delay)
        } else {
          logger.error("Failed to send audio message:", error)
          Sentry.captureException(error)
          if (setAudioError)
            setAudioError(new Error("Sorry, audio was not available."))
          if (setAudioModeState) setAudioModeState(AudioModeState.IDLE)
        }
      } finally {
        try {
          await FileSystem.deleteAsync(fileUri)
        } catch (e) {
          logger.error("Error deleting audio file:", e)
        }
        setIsTranscribing(false)
      }
    },
    [isTranscribing, setAudioModeState, onMessageSend, setAudioError]
  )

  /**
   * Stop recording audio, cleanup, and start transcription.
   */
  const stopRecording = useCallback(async () => {
    if (isStoppingRef.current) return
    isStoppingRef.current = true

    try {
      if (speechRecording.current) {
        logger.debug("Recording stopped")
        await speechRecording.current.stopAndUnloadAsync()

        await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
        const fileUri = speechRecording.current.getURI()
        speechRecording.current = null

        if (fileUri) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(fileUri)
            const recordingDuration = recordingStartTime.current
              ? Date.now() - recordingStartTime.current
              : 0

            if (
              fileInfo.exists &&
              fileInfo.size > 12 * 1024 &&
              isRecordingAboveVolumeFloor.current &&
              recordingDuration >= MIN_RECORDING_DURATION
            ) {
              // determine whether we need to trim the recorded audio to eliminate the 'listening' audio prior to speech being noticed
              if (listenStartTime.current && recordingStartTime.current) {
                const trimStart =
                  recordingStartTime.current - listenStartTime.current
                if (trimStart > 0) {
                  const trimmedFileUri = await trimAudioFile(
                    fileUri,
                    trimStart,
                    recordingDuration
                  )
                  await sendAudioMessage(trimmedFileUri)
                  // the trimmed uri may be the same as the original if the trim failed or was not deemed necessary by the native module
                  if (trimmedFileUri !== fileUri) {
                    try {
                      await FileSystem.deleteAsync(fileUri)
                    } catch (e) {
                      logger.error("Error deleting original audio file:", e)
                    }
                  }
                } else {
                  // we did not have to trim the audio
                  await sendAudioMessage(fileUri)
                }
              }
            } else {
              logger.debug(
                `Recording discarded. Duration: ${recordingDuration}ms, Above floor: ${isRecordingAboveVolumeFloor.current}`
              )
              void startListening()
            }
          } catch (error) {
            logger.error("Error processing audio file:", error)
            Sentry.captureException(error)
          }
        } else {
          logger.warn("No file URI available after stopping recording")
        }
      } else {
        logger.debug(
          "Attempted to stop recording, but no active recording found"
        )
      }
    } catch (e) {
      logger.error("Error stopping recording:", e)
      Sentry.captureException(e)
    } finally {
      setIsRecording(false)
      isStoppingRef.current = false
      recordingStartTime.current = null
      isRecordingAboveVolumeFloor.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to exclude the startListening dependency
  }, [sendAudioMessage, audioModeState])

  const stopListening = useCallback(async () => {
    if (!isListeningRef.current) return

    isListeningRef.current = false

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }

    await stopRecording()
  }, [stopRecording])

  const handleSilence = useCallback(() => {
    void stopListening()
  }, [stopListening])

  const resetSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
    }
    silenceTimeoutRef.current = setTimeout(
      handleSilence,
      RECORDING_SILENCE_HANDSFREE_MAX_MILLIS
    )
  }, [handleSilence])

  /**
   * Use recording status updates to handle volume and state events.
   */
  const handleRecordingStatusUpdate = useCallback(
    (status: Audio.RecordingStatus) => {
      const currentAudioModeState = latestAudioModeState.current
      if (
        status.isRecording &&
        status.metering &&
        (currentAudioModeState === AudioModeState.IDLE ||
          currentAudioModeState === AudioModeState.RECORDING ||
          (isHeadphonesConnected() &&
            currentAudioModeState === AudioModeState.PLAYING))
      ) {
        // enforce a max time on both listening and recording
        const currentTime = Date.now()
        const timeoutRefTime =
          currentAudioModeState === AudioModeState.IDLE
            ? listenStartTime.current
            : recordingStartTime.current
        if (
          timeoutRefTime &&
          currentTime - timeoutRefTime > RECORDING_MAX_DURATION
        ) {
          void stopListening()
        }

        // volume state changes are observed by visualizer components
        if (isRecordingAboveVolumeFloor.current && setVolume) {
          setVolume(status.metering)
        }

        if (status.metering > RECORDING_VOLUME_FLOOR) {
          // update timer for silence detection every 100ms
          if (currentTime - lastVolumeTime.current > 100) {
            lastVolumeTime.current = currentTime
            resetSilenceTimeout()
          }

          // if we are above the noise floor now but were not before, then we just started recording meaningful sound
          if (!isRecordingAboveVolumeFloor.current) {
            // udpate both internal ref and shared state
            isRecordingAboveVolumeFloor.current = true
            setIsRecording(true)
            if (setAudioModeState) {
              setAudioModeState(AudioModeState.RECORDING)
            }

            // reference recording start time to handle silence and timeout checks, using a buffer
            recordingStartTime.current = currentTime - 2000
            // stop any in-progress streaming llm response
            stop()
            // clear any existing error reporting
            if (setAudioError) setAudioError(undefined)

            // log the start of recording
            logger.debug("Recording started")
            posthog.capture(ANALYTICS_EVENTS.SPEECH_TO_TEXT)
          }
        }
      } else if (!status.isRecording && isRecording) {
        logger.debug("Recording stopped unexpectedly")
        void stopListening()
      }
    },
    [
      isRecording,
      setVolume,
      stopListening,
      resetSilenceTimeout,
      setAudioModeState,
      stop,
      setAudioError,
      posthog
    ]
  )

  /**
   * Start listening on the mic to determine whether to capture recording.
   */
  const startListening = useCallback(async () => {
    if (isListeningRef.current) {
      return
    }
    if (sttAccessStatus.status !== 200) {
      Alert.alert(
        sttAccessStatus.body ??
          "Sorry, voice translation is currently unavailable"
      )
      return
    }

    isListeningRef.current = true
    isRecordingAboveVolumeFloor.current = false
    lastVolumeTime.current = Date.now()
    listenStartTime.current = lastVolumeTime.current

    try {
      if (!hasPermissions.current) {
        const grantedPermission = await requestPermissions()
        if (!grantedPermission) {
          isListeningRef.current = false
          return
        }
      }

      // create the recording instance
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false
      })

      // clear any previous error
      if (setAudioError) setAudioError(undefined)

      // reset noise floor
      isRecordingAboveVolumeFloor.current = false

      if (speechRecording.current) {
        try {
          // on a crtical underlying audio system error, the previous recording instance may not have been unloaded
          // it's impossible to have more than one instance in this state, so we unload it if it exists
          await speechRecording.current.stopAndUnloadAsync()
        } catch (e) {
          logger.error("Error stopping previous recording:", e)
        }
        speechRecording.current = null
      }

      // create the recording instance
      const { recording } = await Audio.Recording.createAsync(
        AudioModeRecordingOptions,
        handleRecordingStatusUpdate,
        20
      )
      speechRecording.current = recording
      logger.debug("Started listening")
    } catch (error) {
      logger.error("Error starting recording:", error)
      Sentry.captureException(error)
      if (setAudioError) setAudioError(new Error("Unable to record!"))
      if (setAudioModeState) setAudioModeState(AudioModeState.IDLE)
      isListeningRef.current = false
    }
  }, [
    sttAccessStatus,
    setAudioError,
    handleRecordingStatusUpdate,
    requestPermissions,
    setAudioModeState
  ])

  useEffect(() => {
    if (!hasPermissions.current) {
      logger.debug("Requesting audio permissions")
      void requestPermissions().catch((error: unknown) => {
        logger.error("Error requesting permissions:", error)
        Sentry.captureException(error)
      })
    }
  }, [requestPermissions])

  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = null
      }
      void cleanupAudio()
    }
  }, [cleanupAudio])

  useEffect(() => {
    latestAudioModeState.current = audioModeState
    if (
      !isListeningRef.current &&
      (audioModeState === AudioModeState.IDLE ||
        (isHeadphonesConnected() && audioModeState === AudioModeState.PLAYING))
    ) {
      void startListening().catch((err: unknown) => {
        if (setAudioError)
          setAudioError(new Error("Unable to listen for audio"))
        else logger.error("Error starting listening:", err)
        Sentry.captureException(err)
      })
    } else if (
      audioModeState === AudioModeState.INACTIVE &&
      isListeningRef.current
    ) {
      void stopListening().catch((err: unknown) => {
        logger.error("Error stopping listening:", err)
        Sentry.captureException(err)
      })
    }
  }, [audioModeState, setAudioError, startListening, stopListening])

  return null
}
