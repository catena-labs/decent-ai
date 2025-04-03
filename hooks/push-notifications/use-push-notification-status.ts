import { useQuery } from "@tanstack/react-query"
import { isDevice } from "expo-device"
import * as Notifications from "expo-notifications"

export function usePushNotificationStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ["push-notification-status"],
    queryFn: async (): Promise<Notifications.PermissionStatus | null> => {
      if (!isDevice) {
        return null
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()

      return existingStatus
    }
  })

  return {
    data,
    isLoading,

    // Helper booleans
    isPermissionGranted: data === ("granted" as Notifications.PermissionStatus),
    isPermissionDenied: data === ("denied" as Notifications.PermissionStatus),
    isPermissionUndetermined:
      data === ("undetermined" as Notifications.PermissionStatus),
    isUnavailable: !isDevice
  }
}
