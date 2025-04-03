import { useEffect } from "react"
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated"

import {
  AnimatedPressable,
  type AnimatedPressableProps
} from "@/components/elements/animated/pressable"
import { View } from "@/components/elements/view"
import { cn } from "@/lib/utils/cn"

type Props = AnimatedPressableProps & {
  visible: boolean
}

export function AppearingSubmitButton({
  visible,
  className,
  style,
  children,
  ...props
}: Props) {
  const opacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value
    }
  })

  useEffect(() => {
    if (visible) {
      // Run the appear animation only when the first character is typed
      opacity.value = withTiming(1, { duration: 300 })
    } else {
      // Reset the animation when input is cleared
      opacity.value = withTiming(0, { duration: 300 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only update when visible changes
  }, [visible])

  return (
    <View className="size-8">
      <AnimatedPressable
        style={[animatedStyle, style]}
        className={cn(
          "size-full items-center justify-center rounded-full",
          className
        )}
        haptics
        {...props}
      >
        {children}
      </AnimatedPressable>
    </View>
  )
}
