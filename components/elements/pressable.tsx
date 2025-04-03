import * as Clipboard from "expo-clipboard"
import { usePostHog } from "posthog-react-native"
import { forwardRef, useCallback } from "react"
import {
  Pressable as DefaultPressable,
  type PressableProps as DefaultPressableProps,
  type GestureResponderEvent,
  type View
} from "react-native"
import Toast from "react-native-toast-message"

import { type HapticStyle, useHaptics } from "@/hooks/use-haptics"
import { type AnalyticsEvent } from "@/lib/analytics/events"
import { cn } from "@/lib/utils/cn"

export type PressableProps = DefaultPressableProps & {
  /**
   * The haptics to add to an onPress event. Passing `true` will default to
   * `light`.
   *
   * Haptic settings can be found here:
   * https://docs.expo.dev/versions/latest/sdk/haptics/#hapticsimpactasyncstyle
   */
  haptics?: HapticStyle | boolean

  /**
   * The text to copy upon press, if any
   */
  copyOnPress?: string | null

  /**
   * Whether or not to make the element opaque when pressed
   *
   * @defaultValue true
   */
  activeOpacity?: boolean

  /**
   * Name of the analytics event to capture upon press
   */
  analyticsEvent?: AnalyticsEvent

  /**
   * Additional properties associated with the analytics event
   */
  analyticsEventProps?: Record<string, unknown>
}

/**
 * A wrapper around the <Pressable> component with some additional properties,
 * such as `haptics`, etc.
 */
export const Pressable = forwardRef<View, PressableProps>(
  (
    {
      haptics,
      copyOnPress,
      activeOpacity = true,
      onPress,
      analyticsEvent,
      analyticsEventProps,
      ...props
    },
    ref
  ) => {
    const { triggerHaptics } = useHaptics()
    const posthog = usePostHog()

    const onPressWrapper = useCallback(
      (event: GestureResponderEvent) => {
        triggerHaptics(haptics)

        if (copyOnPress) {
          void Clipboard.setStringAsync(copyOnPress)
          Toast.show({
            type: "info",
            text1: "Copied!"
          })
        }

        if (analyticsEvent) {
          posthog.capture(analyticsEvent, analyticsEventProps)
        }

        onPress?.(event)
      },
      [
        analyticsEvent,
        analyticsEventProps,
        copyOnPress,
        haptics,
        onPress,
        posthog,
        triggerHaptics
      ]
    )

    return (
      <DefaultPressable
        className={cn(
          activeOpacity ? "active:opacity-50" : "active:opacity-100"
        )}
        onPress={onPressWrapper}
        ref={ref}
        {...props}
      />
    )
  }
)

Pressable.displayName = "Pressable"
