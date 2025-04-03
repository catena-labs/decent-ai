import { usePostHog } from "posthog-react-native"
import { useCallback } from "react"
import { Alert } from "react-native"
import Toast from "react-native-toast-message"

import { useInAppPurchases } from "@/components/providers/in-app-purchase-provider"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"

import { useAuthentication } from "../use-authentication"
import { useSubscriptionStatus } from "../use-subscription-status"

export function useApiErrorHandler() {
  const { signOut } = useAuthentication()
  const { isSubscribed } = useSubscriptionStatus()
  const { presentPaywallIfNeeded } = useInAppPurchases()
  const posthog = usePostHog()

  const unauthorizedError = useCallback(() => {
    Toast.show({
      type: "error",
      text1: "Uh-oh",
      text2:
        "It looks like your session has expired. Please log in again to continue."
    })

    signOut()
  }, [signOut])

  const rateLimitError = useCallback(() => {
    posthog.capture(ANALYTICS_EVENTS.RATE_LIMIT_HIT)
    if (isSubscribed) {
      Toast.show({
        type: "error",
        text1: "Apologies",
        text2:
          "You have exceeded your plan's usage limit. Please upgrade for higher limits"
      })

      return
    }

    Alert.alert(
      "You’ve reached the free limit",
      "Upgrade to DecentAI Pro for significantly higher limits and uninterrupted access to the most advanced AI models.\n\nAlternatively, you can wait for your free access to replenish over time.",
      [
        {
          text: "Ignore",
          style: "cancel"
        },
        {
          text: "Upgrade",
          onPress: () => {
            void presentPaywallIfNeeded()
          }
        }
      ]
    )
  }, [isSubscribed, posthog, presentPaywallIfNeeded])

  const notFoundError = useCallback(() => {
    Toast.show({
      type: "error",
      text1: "No AI Available",
      text2: "Sorry, no model was available to reply. Please try again."
    })
  }, [])

  const unknownError = useCallback(() => {
    Toast.show({
      type: "error",
      text1: "Uh-oh",
      text2: "Something went wrong. Please try again."
    })
  }, [])

  return {
    notFoundError,
    rateLimitError,
    unauthorizedError,
    unknownError
  }
}
