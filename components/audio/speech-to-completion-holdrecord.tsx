import * as Sentry from "@sentry/react-native"
import { Audio } from "expo-av"
import { type Recording } from "expo-av/build/Audio"
import * as FileSystem from "expo-file-system"
import { usePostHog } from "posthog-react-native"
import { useCallback, useEffect, useRef, useState } from "react"
import { Alert } from "react-native"

import { useSTTAccessStatus } from "@/hooks/use-audio-access"
import { createLogger } from "@/lib/logger"

import {
  AUDIO_DATA_PREFIX,
  AudioModeRecordingOptions,
  AudioModeState,
  RECORDING_SILENCE_CHECK_INTERVAL,
  RECORDING_SILENCE_MAX_MILLIS,
  RECORDING_VOLUME_FLOOR
} from "./audio-mode-constants"

const logger = createLogger("components:audio:speech-to-completion-holdrecord")

type SpeechToSpeechProps = {
  audioModeState?: AudioModeState
  ignoreSilence?: boolean
  onMessageSend: (message: string) => void
  setVolume?: (volume: number) => void
  setAudioError?: (error: Error | undefined) => void
  setAudioModeState?: (state: AudioModeState) => void
}

/**
 * This component records audio and passes it to the chat completion endpoint,
 * where it will be transcribed and then used as text input for LLM completion.
 */
export function SpeechToCompletionHoldRecord({
  audioModeState,
  ignoreSilence,
  onMessageSend,
  setAudioError,
  setAudioModeState,
  setVolume
}: SpeechToSpeechProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [speechRecording, setSpeechRecording] = useState<Recording>()
  const timeoutId = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const lastVolumeTime = useRef<number>(0)
  const isRecordingAboveVolumeFloor = useRef<boolean>(false)
  const silenceDetectorRef = useRef<NodeJS.Timeout | null>(null)
  const posthog = usePostHog()
  const retryTranscriptionAttempt = useRef(0)

  /** Rules for access to STT are defined server-side */
  const sttAccessStatus = useSTTAccessStatus()

  /** Android permissions checking is extremely slow, so we track whether we've done it */
  const hasPermissions = useRef(false)

  /**
   * Get the appropriate permissions for recording from the device's mic.
   */
  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      hasPermissions.current =
        permission.status === Audio.PermissionStatus.GRANTED
    } catch (error) {
      /* empty */
    }
    return hasPermissions.current
  }

  /**
   * Setup Audio and request permissions when the component mounts. This is very slow on Android.
   */
  useEffect(() => {
    if (!hasPermissions.current) {
      logger.debug("Requesting audio permissions")
      void requestPermissions()
    }
  }, [])

  /**
   * Captrue the recorded audio and send it to the API.
   */
  const sendAudioMessage = useCallback(
    async (fileUri: string) => {
      if (isTranscribing) return
      setIsTranscribing(true)
      if (setAudioModeState) setAudioModeState(AudioModeState.PROMPTING)

      try {
        // note we've already verified the file exists and is of minimal audio size
        const fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64
        })
        try {
          onMessageSend(`${AUDIO_DATA_PREFIX}${fileData}`)
        } catch (err) {
          logger.error("Error sending audio mode prompt input:", err)
        }
        posthog.capture("speech_to_text_transcribed")
      } catch (error) {
        // retry the transcription if the network stream failed, this is an occasional android timing issue
        const errMsg =
          typeof error === "string" ? error : (error as Error).message
        const retriableError = "Network request failed: Stream Closed"
        if (
          errMsg.includes(retriableError) &&
          retryTranscriptionAttempt.current < 1
        ) {
          retryTranscriptionAttempt.current++
          setTimeout(async () => {
            await sendAudioMessage(fileUri)
          }, 600)
        } else {
          Sentry.captureException(error)
          if (setAudioError)
            setAudioError(new Error("Sorry, audio was not available."))
          if (setAudioModeState) setAudioModeState(AudioModeState.IDLE)
        }
      } finally {
        setIsTranscribing(false)
        if (fileUri)
          try {
            await FileSystem.deleteAsync(fileUri)
          } catch (e) {
            /* empty */
          }
      }
    },
    [isTranscribing, setAudioModeState, onMessageSend, posthog, setAudioError]
  )

  /**
   * Stop recording audio, cleanup, and start transcription.
   */
  const stopRecording = useCallback(
    async (localRecordingInstance?: Recording) => {
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
        timeoutId.current = null
      }
      if (silenceDetectorRef.current) {
        clearInterval(silenceDetectorRef.current)
        silenceDetectorRef.current = null
      }

      const recordingInstance = speechRecording ?? localRecordingInstance
      if (recordingInstance === undefined) return

      try {
        await recordingInstance.stopAndUnloadAsync()
      } catch (e) {
        /* empty */
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
      const fileUri = recordingInstance.getURI()
      setSpeechRecording(undefined)

      if (!fileUri || !isRecordingAboveVolumeFloor.current) {
        // either the recording didn't persist or the volume was too low
        if (fileUri)
          try {
            await FileSystem.deleteAsync(fileUri)
          } catch (e) {
            /* empty */
          }
        if (setAudioModeState) setAudioModeState(AudioModeState.IDLE)
        if (setAudioError) {
          setAudioError(new Error("Apologies, I could not hear you"))
        }
      } else {
        // we stopped either by user action or silence
        // if we have a recording file, see if it's large enough to transcribe
        const fileInfo = await FileSystem.getInfoAsync(fileUri)
        if (fileInfo.exists && fileInfo.size > 12 * 1024) {
          retryTranscriptionAttempt.current = 0
          await sendAudioMessage(fileUri)
        } else if (setAudioModeState) {
          setAudioModeState(AudioModeState.IDLE)
        }
      }
    },
    [setAudioError, setAudioModeState, speechRecording, sendAudioMessage]
  )

  /**
   * Start recording audio. This is the primary mic and recording logic.
   */
  const startRecording = useCallback(async () => {
    if (isRecording) return

    if (sttAccessStatus.status !== 200) {
      Alert.alert(
        sttAccessStatus.body ??
          "Sorry, voice translation is currently unavailable"
      )
      return
    }

    setIsRecording(true)

    try {
      if (!hasPermissions.current) {
        const grantedPermission = await requestPermissions()
        if (!grantedPermission) {
          await stopRecording()
          return
        }
      }

      // prepare audio settings for recording, speaker playback, playing in silence, and active in background
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false
      })

      // create the recording instance
      if (setAudioError) setAudioError(undefined)
      if (speechRecording) {
        // on a crtical underlying audio system error, the previous recording instance may not have been unloaded
        // it's impossible to have more than one instance in this state, so we unload it if it exists
        try {
          await speechRecording.stopAndUnloadAsync()
        } catch (e) {
          /* empty */
        }
      }
      const { recording } = await Audio.Recording.createAsync(
        AudioModeRecordingOptions,
        null,
        20
      )
      setSpeechRecording(recording)

      // begin recording
      isRecordingAboveVolumeFloor.current = false
      posthog.capture("speech_to_text_start")

      // capture volume events, note it is called according to the progressUpdateIntervalMillis set in the recording options
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering) {
          // send vol event to any callbacks passed by the parent component (such as visualizations in audio mode)
          if (setVolume) {
            setVolume(status.metering)
          }
          if (status.metering > RECORDING_VOLUME_FLOOR) {
            isRecordingAboveVolumeFloor.current = true
            lastVolumeTime.current = Date.now()
          }
        }
      })

      // set a timeout to stop recording if the volume level was above the threshold, but has been below it for the time interval
      // note these intervals do not run consistently when audio mode is handling its pressIn action, so audio mode has a separate silence check
      if (!ignoreSilence) {
        lastVolumeTime.current = Date.now()
        silenceDetectorRef.current = setInterval(async () => {
          if (
            Date.now() - lastVolumeTime.current >=
            RECORDING_SILENCE_MAX_MILLIS
          ) {
            await stopRecording(recording)
          }
        }, RECORDING_SILENCE_CHECK_INTERVAL)
      }

      // 30 seconds max recording time
      timeoutId.current = setTimeout(async () => {
        await stopRecording()
      }, 10500)
    } catch (error) {
      logger.error("Error starting recording", error)
      Sentry.captureException(error)
      if (setAudioError) setAudioError(error as Error)
      await stopRecording()
      if (setAudioModeState) setAudioModeState(AudioModeState.IDLE)
    }
  }, [
    ignoreSilence,
    isRecording,
    posthog,
    setAudioError,
    setAudioModeState,
    setVolume,
    speechRecording,
    stopRecording,
    sttAccessStatus
  ])

  /**
   * This effect handles cleanup when the component unmounts.
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      if (silenceDetectorRef.current) {
        clearInterval(silenceDetectorRef.current)
      }
      if (speechRecording && !speechRecording._isDoneRecording) {
        void speechRecording.stopAndUnloadAsync()
      }
    }
  }, [speechRecording])

  /**
   * In response to state changes, handle recording starts.
   */
  useEffect(() => {
    const startRecordingOnStateChange = async () => {
      if (audioModeState === AudioModeState.RECORDING && !isRecording) {
        await startRecording()
      }
    }
    startRecordingOnStateChange().catch((err: unknown) => {
      if (setAudioError) setAudioError(err as Error)
      else logger.error("Error starting recording:", err)
      Sentry.captureException(err)
    })
  }, [
    audioModeState,
    isRecording,
    setAudioError,
    setAudioModeState,
    startRecording
  ])

  /**
   * In response to state changes, handle recording stops.
   */
  useEffect(() => {
    const stopRecordingOnStateChange = async () => {
      if (audioModeState === AudioModeState.STOPRECORDING) {
        if (isRecording) await stopRecording()
      }
    }
    stopRecordingOnStateChange().catch((err: unknown) => {
      if (setAudioError) setAudioError(err as Error)
      else logger.error("Error stopping recording:", err)
      Sentry.captureException(err)
    })
  }, [
    audioModeState,
    isRecording,
    setAudioError,
    setAudioModeState,
    stopRecording
  ])

  return null
}
