import { ArrowRight } from "lucide-react-native"
import { type ReactNode } from "react"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated"

import { Pressable, type PressableProps } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { cn } from "@/lib/utils/cn"

import { DotPatternBackground } from "./dot-pattern-background"

type Props = PressableProps & {
  title: string
  icon?: ReactNode
}

export function QuickActionItem({
  title,
  icon,
  onPress,
  className,
  ...props
}: Props) {
  const scaleValue = useSharedValue(1)

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.95, {
      damping: 2, // Lower damping for faster transition
      stiffness: 50 // Higher stiffness for faster transition
    })
  }

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, {
      damping: 2, // Lower damping for faster transition
      stiffness: 50 // Higher stiffness for faster transition
    })
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }]
    }
  })
  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        "mx-2 h-[128px] rounded-lg border border-border bg-background",
        className
      )}
    >
      <DotPatternBackground />
      <Pressable
        className="h-[138px] flex-col items-start justify-between gap-1 px-3 py-4"
        haptics
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        {...props}
      >
        {icon ? (
          <View className="w-full flex-1 items-center justify-center">
            {icon}
          </View>
        ) : null}
        <View className="flex w-full flex-row items-center justify-between">
          <Text
            variant="bold"
            className="line-clamp-2 leading-[28px] text-foreground"
          >
            {title}
          </Text>
          <ArrowRight className="text-foreground" size={18} />
        </View>
      </Pressable>
    </Animated.View>
  )
}
