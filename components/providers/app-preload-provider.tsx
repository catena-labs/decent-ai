import { type PropsWithChildren, useEffect } from "react"

import { useAppConfig } from "@/hooks/use-app-config"
import { useAvailableModels } from "@/hooks/use-available-models"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"

export function AppPreloadProvider({ children }: PropsWithChildren) {
  const { refetch: refetchAppConfig } = useAppConfig() // Load the app config
  const { refetch: refetchAvailableModels } = useAvailableModels() // Load the available models

  // Kick off a subscription status check
  useSubscriptionStatus()

  useEffect(() => {
    void Promise.allSettled([refetchAppConfig(), refetchAvailableModels()])
  }, [refetchAppConfig, refetchAvailableModels])

  return children
}
