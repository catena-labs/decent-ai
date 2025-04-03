import * as Sentry from "@sentry/react-native"
import { useRouter } from "expo-router"
import { useCallback, useState } from "react"
import Toast from "react-native-toast-message"
import { useAccount, useDisconnect, useWalletClient } from "wagmi"

import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useAuthentication } from "@/hooks/use-authentication"
import { getSigningMessage } from "@/lib/auth/web3-auth/get-signing-message"
import { createLogger } from "@/lib/logger"

const logger = createLogger("app:(auth):connect-wallet")

export default function ConnectWalletScreen() {
  const router = useRouter()
  const [isSigningMessage, setIsSigningMessage] = useState(false)
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { signIn } = useAuthentication()

  const onDisconnect = useCallback(() => {
    disconnect()
    router.back()
  }, [disconnect, router])

  const onSignMessage = useCallback(async () => {
    if (!walletClient || !address) {
      return
    }

    let message: string | undefined
    let signature: `0x${string}` | undefined

    setIsSigningMessage(true)

    try {
      // get the message
      message = await getSigningMessage(address)
      signature = await walletClient.signMessage({
        message
      })
    } catch (e) {
      // Error with Wallet sign in (user cancelled etc.)
      logger.error("Wallet Authentication Error", e)
    }

    if (!signature) {
      setIsSigningMessage(false)
      return
    }

    try {
      await signIn({
        provider: "web3",
        credential: {
          address,
          message,
          signature
        }
      })
    } catch (e) {
      logger.error("Wallet Authentication Error", e)
      Sentry.captureException(e)
      Toast.show({
        type: "error",
        text1: "Unable to sign in",
        text2:
          "There was an error signing in with your wallet. Please try again."
      })
    } finally {
      setIsSigningMessage(false)
    }
  }, [address, signIn, walletClient])

  return (
    <View className="flex-1 items-start justify-between bg-background" safeArea>
      {/* Logo and header */}
      <View className="flex grow flex-col justify-center gap-10 p-5">
        <Text className="text-4xl">Sign in to DecentAI</Text>
        <View className="flex-col gap-6">
          <Text className="text-xl">
            To ensure the security of your account, we need you to sign a
            one-time message with your wallet.
          </Text>
          <Text className="text-xl">
            Signing this message does not cost any gas fees, and we will not
            have access to your private keys or funds.
          </Text>
        </View>
      </View>

      <View className="w-full flex-col gap-5 p-5">
        <Pressable
          className="h-[55px] w-full flex-row items-center justify-center gap-3 rounded-[15px] bg-primary"
          disabled={!walletClient || isSigningMessage}
          onPress={() => onSignMessage()}
        >
          {isSigningMessage ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-xl">👛</Text>
          )}
          <Text className="text-xl text-primary-foreground">Sign message</Text>
        </Pressable>

        <Pressable
          className="h-[55px] w-full flex-row items-center justify-center gap-3 rounded-[15px] bg-card"
          // disabled={isDisconnecting}
          onPress={() => {
            onDisconnect()
          }}
        >
          <Text className="text-xl text-foreground">Cancel</Text>
        </Pressable>
      </View>
    </View>
  )
}
