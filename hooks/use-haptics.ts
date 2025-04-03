import * as Haptics from "expo-haptics"
import { useCallback } from "react"

import { useUserSettings } from "./use-user-settings"

export type HapticStyle =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection"

/**
 * Settings-aware haptics hook allowing for easier haptic triggering
 */
export function useHaptics() {
  const enabled = useUserSettings((state) => state.hapticsEnabled)

  /**
   * Triggers a haptic feedback event
   * @param level - The level of haptic feedback to trigger
   */
  const triggerHaptics = useCallback(
    (level?: HapticStyle | boolean) => {
      if (!enabled || !level) {
        return
      }

      switch (level) {
        case "success":
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          )
          break
        case "warning":
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          )
          break
        case "error":
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          break
        case "selection":
          void Haptics.selectionAsync()
          break
        case "medium":
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case "heavy":
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          break
        case "light":
        case true:
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        default:
      }
    },
    [enabled]
  )

  return {
    triggerHaptics
  }
}
