import { type BottomSheetBackdropProps } from "@gorhom/bottom-sheet"
import { useMemo } from "react"
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle
} from "react-native-reanimated"

import { useColors } from "@/hooks/use-colors"

import { Pressable } from "../elements/pressable"

type Props = BottomSheetBackdropProps & {
  onPress: () => void
}

export function BottomSheetBackdrop({ animatedIndex, onPress, style }: Props) {
  const colors = useColors()

  /**
   * Builds an animated opacity and background value based on the
   * `animatedIndex` value from the BottomSheatModal component.
   *
   * These values are specific to a modal with 2 steps (0, and 1).
   * The -1 value is used when the modal is closed.
   */
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0, 1],
      [0, 0.6, 1],
      Extrapolation.CLAMP
    ),
    backgroundColor: interpolateColor(
      animatedIndex.value,
      [-1, 0, 1],
      ["#000000", "#000000", colors.primary]
    )
  }))

  const containerStyle = useMemo(
    () => [style, containerAnimatedStyle],
    [style, containerAnimatedStyle]
  )

  return (
    <Animated.View style={containerStyle}>
      <Pressable className="flex-1" onPress={onPress} />
    </Animated.View>
  )
}
