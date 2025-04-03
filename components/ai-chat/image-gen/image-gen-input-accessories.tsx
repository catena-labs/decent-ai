import { RatioIcon } from "lucide-react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"

import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { type AspectRatio } from "@/hooks/openai/use-generate-image"
import { useColors } from "@/hooks/use-colors"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"

type Props = {
  input: string
  setInput: (input: string) => void
  aspectRatio: AspectRatio
  setAspectRatio: (aspectRatio: AspectRatio) => void
}

export function ImageGenInputAccessories({
  input,
  setInput,
  aspectRatio
  // setAspectRatio,
}: Props) {
  const colors = useColors()

  return (
    <>
      <Pressable
        analyticsEvent={ANALYTICS_EVENTS.IMAGE_GEN_ASPECT_RATIO_CHANGED}
        haptics
        className="shrink flex-row items-center gap-2 rounded-full bg-secondary px-3 py-1"
      >
        <Text className="line-clamp-1 shrink text-sm text-foreground">
          {aspectRatio}
        </Text>
        <RatioIcon size={14} color={colors.foreground} />
      </Pressable>

      {input.length > 0 ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <Pressable
            analyticsEvent={ANALYTICS_EVENTS.IMAGE_GEN_PROMPT_CLEARED}
            className="flex-row items-center gap-2 rounded-full bg-secondary px-2 py-1"
            onPress={() => {
              setInput("")
            }}
          >
            <Text className="line-clamp-1 shrink text-sm text-foreground">
              Clear Prompt
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  )
}
