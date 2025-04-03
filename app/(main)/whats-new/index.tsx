import { useRouter } from "expo-router"
import { XIcon } from "lucide-react-native"

import { DotPatternBackground } from "@/components/ai-chat/dot-pattern-background"
import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useInAppPurchases } from "@/components/providers/in-app-purchase-provider"
import { useColors } from "@/hooks/use-colors"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"

export default function Page() {
  const router = useRouter()
  const { dark } = useColors()
  const { isSubscribed } = useSubscriptionStatus()
  const { presentPaywallIfNeeded } = useInAppPurchases()

  return (
    <View className="flex-1" style={{ backgroundColor: dark.background }}>
      <DotPatternBackground dotColor={dark.foreground} />

      <View
        className="flex flex-1 items-start justify-start gap-4 p-5"
        safeArea="bottom"
      >
        <View className="flex items-start justify-start pb-4">
          <Pressable
            className="flex size-11 items-start justify-center"
            onPress={() => {
              router.dismiss()
            }}
          >
            <XIcon className="" color={dark.foreground} />
          </Pressable>
        </View>
        <View className="flex grow items-start justify-start gap-7">
          <Text
            variant="extrabold"
            className="text-4xl leading-10 tracking-tighter"
            style={{ color: dark.foreground }}
          >
            Welcome to a{"\n"}More Open{"\n"}Decent
          </Text>

          <Text className="text-xl" style={{ color: dark.foreground }}>
            Decent is now powered entirely by open source AI models to boost
            choice, transparency, and privacy.
          </Text>
          <Text className="text-xl" style={{ color: dark.foreground }}>
            Thanks for joining the journey toward a truly open AI!
          </Text>
        </View>
        <View className="flex w-full gap-4">
          <Pressable
            className="flex w-full items-center justify-center rounded-lg py-3"
            style={{ backgroundColor: dark.foreground }}
            onPress={() => {
              router.dismiss()
            }}
          >
            <Text className="" style={{ color: dark.background }}>
              Explore Decent
            </Text>
          </Pressable>

          {isSubscribed ? null : (
            <Pressable
              className="flex w-full items-center justify-center rounded-lg py-3"
              style={{ backgroundColor: dark.foreground }}
              onPress={() => {
                void presentPaywallIfNeeded()
              }}
            >
              <Text className="" style={{ color: dark.background }}>
                Explore Decent Pro
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}
