import { useMutation } from "@tanstack/react-query"

import { createLogger } from "@/lib/logger"

import { usePushNotificationToken } from "./use-push-notification-token"

const logger = createLogger("use-test-push-notification")

export function useTestPushNotification() {
  const { data: token } = usePushNotificationToken()

  return useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No push notification token found")
      }

      logger.debug("Sending test push notification", token)

      const message = {
        to: token,
        title: "DecentAI notifications are working",
        body: "Your device is all set to receive notifications from DecentAI"
      }

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
      })

      logger.debug("Push notification sent", response.ok, await response.json())

      return response
    }
  })
}
