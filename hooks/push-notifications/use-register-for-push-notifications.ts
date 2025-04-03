import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as Notifications from "expo-notifications"

import { isAndroid, isDevice } from "@/lib/utils/platform"

export function useRegisterForPushNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!isDevice) {
        throw new Error("Must use physical device for Push Notifications")
      }

      // On Android, you need to specify a channel.
      if (isAndroid) {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C"
        })
      }

      // Get the existing permission status
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()

      let finalStatus = existingStatus

      // If we do not yet have permission, ask for it
      if (existingStatus !== ("granted" as Notifications.PermissionStatus)) {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      // If we still do not have permission, exit
      if (finalStatus !== ("granted" as Notifications.PermissionStatus)) {
        throw new Error("Unable to get push notification permissions")
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["push-notification-status"]
      })
    }
  })
}
