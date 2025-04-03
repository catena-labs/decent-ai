import { type MenuAction, MenuView } from "@react-native-menu/menu"
import { Settings2Icon } from "lucide-react-native"
import { usePostHog } from "posthog-react-native"
import { useMemo } from "react"
import { Platform, View } from "react-native"

import { useColors } from "@/hooks/use-colors"
import { type VoiceSpeed, useUserSettings } from "@/hooks/use-user-settings"
import {
  type Voice,
  getVoiceForCompositeId,
  useVoiceSelections
} from "@/hooks/use-voice-selections"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"

import { AudioModeState } from "./audio-mode-constants"

type VoiceChatHeaderProps = {
  audioModeState?: AudioModeState
  setAudioModeState?: (state: AudioModeState) => void
}

export function VoiceChatHeader({
  audioModeState,
  setAudioModeState
}: VoiceChatHeaderProps) {
  const colors = useColors()
  const posthog = usePostHog()
  const voiceChatHandsFree = useUserSettings(
    (state) => state.voiceChatHandsFree
  )
  const setVoiceChatHandsFree = useUserSettings(
    (state) => state.setVoiceChatHandsFree
  )

  const voiceSpeed = useUserSettings((state) => state.voiceSpeed)
  const setVoiceSpeed = useUserSettings((state) => state.setVoiceSpeed)

  const voice = useUserSettings((state) => state.voice)
  const setVoice = useUserSettings((state) => state.setVoice)
  const { availableVoices, voiceSelectorOptions } = useVoiceSelections()

  const isCaptionsEnabled = useUserSettings(
    (state) => state.voiceChatCaptionsOn
  )
  const setCaptionsEnabled = useUserSettings(
    (state) => state.setVoiceChatCaptionsOn
  )

  const menuActions = useMemo<MenuAction[]>(() => {
    const actions: MenuAction[] = [
      selectHandsFreeOrHoldMenuAction({
        id: "voice-recording-mode",
        title: "Mode",
        isHandsFree: voiceChatHandsFree
      }),
      selectSpeedMenuAction({
        id: "voice-playback-speed",
        title: "Playback speed",
        speedStr: voiceSpeed
      }),
      selectVoiceMenuAction({
        id: "voice-selection",
        title: "Voice",
        voice,
        voiceSelectorOptions
      }),
      selectCaptionMenuAction({
        id: "captions-enabled",
        title: "Captions",
        isCaptionsEnabled
      })
    ]
    return actions
  }, [
    isCaptionsEnabled,
    voice,
    voiceChatHandsFree,
    voiceSelectorOptions,
    voiceSpeed
  ])

  function selectHandsFreeOrHoldMenuAction(
    action: MenuAction & { isHandsFree: boolean }
  ): MenuAction {
    return {
      ...action,
      title: action.isHandsFree ? "Mode: Hands-free" : "Mode: Hold to talk",
      subactions: [
        {
          id: "recording-hands-free",
          title:
            Platform.select({
              android: `${action.isHandsFree ? "✔ " : ""}Hands-free`
            }) ?? "Hands-free",
          image: action.isHandsFree
            ? Platform.select({
                ios: "checkmark"
              })
            : undefined
        },
        {
          id: "recording-hold-to-talk",
          title:
            Platform.select({
              android: `${!action.isHandsFree ? "✔ " : ""}Hold to talk`
            }) ?? "Hold to talk",
          image: !action.isHandsFree
            ? Platform.select({
                ios: "checkmark"
              })
            : undefined
        }
      ]
    }
  }

  function selectSpeedMenuAction(
    action: MenuAction & { speedStr: string }
  ): MenuAction {
    const capitalizedSpeed =
      action.speedStr.charAt(0).toUpperCase() + action.speedStr.slice(1)
    const speedOptions = ["Slowest", "Slow", "Normal", "Fast", "Fastest"]
    return {
      ...action,
      title: `Speech Speed: ${capitalizedSpeed}`,
      subactions: speedOptions.map((option) => ({
        id: `voice-playback-speed-${option.toLowerCase()}`,
        title:
          Platform.select({
            android: `${action.speedStr === option.toLowerCase() ? "✔ " : ""}${option}`
          }) ?? option,
        image:
          action.speedStr === option.toLowerCase()
            ? Platform.select({
                ios: "checkmark"
              })
            : undefined
      }))
    }
  }

  function selectVoiceMenuAction(
    action: MenuAction & {
      voice: Voice
      voiceSelectorOptions: { id: string; title: string }[] | undefined
    }
  ): MenuAction {
    if (!action.voiceSelectorOptions) {
      return {
        ...action,
        title: `Voice: ${action.voice.name}`,
        subactions: [
          {
            title: "Voices Unavilable",
            attributes: {
              disabled: true
            }
          }
        ]
      }
    }
    return {
      ...action,
      title: `Voice: ${action.voice.name}`,
      subactions: action.voiceSelectorOptions.map((voiceOption) => ({
        id: `voice-selection-${voiceOption.id}`,
        title:
          Platform.select({
            android: `${action.voice.name === voiceOption.title ? "✔ " : ""}${voiceOption.title}`
          }) ?? voiceOption.title,
        image:
          action.voice.name === voiceOption.title
            ? Platform.select({
                ios: "checkmark"
              })
            : undefined
      }))
    }
  }

  function selectCaptionMenuAction(
    action: MenuAction & { isCaptionsEnabled: boolean }
  ): MenuAction {
    return {
      ...action,
      title: action.isCaptionsEnabled ? "Captions: On" : "Captions: Off",
      subactions: [
        {
          id: "captions-enabled",
          title:
            Platform.select({
              android: `${action.isCaptionsEnabled ? "✔ " : ""}On`
            }) ?? "On",
          image: action.isCaptionsEnabled
            ? Platform.select({
                ios: "checkmark"
              })
            : undefined
        },
        {
          id: "captions-disabled",
          title:
            Platform.select({
              android: `${!action.isCaptionsEnabled ? "✔ " : ""}Off`
            }) ?? "Off",
          image: !action.isCaptionsEnabled
            ? Platform.select({
                ios: "checkmark"
              })
            : undefined
        }
      ]
    }
  }

  return (
    <View className="flex-row items-center justify-between bg-background p-4">
      {/* This was removed in the latest designs, by keeping it here since it seems likely to return at some point */}
      {/*<Pressable
        className="size-12"
        onPress={async () => {
          await onExitAudioMode()
        }}
      >
        <ChevronLeft color={colors.foreground} size={24} />
      </Pressable>*/}
      <View className="flex-1" />
      <MenuView
        actions={menuActions}
        onPressAction={({ nativeEvent }) => {
          if (nativeEvent.event === "recording-hands-free") {
            posthog.capture(ANALYTICS_EVENTS.VOICE_CHAT_HANDS_FREE_CHANGED, {
              voiceHandsFree: true
            })
            setVoiceChatHandsFree(true)
          } else if (nativeEvent.event === "recording-hold-to-talk") {
            posthog.capture(ANALYTICS_EVENTS.VOICE_CHAT_HANDS_FREE_CHANGED, {
              voiceHandsFree: false
            })
            setVoiceChatHandsFree(false)
          } else if (nativeEvent.event.startsWith("voice-playback-speed-")) {
            const speedStr = nativeEvent.event.substring(
              "voice-playback-speed-".length
            )
            posthog.capture(ANALYTICS_EVENTS.VOICE_CHAT_HANDS_FREE_CHANGED, {
              voiceHandsFree: speedStr
            })
            setVoiceSpeed(speedStr as VoiceSpeed)
          } else if (nativeEvent.event.startsWith("voice-selection-")) {
            if (availableVoices) {
              const voiceId = nativeEvent.event.substring(
                "voice-selection-".length
              )
              posthog.capture(ANALYTICS_EVENTS.VOICE_CHANGED, {
                voice: voiceId
              })
              const selectedVoice = getVoiceForCompositeId(
                voiceId,
                availableVoices
              )
              if (selectedVoice) {
                if (
                  audioModeState === AudioModeState.PLAYING &&
                  setAudioModeState
                ) {
                  setAudioModeState(AudioModeState.IDLE)
                }
                setVoice(selectedVoice)
              }
            }
          } else if (nativeEvent.event === "captions-enabled") {
            posthog.capture(ANALYTICS_EVENTS.VOICE_CHAT_CAPTIONS_CHANGED, {
              captionsEnabled: true
            })
            setCaptionsEnabled(true)
          } else if (nativeEvent.event === "captions-disabled") {
            posthog.capture(ANALYTICS_EVENTS.VOICE_CHAT_CAPTIONS_CHANGED, {
              captionsEnabled: false
            })
            setCaptionsEnabled(false)
          }
        }}
      >
        <Settings2Icon color={colors.foreground} size={24} />
      </MenuView>
    </View>
  )
}
