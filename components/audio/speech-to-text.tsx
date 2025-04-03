import * as Sentry from "@sentry/react-native"
import { Audio } from "expo-av"
import { type Recording } from "expo-av/build/Audio"
import * as FileSystem from "expo-file-system"
import { usePostHog } from "posthog-react-native"
import { useCallback, useEffect, useRef, useState } from "react"
import { Alert, Animated, Pressable } from "react-native"
import Svg, { Path } from "react-native-svg"

import { View } from "@/components/elements/view"
import { useApiClient } from "@/hooks/api-client/use-api-client"
import { useSTTAccessStatus } from "@/hooks/use-audio-access"
import { useColors } from "@/hooks/use-colors"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { createLogger } from "@/lib/logger"

import {
  AudioModeRecordingOptions,
  AudioModeState,
  RECORDING_SILENCE_CHECK_INTERVAL,
  RECORDING_SILENCE_MAX_MILLIS,
  RECORDING_VOLUME_FLOOR
} from "./audio-mode-constants"
import { ActivityIndicator } from "../elements/activity-indicator"

const logger = createLogger("components:audio:speech-to-text")

type SpeechToTextProps = {
  audioModeState?: AudioModeState
  ignoreSilence?: boolean
  initialPlaceholder?: string
  isAudioMode?: boolean
  onMessageSend?: (text: string) => void
  setVolume?: (volume: number) => void
  setAudioError?: (error: Error | undefined) => void
  setAudioModeState?: (state: AudioModeState) => void
  setInput?: (text: string) => void
  setInputPlaceholder?: (text: string) => void
}

/**
 * This component provides a button to start recording audio and transcribe it to text.
 * It can also be used without any visual components, such as when it is used in Audio Mode.
 */
export function SpeechToText({
  audioModeState,
  ignoreSilence,
  initialPlaceholder,
  isAudioMode = false,
  onMessageSend,
  setAudioError,
  setAudioModeState,
  setInput,
  setInputPlaceholder,
  setVolume
}: SpeechToTextProps) {
  const apiClient = useApiClient()
  const colors = useColors()
  const [isRecording, setIsRecording] = useState(false)
  const [speechRecording, setSpeechRecording] = useState<Recording>()
  const timeoutId = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const lastTranscribedInput = useRef<string>("")
  const lastVolumeTime = useRef<number>(0)
  const isRecordingAboveVolumeFloor = useRef<boolean>(false)
  const silenceDetectorRef = useRef<NodeJS.Timeout | null>(null)
  const posthog = usePostHog()
  const retryTranscriptionAttempt = useRef(0)

  /** Rules for access to STT are defined server-side */
  const sttAccessStatus = useSTTAccessStatus()

  /** Android permissions checking is extremely slow, so we track whether we've done it */
  const hasPermissions = useRef(false)

  /** Color animation when not in audio mode */
  const colorAnim = useRef(new Animated.Value(0)).current
  const color = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      colors["muted-foreground"],
      colors.inverted["muted-foreground"]
    ]
  })

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
    if (!hasPermissions.current && isAudioMode) {
      void requestPermissions()
    }
  }, [isAudioMode])

  /**
   * Toggle the recording state.
   */
  const toggleRecordingState = async () => {
    if (isRecording) {
      posthog.capture(ANALYTICS_EVENTS.STT_STOPPED)
      await stopRecording()
    } else {
      posthog.capture(ANALYTICS_EVENTS.STT_INITIATED)
      await startRecording()
    }
  }

  /**
   * Transcribe recorded audio to text. If in Audio Mode, send the transcription as a prompt.
   */
  const transcribe = useCallback(
    async (fileUri: string) => {
      if (isTranscribing) return
      setIsTranscribing(true)

      try {
        if (setAudioModeState) setAudioModeState(AudioModeState.TRANSCRIBING)

        // note we've already verified the file exists and is of minimal audio size

        const fileData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64
        })
        const requestData = {
          fileName: `${Date.now()}.m4a`,
          audioData: `data:audio/m4a;base64,${fileData}`,
          accessToken: sttAccessStatus.body ?? ""
        }
        const response = await apiClient.fetch(`/api/audio/chat/stt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestData)
        })

        const transcribedInput = (await response.json()) as string
        lastTranscribedInput.current = transcribedInput
        if (!isAudioMode) {
          if (setInput) setInput(transcribedInput)
          if (setInputPlaceholder) setInputPlaceholder(initialPlaceholder ?? "")
        } else {
          if (setInput) setInput("")
          if (setAudioModeState) setAudioModeState(AudioModeState.PROMPTING)
          if (onMessageSend) {
            try {
              onMessageSend(transcribedInput)
            } catch (err) {
              logger.error("Error sending audio mode prompt input:", err)
            }
          }
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
            await transcribe(fileUri)
          }, 600)
        } else {
          Sentry.captureException(error)
          if (setAudioError)
            setAudioError(new Error("Sorry, audio was not available."))
        }
      } finally {
        setIsTranscribing(false)
        if (setInputPlaceholder) setInputPlaceholder(initialPlaceholder ?? "")
        if (fileUri)
          try {
            await FileSystem.deleteAsync(fileUri)
          } catch (e) {
            /* empty */
          }
      }
    },
    [
      isTranscribing,
      setAudioModeState,
      sttAccessStatus.body,
      apiClient,
      isAudioMode,
      posthog,
      setInput,
      setInputPlaceholder,
      initialPlaceholder,
      onMessageSend,
      setAudioError
    ]
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
        if (setInputPlaceholder) setInputPlaceholder(initialPlaceholder ?? "")
        if (fileUri)
          try {
            await FileSystem.deleteAsync(fileUri)
          } catch (e) {
            /* empty */
          }
        if (setAudioModeState) setAudioModeState(AudioModeState.IDLE)
        if (setAudioError) {
          setAudioError(
            new Error("Sorry, I didn't hear you. Please try again.")
          )
        }
      } else {
        // we stopped either by user action or silence
        // if we have a recording file, see if it's large enough to transcribe
        const fileInfo = await FileSystem.getInfoAsync(fileUri)
        if (fileInfo.exists && fileInfo.size > 12 * 1024) {
          retryTranscriptionAttempt.current = 0
          await transcribe(fileUri)
        } else {
          if (setInputPlaceholder) setInputPlaceholder(initialPlaceholder ?? "")
          if (setAudioModeState) setAudioModeState(AudioModeState.IDLE)
        }
      }
    },
    [
      initialPlaceholder,
      setAudioError,
      setAudioModeState,
      setInputPlaceholder,
      speechRecording,
      transcribe
    ]
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
      if (setInputPlaceholder) setInputPlaceholder("")
      posthog.capture("speech_to_text_start")

      // capture volume events, note it is called according to the progressUpdateIntervalMillis set in the recording options
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering) {
          // send vol event to any callbacks passed by the parent component
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
        if (silenceDetectorRef.current) {
          clearInterval(silenceDetectorRef.current)
        }
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

      // 20 seconds max recording time
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
      timeoutId.current = setTimeout(async () => {
        await stopRecording()
      }, 20500)
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
    setInputPlaceholder,
    setVolume,
    speechRecording,
    stopRecording,
    sttAccessStatus
  ])

  useEffect(() => {
    const avoidTwoRecordingInstances = async () => {
      if (setInputPlaceholder && isAudioMode) {
        // if we were listening or transcribing but are now in audio mode, stop
        await stopRecording()
      }
    }
    void avoidTwoRecordingInstances()
  }, [isAudioMode, setInputPlaceholder, stopRecording])

  /**
   * This effect handles cleanup when the component unmounts.
   */
  useEffect(() => {
    // handle general cleanup when the component unmounts
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
    }
  }, [])

  /**
   * In response to state changes, handle recording starts.
   */
  useEffect(() => {
    // TESTING: Use this snip to test without mic (mic does not work in simulator)
    /*if (audioModeState === AudioModeState.RECORDING && !isRecording) {
      lastTranscribedInput.current =
        "Please repeat this test sentence: The quick brown fox jumps over the lazy dog."
      setAudioModeState?.(AudioModeState.PROMPTING)
    }*/
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
        else if (setAudioModeState) setAudioModeState(AudioModeState.IDLE)
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

  /**
   * When used in a text input field (not Audio Mode), this is the animation that renders while recording.
   */
  const colorAnimation = useCallback(() => {
    let shouldContinue = true

    const animate = () => {
      const sequence = Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: false
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false
        })
      ])

      sequence.start(() => {
        if (shouldContinue) {
          animate()
        } else {
          colorAnim.setValue(0)
        }
      })
    }

    animate()

    return () => {
      shouldContinue = false
    }
  }, [colorAnim])

  /**
   * This effect runs when the component mounts and when the recording state changes.
   * It is used only when the component is not in Audio Mode.
   */
  useEffect(() => {
    if (!isAudioMode && (isRecording || isTranscribing)) {
      const stopAnimation = colorAnimation()
      return () => {
        stopAnimation()
      }
    }
  }, [isRecording, isTranscribing, colorAnimation, isAudioMode])

  const AnimatedPath = Animated.createAnimatedComponent(Path)

  return (
    <>
      {!isAudioMode && (
        <View>
          <Pressable
            className="flex items-center justify-center"
            onPress={async (e) => {
              e.preventDefault()
              await toggleRecordingState()
            }}
          >
            <View className="mr-2 flex flex-row gap-2">
              {isTranscribing ? (
                <ActivityIndicator />
              ) : (
                <Svg
                  fill="none"
                  height={isRecording ? 24 : 20}
                  width={isRecording ? 24 : 20}
                  viewBox="0 0 20 20"
                >
                  <AnimatedPath
                    d="M9 0.75C8.20435 0.75 7.44129 1.06607 6.87868 1.62868C6.31607 2.19129 6 2.95435 6 3.75V9C6 9.79565 6.31607 10.5587 6.87868 11.1213C7.44129 11.6839 8.20435 12 9 12C9.79565 12 10.5587 11.6839 11.1213 11.1213C11.6839 10.5587 12 9.79565 12 9V3.75C12 2.95435 11.6839 2.19129 11.1213 1.62868C10.5587 1.06607 9.79565 0.75 9 0.75ZM4.5 7.5C4.5 7.08579 4.16421 6.75 3.75 6.75C3.33579 6.75 3 7.08579 3 7.5V9C3 10.5913 3.63214 12.1174 4.75736 13.2426C5.70433 14.1896 6.93525 14.7873 8.25 14.953V16.5C8.25 16.9142 8.58579 17.25 9 17.25C9.41421 17.25 9.75 16.9142 9.75 16.5V14.953C11.0648 14.7873 12.2957 14.1896 13.2426 13.2426C14.3679 12.1174 15 10.5913 15 9V7.5C15 7.08579 14.6642 6.75 14.25 6.75C13.8358 6.75 13.5 7.08579 13.5 7.5V9C13.5 10.1935 13.0259 11.3381 12.182 12.182C11.3381 13.0259 10.1935 13.5 9 13.5C7.80653 13.5 6.66193 13.0259 5.81802 12.182C4.97411 11.3381 4.5 10.1935 4.5 9V7.5Z"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    fill={isRecording ? color : colors["muted-foreground"]}
                  />
                </Svg>
              )}
            </View>
          </Pressable>
        </View>
      )}
    </>
  )
}
