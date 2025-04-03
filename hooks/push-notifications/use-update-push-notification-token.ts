import { useMutation } from "@tanstack/react-query"
import { Platform } from "react-native"

import { usePushNotificationToken } from "./use-push-notification-token"
import { useApiClient } from "../api-client/use-api-client"

/**
 * Hook to register push notification tokens with the API
 */
export function useUpdatePushNotificationToken() {
  const apiClient = useApiClient()
  const { data: token } = usePushNotificationToken()

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (token) {
        await apiClient.fetch("/api/mobile/push-notifications", {
          method: "POST",
          body: JSON.stringify({
            enabled,
            token,
            deviceType: Platform.OS
          })
        })
      }
    }
  })
}
