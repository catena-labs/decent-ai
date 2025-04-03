import { useMemo } from "react"
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated"

import { Pressable, type PressableProps } from "../pressable"

export type AnimatedPressableProps = PressableProps

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type BackgroundAnimatedPressableProps = AnimatedPressableProps & {
  inactiveBackgroundColor: string
  activeBackgroundColor: string
}

/**
 * Animated Pressable that modifies the background color on press in, out
 */
export function BackgroundAnimatedPressable({
  inactiveBackgroundColor,
  activeBackgroundColor,
  style,
  onPressIn,
  onPressOut,
  ...props
}: BackgroundAnimatedPressableProps) {
  const animationValue = useSharedValue(0)

  // Ensure background color is updated when the active/inactive colors change
  const bgColor = useMemo(
    () =>
      interpolateColor(
        animationValue.value,
        [0, 1],
        [inactiveBackgroundColor, activeBackgroundColor]
      ),
    [animationValue.value, inactiveBackgroundColor, activeBackgroundColor]
  )

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: bgColor
    }
  })

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        animationValue.value = withTiming(1, { duration: 200 })
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        animationValue.value = withTiming(0, { duration: 200 })
        onPressOut?.(e)
      }}
      {...props}
    />
  )
}
