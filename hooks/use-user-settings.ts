import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { DEFAULT_VOICE } from "@/components/audio/audio-mode-constants"

import { type Voice } from "./use-voice-selections"

export type ColorScheme = "system" | "light" | "dark"

export type VoiceSpeed = "slowest" | "slow" | "normal" | "fast" | "fastest"

type UserSettingsState = {
  // User settings
  colorScheme: ColorScheme
  setColorScheme: (colorScheme: ColorScheme) => void
  hapticsEnabled: boolean
  setHapticsEnabled: (hapticsEnabled: boolean) => void

  hasSeenAppUpdateMessage: boolean
  setHasSeenAppUpdateMessage: (hasSeenAppUpdateMessage: boolean) => void

  hasSeenNotificationsAlert: boolean
  setHasSeenNotificationsAlert: (hasSeenNotificationsAlert: boolean) => void

  hasSeenSystemPromptInfo: boolean
  setHasSeenSystemPromptInfo: (hasSeenSystemPromptInfo: boolean) => void

  feedbackTermsLastAccepted: Date | undefined
  setFeedbackTermsLastAccepted: (feedbackTermsLastAccepted: Date) => void

  // Voice for audio mode
  voice: Voice
  setVoice: (voice: Voice) => void

  // Voice chat is either hands-free or push-to-talk
  voiceChatHandsFree: boolean
  setVoiceChatHandsFree: (voiceChatHandsFree: boolean) => void

  // Voices have optional speed of playback
  voiceSpeed: VoiceSpeed
  setVoiceSpeed: (voiceSpeed: VoiceSpeed) => void

  // Voice chat captions
  voiceChatCaptionsOn: boolean
  setVoiceChatCaptionsOn: (voiceChatCaptionsOn: boolean) => void

  appLoadCount: number
  setAppLoadCount: (appLoadCount: number) => void

  // Push Notifications
  pushNotificationsEnabled: boolean
  setPushNotificationsEnabled: (pushNotificationsEnabled: boolean) => void

  // Has seen image tooltip.
  hasSeenImageTooltip: boolean
  setHasSeenImageTooltip: (hasSeenImageTooltip: boolean) => void

  /**
   * Hydration
   */
  reset: () => void
  isReady: boolean
  setReady: () => void
}

export const useUserSettings = create<UserSettingsState>()(
  persist(
    (set) => ({
      // User settings
      colorScheme: "system",
      setColorScheme: (colorScheme) => {
        set({ colorScheme })
      },

      voice: DEFAULT_VOICE,
      setVoice: (voice) => {
        set({ voice })
      },

      voiceChatHandsFree: true as boolean,
      setVoiceChatHandsFree: (voiceChatHandsFree) => {
        set({ voiceChatHandsFree })
      },

      voiceSpeed: "normal",
      setVoiceSpeed: (voiceSpeed) => {
        set({ voiceSpeed })
      },

      voiceChatCaptionsOn: true as boolean,
      setVoiceChatCaptionsOn: (voiceChatCaptionsOn) => {
        set({ voiceChatCaptionsOn })
      },

      hapticsEnabled: true as boolean,
      setHapticsEnabled: (hapticsEnabled) => {
        set({ hapticsEnabled })
      },

      pushNotificationsEnabled: true as boolean,
      setPushNotificationsEnabled: (pushNotificationsEnabled) => {
        set({ pushNotificationsEnabled })
      },

      hasSeenAppUpdateMessage: false as boolean,
      setHasSeenAppUpdateMessage: (hasSeenAppUpdateMessage) => {
        set({ hasSeenAppUpdateMessage })
      },

      hasSeenNotificationsAlert: false as boolean,
      setHasSeenNotificationsAlert: (hasSeenNotificationsAlert) => {
        set({ hasSeenNotificationsAlert })
      },

      hasSeenSystemPromptInfo: false as boolean,
      setHasSeenSystemPromptInfo: (hasSeenSystemPromptInfo) => {
        set({ hasSeenSystemPromptInfo })
      },

      feedbackTermsLastAccepted: undefined,
      setFeedbackTermsLastAccepted: (feedbackTermsLastAccepted) => {
        set({ feedbackTermsLastAccepted })
      },

      appLoadCount: 0,
      setAppLoadCount: (appLoadCount) => {
        set({ appLoadCount })
      },

      hasSeenImageTooltip: false as boolean,
      setHasSeenImageTooltip: (hasSeenImageTooltip) => {
        set({ hasSeenImageTooltip })
      },

      // Hydration
      reset: () => {
        set({
          colorScheme: "light",
          hapticsEnabled: true,
          hasSeenSystemPromptInfo: false,
          hasSeenImageTooltip: false
        })
      },
      isReady: false as boolean,
      setReady: () => {
        set({
          isReady: true
        })
      }
    }),
    {
      /**
       * Name of the item in storage
       */
      name: "xyz.catena.settings",

      /**
       * Use the AsyncStorage to store keys
       */
      storage: createJSONStorage(() => AsyncStorage),

      /**
       * Version of the data store
       */
      version: 0,

      /**
       * Partialize what we store
       */
      partialize: (state) => ({
        appLoadCount: state.appLoadCount,
        colorScheme: state.colorScheme,
        feedbackTermsLastAccepted: state.feedbackTermsLastAccepted,
        hapticsEnabled: state.hapticsEnabled,
        hasSeenAppUpdateMessage: state.hasSeenAppUpdateMessage,
        hasSeenNotificationsAlert: state.hasSeenNotificationsAlert,
        hasSeenSystemPromptInfo: state.hasSeenSystemPromptInfo,
        hasSeenImageTooltip: state.hasSeenImageTooltip,
        voice: state.voice,
        voiceChatHandsFree: state.voiceChatHandsFree,
        voiceSpeed: state.voiceSpeed,
        voiceChatCaptionsOn: state.voiceChatCaptionsOn
      }),

      /**
       * Since we are using async storage, we need to mark the store as Ready
       */
      onRehydrateStorage: () => (state) => {
        state?.setAppLoadCount(state.appLoadCount + 1)
        state?.setReady()
      }
    }
  )
)
