import { useEffect, useRef } from "react"
import { Animated, Easing, type ViewProps } from "react-native"

import { cn } from "@/lib/utils/cn"

export type LoadingIndicatorProps = ViewProps

export function LoadingIndicator({
  className,
  style,
  ...viewProps
}: LoadingIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current // Initial scale is 1

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500, // Reduced duration to 500ms for a faster pulse
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500, // Reduced duration to 500ms for a faster pulse
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start()
  }, [pulseAnim])

  return (
    <Animated.View
      className={cn(
        "aspect-square size-5 rounded-full bg-foreground",
        className
      )}
      style={[
        style,
        {
          transform: [{ scale: pulseAnim }]
        }
      ]}
      {...viewProps}
    />
  )
}
