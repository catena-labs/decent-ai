import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { PostHogProvider } from "posthog-react-native"
import { type PropsWithChildren } from "react"

import { env } from "@/env"

import { AnalyticsProvider } from "./analytics-provider"
import { AppPreloadProvider } from "./app-preload-provider"
import { MinimumAppVersionProvider } from "./minimum-app-version-provider"
import { PushNotificationsProvider } from "./push-notifications-provider"
import { WalletProvider } from "./wallet-provider"
import { TooltipProvider } from "../tooltip/tooltip-provider"

export function Providers({ children }: PropsWithChildren) {
  return (
    <PostHogProvider
      apiKey=""
      options={{
        disabled: env.EXPO_PUBLIC_APP_ENV !== "production"
      }}
    >
      <ActionSheetProvider>
        <PushNotificationsProvider>
          <WalletProvider>
            <AppPreloadProvider>
              <MinimumAppVersionProvider>
                <AnalyticsProvider>
                  <TooltipProvider>
                    <BottomSheetModalProvider>
                      {children}
                    </BottomSheetModalProvider>
                  </TooltipProvider>
                </AnalyticsProvider>
              </MinimumAppVersionProvider>
            </AppPreloadProvider>
          </WalletProvider>
        </PushNotificationsProvider>
      </ActionSheetProvider>
    </PostHogProvider>
  )
}
