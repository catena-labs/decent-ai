import { usePostHog } from "posthog-react-native"
import {
  Switch as DefaultSwitch,
  type SwitchProps as DefaultSwitchProps
} from "react-native"

import { useColors } from "@/hooks/use-colors"
import { type AnalyticsEvent } from "@/lib/analytics/events"

export type SwitchProps = DefaultSwitchProps & {
  /**
   * Name of the analytics event to capture upon press
   */
  analyticsEvent?: (value: boolean) => AnalyticsEvent

  /**
   * Additional properties associated with the analytics event
   */
  analyticsEventProps?: (value: boolean) => Record<string, unknown>
}

/**
 * A reusable <Switch> component that applies our color schemes, and
 * allows analytics events
 */
export function Switch({
  analyticsEvent,
  analyticsEventProps,
  onValueChange,
  ...props
}: SwitchProps) {
  const posthog = usePostHog()
  const colors = useColors()

  return (
    <DefaultSwitch
      onValueChange={(value) => {
        if (analyticsEvent) {
          posthog.capture(analyticsEvent(value), analyticsEventProps?.(value))
        }

        void onValueChange?.(value)
      }}
      thumbColor="#FFFFFF"
      trackColor={{
        true: colors.primary
      }}
      {...props}
    />
  )
}
