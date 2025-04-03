import {
  GoogleSignin,
  type User
} from "@react-native-google-signin/google-signin"
import * as Sentry from "@sentry/react-native"
import { useState } from "react"
import Toast from "react-native-toast-message"

import { env } from "@/env"
import { useAuthentication } from "@/hooks/use-authentication"
import { createLogger } from "@/lib/logger"

import { AuthButton } from "./auth-button"
import { GoogleIcon } from "../icons/google-icon"

const logger = createLogger("components:auth:google-auth-button")

GoogleSignin.configure({
  iosClientId: env.EXPO_PUBLIC_AUTH_GOOGLE_IOS_ID,
  webClientId: env.EXPO_PUBLIC_AUTH_GOOGLE_WEB_ID
})

export function GoogleAuthButton() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { signIn } = useAuthentication()

  const onSignIn = async () => {
    let userInfo: User | undefined

    try {
      await GoogleSignin.hasPlayServices()
      userInfo = await GoogleSignin.signIn()
    } catch (e) {
      // Error with Google sign in (user cancelled etc.)
      logger.error("Google Authentication Error", e)
    }

    if (!userInfo) {
      return
    }

    try {
      setIsAuthenticating(true)
      await signIn({
        provider: "google",
        credential: userInfo
      })
    } catch (e) {
      logger.error("Google Authentication Error", e)
      Sentry.captureException(e)
      Toast.show({
        type: "error",
        text1: "Unable to sign in",
        text2: "There was an error signing in with Google. Please try again."
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <AuthButton
      icon={<GoogleIcon className="size-6 text-foreground" />}
      isAuthenticating={isAuthenticating}
      onPress={onSignIn}
      title="Continue with Google"
    />
  )
}
