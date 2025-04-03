import { type PropsWithChildren, useMemo } from "react"

import { ExternalLink } from "@/components/elements/external-link"
import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useAppConfig } from "@/hooks/use-app-config"
import { appBuildNumber } from "@/lib/constants"
import { isAndroid, isIOS } from "@/lib/utils/platform"

/**
 * This is a provider that ensures the app is up to date. If the app is not up
 * to date, it will show a full screen message to the user.
 */
export function MinimumAppVersionProvider({ children }: PropsWithChildren) {
  const { appConfig } = useAppConfig()

  const requiresUpgrade = useMemo(() => {
    if (!appConfig) {
      return false
    }

    if (isIOS) {
      return appBuildNumber < appConfig.minimumBuildNumber.ios
    }

    if (isAndroid) {
      return appBuildNumber < appConfig.minimumBuildNumber.android
    }

    return false
  }, [appConfig])

  if (!requiresUpgrade) {
    return children
  }

  return (
    <View className="absolute inset-0 size-full items-center justify-center bg-background">
      <View className="w-4/5 overflow-hidden rounded-2xl bg-card">
        <View className="items-center p-4">
          <Text variant="bold" className="pb-2 text-lg">
            Please update your app
          </Text>
          <Text className="pb-4 text-center">
            You are currently running an outdated and unsupported version of
            DecentAI. Please update via the{" "}
            {isAndroid ? "Play Store" : "App Store"} to continue using DecentAI.
          </Text>
        </View>

        <ExternalLink
          asChild
          href={
            isAndroid
              ? "https://play.google.com/store/apps/details?id=xyz.catena.decent.android"
              : isIOS
                ? "https://apps.apple.com/us/app/decentai/id6474378602"
                : "https://decentai.app"
          }
        >
          <Pressable className="w-full py-4 active:opacity-80">
            <Text variant="bold" className="text-center text-primary">
              Update App
            </Text>
          </Pressable>
        </ExternalLink>
      </View>
    </View>
  )
}
