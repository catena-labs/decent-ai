import { forwardRef } from "react"
import {
  TextInput as DefaultTextInput,
  type TextInputProps as DefaultTextInputProps
} from "react-native"
import Animated, {
  Easing,
  type EasingFunction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated"

import { useColors } from "@/hooks/use-colors"
import { cn } from "@/lib/utils/cn"

export type TextInputProps = DefaultTextInputProps

/**
 * A Wrapper around the <TextInput> component from react native which applies
 * our basic styles, considering dark mode, etc.
 */
export const TextInput = forwardRef<DefaultTextInput, TextInputProps>(
  function TextInput({ className, ...props }, ref) {
    const colors = useColors()

    return (
      <DefaultTextInput
        className={cn("rounded bg-background p-2 text-foreground", className)}
        placeholderTextColor={colors["secondary-foreground"]}
        ref={ref}
        {...props}
      />
    )
  }
)

export const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export type AnimatedHeightTextInputProps = TextInputProps & {
  disabled?: boolean
  minInputHeight?: number
  maxInputHeight?: number
  duration?: number
  easing?: EasingFunction
}

export function AnimatedHeightTextInput({
  minInputHeight = 20,
  maxInputHeight = 100,
  duration = 300,
  easing = Easing.out(Easing.cubic),
  disabled = false,
  onChangeText,
  ...props
}: AnimatedHeightTextInputProps) {
  const height = useSharedValue(minInputHeight)

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: height.value
    }
  })

  return (
    <AnimatedTextInput
      editable={!disabled}
      onChangeText={(...args) => {
        if (!disabled) {
          onChangeText?.(...args)
        }
      }}
      onContentSizeChange={(event) => {
        const newHeight = event.nativeEvent.contentSize.height + 10
        const constrainedHeight = Math.min(
          Math.max(minInputHeight, newHeight),
          maxInputHeight
        )

        height.value = withTiming(constrainedHeight, {
          duration,
          easing
        })
      }}
      style={animatedStyles}
      {...props}
    />
  )
}
