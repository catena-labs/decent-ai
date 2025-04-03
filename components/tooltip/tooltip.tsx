import { XIcon } from "lucide-react-native"
import { useEffect } from "react"
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated"

import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { type ArrowPosition } from "@/lib/tooltips/tooltips"
import { cn } from "@/lib/utils/cn"

import { TooltipArrow } from "./tooltip-arrow"
import { Pressable } from "../elements/pressable"
import { type ViewProps } from "../elements/view"

type TooltipProps = ViewProps & {
  title: string
  description: string
  arrowPosition: ArrowPosition
  onClose?: () => void
  delay?: number
}

export function Tooltip({
  title,
  description,
  arrowPosition,
  onClose,
  delay = 500,
  style,
  className,
  ...props
}: TooltipProps) {
  const animation = useSharedValue(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      animation.value = withSpring(1)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [animation, delay])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value
      // transform: [{ scale: animation.value }]
    }
  })

  const handleClose = () => {
    animation.value = withSpring(0, {}, (finished) => {
      if (finished && onClose) {
        runOnJS(onClose)()
      }
    })
  }

  return (
    <Pressable className="absolute size-full flex-1" onPress={handleClose}>
      <Reanimated.View
        style={[animatedStyle, style]}
        className={cn("absolute inset-x-0 px-4", className)}
        {...props}
      >
        {arrowPosition.startsWith("top") ? (
          <TooltipArrow position={arrowPosition} />
        ) : null}
        <View className="w-full rounded-lg bg-foreground p-4 shadow-lg">
          <Text variant="bold" className="mb-2 text-lg text-background">
            {title}
          </Text>
          <Text className="text-sm text-background">{description}</Text>
          <Pressable
            className="absolute right-2 top-2 p-1 hover:bg-muted"
            onPress={handleClose}
          >
            <XIcon className="size-3 text-background" />
          </Pressable>
        </View>
        {arrowPosition.startsWith("bottom") ? (
          <TooltipArrow position={arrowPosition} />
        ) : null}
      </Reanimated.View>
    </Pressable>
  )
}
