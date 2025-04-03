import { useQuery } from "@tanstack/react-query"
// eslint-disable-next-line import/no-named-as-default -- Must be imported as `Constants` for expo
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"

import { createLogger } from "@/lib/logger"
import { ONE_DAY } from "@/lib/utils/date-fns/dates"

import { usePushNotificationStatus } from "./use-push-notification-status"

const logger = createLogger("use-push-notification-token")

const easConfig = Constants.expoConfig?.extra?.eas as {
  projectId?: string
} | null
const projectId = easConfig?.projectId

export function usePushNotificationToken() {
  const { isPermissionGranted } = usePushNotificationStatus()

  return useQuery({
    queryKey: ["push-notification-token"],
    queryFn: async () => {
      logger.debug("Getting expo push token...")
      const token = await Notifications.getExpoPushTokenAsync({
        projectId
      })

      return token.data
    },
    enabled: isPermissionGranted,
    staleTime: ONE_DAY,
    gcTime: ONE_DAY
  })
}
