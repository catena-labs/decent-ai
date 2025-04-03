import * as Haptics from "expo-haptics"
import * as NavigationBar from "expo-navigation-bar"
import { XIcon } from "lucide-react-native"
import { useEffect, useRef, useState } from "react"
import {
  AppState,
  type AppStateStatus,
  Modal,
  SafeAreaView
} from "react-native"

import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useColors } from "@/hooks/use-colors"
import { useUserSettings } from "@/hooks/use-user-settings"
import { type Message } from "@/lib/ai/message"
import { createLogger } from "@/lib/logger"
import { isAndroid } from "@/lib/utils/platform"

import { AudioModeState } from "./audio-mode-constants"
import { VoiceChatHeader } from "./audio-mode-header"
import { Captions } from "./captions"
import { SpeechToCompletionHandsFree } from "./speech-to-completion-handsfree"
import { SpeechToCompletionHoldRecord } from "./speech-to-completion-holdrecord"
import { TextToSpeech, type TextToSpeechRef } from "./text-to-speech"
import { AudioModeVisualizer } from "./visualizer/audio-visualizer"

type Props = {
  /**
   * The message array in chronological order (newest last).
   */
  messages: Message[]
  stop: () => void
  isLoading: boolean
  isVisible: boolean
  onMessageSend: (text: string) => Promise<void> | void
  setIsVisible: (isVisible: boolean) => void
  chatError?: Error | null
  audioError?: Error
  setAudioError?: (error: Error | undefined) => void
}

/**
 * Full-screen takeover for audio mode. Handles speech-to-text and text-to-speech with visual feedback.
 */
export function AudioMode({
  messages,
  stop,
  isLoading,
  isVisible,
  onMessageSend,
  setIsVisible,
  chatError,
  audioError,
  setAudioError
}: Props) {
  const colors = useColors()
  const [audioModeState, setAudioModeState] = useState(AudioModeState.INACTIVE)
  const [volume, setVolume] = useState(0)
  const [sampleData, setSampleData] = useState<number[]>([])
  const logger = createLogger("components:audio-mode")
  const isUsingHaptics = useUserSettings((state) => state.hapticsEnabled)
  const setHapticsEnabled = useUserSettings((state) => state.setHapticsEnabled)
  const originalHapticsSetting = useRef(false)
  const textToSpeechRef = useRef<TextToSpeechRef>(null)
  const recordingStartTime = useRef<number>(0)
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const voiceChatHandsFree = useUserSettings(
    (state) => state.voiceChatHandsFree
  )
  const isCaptionsEnabled = useUserSettings(
    (state) => state.voiceChatCaptionsOn
  )

  const [topMessageText, setTopMessageText] = useState<string>("")

  const isPotentiallyRecordingRef = useRef(false)
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isCancelingCaptions, setIsCancelingCaptions] = useState(false)

  // On mount, set the background color to match the modal on Android
  useEffect(() => {
    if (isAndroid) {
      try {
        void NavigationBar.setBackgroundColorAsync(colors.background)
      } catch {
        // no-op
      }
    }
  }, [colors.background])

  /**
   * Start Audio Mode in response to the isVisible prop changing in the parent component.
   */
  useEffect(() => {
    if (isVisible && audioModeState === AudioModeState.INACTIVE) {
      // older devices in particular may take some time to load conversations, which freezes the app
      // as a workaround, we start a timeout here which freezes while the device is frozen
      // when it unfreezes, the timeout will complete and state will be updated
      setAudioModeState(AudioModeState.LOADING)
      setTimeout(() => {
        setAudioModeState(AudioModeState.IDLE)
        if (setAudioError) setAudioError(undefined)
        // no haptics for text input and completions in in audio mode
        // but if enabled, still manually use them for recording selections
        originalHapticsSetting.current = isUsingHaptics
        setHapticsEnabled(false)
      }, 1000)
    }
  }, [
    audioModeState,
    isVisible,
    isUsingHaptics,
    logger,
    setHapticsEnabled,
    setAudioError
  ])

  useEffect(() => {
    if (chatError) {
      setAudioModeState(AudioModeState.IDLE)
    }
  }, [chatError])

  /**
   * Set the audio mode state to inactive, restore previous state such as haptics, and clean up.
   * To clean up in the middle of playback, we use a forwardRef.
   */
  const onExitAudioMode = async () => {
    if (isAndroid) {
      try {
        // Reset original navigaiton bar color on android
        await NavigationBar.setBackgroundColorAsync(`${colors.background}00`)
      } catch {
        // no-op
      }
    }
    setAudioModeState(AudioModeState.INACTIVE)
    if (setAudioError) setAudioError(undefined)
    setHapticsEnabled(originalHapticsSetting.current)
    setIsVisible(false)
    textToSpeechRef.current?.onExitAudioMode()
  }

  /**
   * When backgrounded, stop all audio activity. Change this in the future when the underlying llm streams can be backgrounded.
   * NOTE: This is not reliable on Android, which can report invalid states and insert delays or no-calls when states change.
   */
  const [appState, setAppState] = useState(AppState.currentState)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        !isAndroid &&
        isVisible &&
        appState === "inactive" &&
        nextAppState === "background"
      ) {
        setAudioModeState(AudioModeState.INACTIVE)
        if (setAudioError) setAudioError(undefined)
        setHapticsEnabled(originalHapticsSetting.current)
        setIsVisible(false)
        textToSpeechRef.current?.onExitAudioMode()
      }
      setAppState(nextAppState)
    }

    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    )

    return () => {
      appStateSubscription.remove()
    }
  }, [appState, isVisible, setAudioError, setHapticsEnabled, setIsVisible])

  const startRecording = () => {
    if (audioModeState === AudioModeState.LOADING) {
      if (setAudioError) setAudioError(new Error("One moment please..."))
      return
    }
    if (
      audioModeState !== AudioModeState.RECORDING &&
      audioModeState !== AudioModeState.INACTIVE
    ) {
      // clear older errors when starting a new recording
      if (setAudioError) setAudioError(undefined)
      stop()
      setIsCancelingCaptions(false)
      setAudioModeState(AudioModeState.RECORDING)
      recordingStartTime.current = Date.now()
      if (pressTimerRef.current) {
        clearInterval(pressTimerRef.current)
      }
      pressTimerRef.current = setInterval(() => {
        if (Date.now() - recordingStartTime.current >= 20000) {
          setAudioModeState(AudioModeState.STOPRECORDING)
          if (setAudioError)
            setAudioError(
              new Error("Sorry, recordings are limited to 20 seconds.")
            )
        }
      }, 1200)
    }
  }

  const stopRecording = () => {
    if (audioModeState === AudioModeState.RECORDING) {
      setAudioModeState(AudioModeState.STOPRECORDING)
    } else {
      setAudioModeState(AudioModeState.IDLE)
    }
    setVolume(0)
    if (pressTimerRef.current) {
      clearInterval(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const cleanupTimeouts = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
      recordingTimeoutRef.current = null
    }
    isPotentiallyRecordingRef.current = false
  }

  useEffect(() => {
    return () => {
      cleanupTimeouts()
    }
  }, [])

  const onPressIn = () => {
    if (originalHapticsSetting.current) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    isPotentiallyRecordingRef.current = true
    recordingTimeoutRef.current = setTimeout(() => {
      if (isPotentiallyRecordingRef.current) {
        startRecording()
      }
    }, 200)
  }

  const onPressOut = () => {
    if (originalHapticsSetting.current) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    if (isPotentiallyRecordingRef.current) {
      if (audioModeState === AudioModeState.RECORDING) {
        stopRecording()
      } else {
        // if we haven't started recording yet, it's a tap, so set to IDLE
        setIsCancelingCaptions(true)
        setAudioModeState(AudioModeState.IDLE)
      }
    }
    cleanupTimeouts()
  }

  return (
    <Modal transparent={!isAndroid} visible={isVisible} animationType="fade">
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 flex-col">
          {/* Header */}
          <VoiceChatHeader
            audioModeState={audioModeState}
            setAudioModeState={setAudioModeState}
          />

          {/* Main content */}
          <View className="flex-1">
            {/* Top messages */}
            <View
              className="w-full items-center justify-center gap-2"
              style={{ marginTop: 36, height: "10%" }}
            >
              {audioError ? (
                <Text className="text-lg text-foreground">
                  {audioError.message}
                </Text>
              ) : null}
              <Text className="px-10 text-lg text-foreground">
                {topMessageText}
              </Text>
            </View>

            {/* AudioModeVisualizer with Pressable */}
            <View
              className="w-full items-center justify-center"
              style={{ height: "50%" }}
            >
              <Pressable
                className="aspect-square w-4/5 items-center justify-center"
                onPressIn={onPressIn}
                onPressOut={onPressOut}
              >
                <AudioModeVisualizer
                  audioModeState={audioModeState}
                  sampleData={sampleData}
                  volume={volume}
                  setInfoMessage={setTopMessageText}
                />
              </Pressable>
            </View>

            {/* Bottom message */}
            <View
              className="w-full items-center"
              style={{ height: "24%", paddingHorizontal: 32 }}
            >
              {isCaptionsEnabled ? (
                <Captions
                  audioModeState={audioModeState}
                  cancelCaptions={isCancelingCaptions}
                  messages={messages}
                />
              ) : null}
            </View>

            {/* Exit button */}
            <View
              className="w-full items-center justify-center"
              style={{ height: "10%" }}
            >
              <Pressable
                className="size-12 items-center justify-center rounded-full bg-foreground"
                onPress={async () => {
                  await onExitAudioMode()
                }}
              >
                <XIcon color={colors.background} />
              </Pressable>
            </View>
          </View>

          {/* Hidden components for functionality */}
          <View className="hidden">
            {voiceChatHandsFree ? (
              <SpeechToCompletionHandsFree
                audioModeState={audioModeState}
                onMessageSend={onMessageSend}
                setAudioError={setAudioError}
                setAudioModeState={setAudioModeState}
                setVolume={setVolume}
                stop={stop}
              />
            ) : (
              <SpeechToCompletionHoldRecord
                audioModeState={audioModeState}
                onMessageSend={onMessageSend}
                setAudioError={setAudioError}
                setAudioModeState={setAudioModeState}
                setVolume={setVolume}
              />
            )}
            <TextToSpeech
              audioError={audioError}
              audioModeState={audioModeState}
              isLoading={isLoading}
              messages={messages}
              ref={textToSpeechRef}
              onAudioSampleReceived={setSampleData}
              setAudioError={setAudioError}
              setAudioModeState={setAudioModeState}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
