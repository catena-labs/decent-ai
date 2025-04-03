import { useWeb3Modal } from "@web3modal/wagmi-react-native"
import { Image } from "expo-image"
import { router } from "expo-router"
import { useColorScheme } from "nativewind"
import { ScrollView } from "react-native"
import Animated, { Easing, FadeInUp } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAccountEffect } from "wagmi"

import logoDark from "@/assets/images/logo-dark.png"
import logo from "@/assets/images/logo.png"
import { AppleAuthButton } from "@/components/auth/apple-auth-button"
import { AuthButton } from "@/components/auth/auth-button"
import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { createLogger } from "@/lib/logger"

const logger = createLogger("app:(auth):signin")

export default function ConnectWalletScreen() {
  const { colorScheme } = useColorScheme()
  const insets = useSafeAreaInsets()
  const { open } = useWeb3Modal()

  useAccountEffect({
    onConnect: () => {
      logger.debug("Connected Wallet, redirecting...")
      router.push("/connect-wallet")
    }
  })

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          height: "100%"
        }}
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom
        }}
      >
        {/* Logo and header */}
        <Animated.View
          className="flex w-full grow flex-col items-center justify-center gap-12"
          entering={FadeInUp.duration(400)
            .delay(0)
            .easing(Easing.out(Easing.quad))}
        >
          <Image
            source={colorScheme === "dark" ? logoDark : logo}
            style={{ width: 269, height: 60 }}
            contentFit="contain"
          />

          <View className="flex items-center justify-center gap-4">
            <Text variant="medium" className="font-sans-medium text-4xl">
              Open Source AI,
            </Text>
            <Text variant="medium" className="text-4xl">
              Custom Control,
            </Text>
            <Text variant="medium" className="text-4xl">
              Privacy Focus
            </Text>
          </View>
        </Animated.View>

        {/* Auth Buttons */}
        <View className="w-full flex-col gap-5">
          <Animated.View
            entering={FadeInUp.duration(400)
              .delay(100)
              .easing(Easing.out(Easing.quad))}
          >
            <AppleAuthButton />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(400)
              .delay(150)
              .easing(Easing.out(Easing.quad))}
          >
            <GoogleAuthButton />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(400)
              .delay(200)
              .easing(Easing.out(Easing.quad))}
          >
            <AuthButton onPress={() => open()} title="More options" />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  )
}
