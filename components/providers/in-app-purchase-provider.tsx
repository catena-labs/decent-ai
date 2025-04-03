import * as Sentry from "@sentry/react-native"
import { useQueryClient } from "@tanstack/react-query"
import { usePostHog } from "posthog-react-native"
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react"
import { Platform } from "react-native"
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  type PurchasesPackage
} from "react-native-purchases"
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui"
import Toast from "react-native-toast-message"

import { env } from "@/env"
import { useAuthentication } from "@/hooks/use-authentication"
import { type AnalyticsEvent } from "@/lib/analytics/events"
import { createLogger } from "@/lib/logger"

const logger = createLogger("hooks:iap:use-in-app-purchases")
const apiKey =
  Platform.OS === "android"
    ? env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY
    : env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
logger.debug(
  "Using RevenueCat Api Key",
  env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY
)

type InAppPurchaseProps = {
  products: PurchasesPackage[]
  createPurchase: (product: PurchasesPackage) => Promise<boolean>
  presentPaywallIfNeeded: () => Promise<boolean>
  restorePurchase: () => Promise<void>
}

const InAppPurchaseContext = createContext<InAppPurchaseProps | undefined>(
  undefined
)

export const useInAppPurchases = () => {
  const context = useContext(InAppPurchaseContext)
  if (context === undefined) {
    throw new Error(
      "useInAppPurchases must be used within a InAppPurchasesProvider"
    )
  }
  return context
}

export function InAppPurchaseProvider({ children }: PropsWithChildren) {
  const { userId } = useAuthentication()
  const posthog = usePostHog()
  const queryClient = useQueryClient()
  const [products, setProducts] = useState<PurchasesPackage[]>([])

  useEffect(() => {
    const setup = async () => {
      Purchases.configure({ apiKey, appUserID: userId })

      Purchases.addCustomerInfoUpdateListener((info) => {
        logger.debug(JSON.stringify(info))
      })

      const offerings = await Purchases.getOfferings()

      if (offerings.current) {
        setProducts(offerings.current.availablePackages)
      }
    }

    void Purchases.setLogLevel(LOG_LEVEL.DEBUG)

    setup().catch(logger.log)
  }, [userId])

  const optimisticallyUpdateSubscription = useCallback(
    (customerInfo: CustomerInfo) => {
      const expiration = customerInfo.latestExpirationDate
        ? new Date(customerInfo.latestExpirationDate).getTime()
        : null

      queryClient.setQueryData(["subscriptions", userId], {
        status: expiration && expiration > Date.now() ? "active" : "inactive",
        expiration
      })

      return queryClient.refetchQueries({ queryKey: ["subscriptions", userId] })
    },
    [queryClient, userId]
  )

  const createPurchase = useCallback(
    async (product: PurchasesPackage) => {
      try {
        const result = await Purchases.purchasePackage(product)

        await optimisticallyUpdateSubscription(result.customerInfo)
        return true
      } catch (e: unknown) {
        if (e instanceof Object && "userCancelled" in e) {
          logger.debug("User canceled purchase")
        } else {
          logger.error("Error purchasing package", e)
          Sentry.captureException(e)
          Toast.show({
            type: "error",
            text1: "An error occurred",
            text2:
              "An error occurred while trying to purchase the subscription. Please try again."
          })
        }

        return false
      }
    },
    [optimisticallyUpdateSubscription]
  )

  const restorePurchase = useCallback(async () => {
    const customerInfo = await Purchases.restorePurchases()
    return optimisticallyUpdateSubscription(customerInfo)
  }, [optimisticallyUpdateSubscription])

  const presentPaywallIfNeeded = useCallback(async () => {
    // Present paywall for current offering:
    const paywallResult: PAYWALL_RESULT =
      await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: "pro"
      })

    // Cast explicitly to lower cased type since string case methods don't preserve type
    const result = paywallResult.toLowerCase() as Lowercase<PAYWALL_RESULT>
    const resultEvent: AnalyticsEvent = `paywall_result_${result}`
    posthog.capture(resultEvent)

    switch (paywallResult) {
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      case PAYWALL_RESULT.CANCELLED:
        return false
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        await queryClient.refetchQueries({
          queryKey: ["subscriptions", userId]
        })
        return true
      default:
        return false
    }
  }, [posthog, queryClient, userId])

  const value = {
    restorePurchase,
    createPurchase,
    presentPaywallIfNeeded,
    products
  }

  return (
    <InAppPurchaseContext.Provider value={value}>
      {children}
    </InAppPurchaseContext.Provider>
  )
}
