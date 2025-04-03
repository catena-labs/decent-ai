import * as Sentry from "@sentry/react-native"
import * as AppleAuthentication from "expo-apple-authentication"
import { useState } from "react"
import { Alert } from "react-native"
import Toast from "react-native-toast-message"

import { useAuthentication } from "@/hooks/use-authentication"
import { createLogger } from "@/lib/logger"
import { isIOS } from "@/lib/utils/platform"

import { AuthButton } from "./auth-button"
import { AppleIcon } from "../icons/apple-icon"

const logger = createLogger("components:auth:apple-auth-button")

export function AppleAuthButton() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { signIn } = useAuthentication()

  const onSignIn = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync()

    if (!isAvailable) {
      Alert.alert("Sign up with Apple is not supported on your device")
    }

    let credential:
      | AppleAuthentication.AppleAuthenticationCredential
      | undefined

    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      })
    } catch (e) {
      // Error with Apple sign in (user cancelled etc.)
      logger.error("Apple Authentication Error", e)
    }

    if (!credential) {
      // User cancelled Apple sign in
      return
    }

    try {
      setIsAuthenticating(true)
      await signIn({
        provider: "apple",
        credential
      })
    } catch (e) {
      logger.error("Apple Authentication Error", e)
      Sentry.captureException(e)
      Toast.show({
        type: "error",
        text1: "Unable to sign in",
        text2: "There was an error signing in with Apple. Please try again."
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  if (!isIOS) {
    return null
  }

  return (
    <AuthButton
      icon={<AppleIcon className="size-6 text-foreground" />}
      isAuthenticating={isAuthenticating}
      onPress={onSignIn}
      title="Continue with Apple"
    />
  )
}
