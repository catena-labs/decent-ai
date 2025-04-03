import { useCallback } from "react"

import { usePushNotificationStatus } from "@/hooks/push-notifications/use-push-notification-status"
import { useRegisterForPushNotifications } from "@/hooks/push-notifications/use-register-for-push-notifications"
import { useUpdatePushNotificationToken } from "@/hooks/push-notifications/use-update-push-notification-token"
import { useUserSettings } from "@/hooks/use-user-settings"

import { Alert } from "../elements/alert"
import { Text } from "../elements/text"
import { View } from "../elements/view"

export function NotificationPermissionsAlert() {
  const { isPermissionUndetermined, isLoading: isLoadingPermissionStatus } =
    usePushNotificationStatus()

  const { mutate: updatePushNotificationToken } =
    useUpdatePushNotificationToken()

  const { mutate: requestPermissions } = useRegisterForPushNotifications()

  const appLoadCount = useUserSettings((state) => state.appLoadCount)

  const [hasSeenNotificationsAlert, setHasSeenNotificationsAlert] =
    useUserSettings((state) => [
      state.hasSeenNotificationsAlert,
      state.setHasSeenNotificationsAlert
    ])

  const setPushNotificationsEnabled = useUserSettings(
    (state) => state.setPushNotificationsEnabled
  )

  const onEnableNotifications = useCallback(() => {
    requestPermissions()

    // Enable the user-level setting for push notifications.
    setPushNotificationsEnabled(true)
    // Update the push notification token with the API
    updatePushNotificationToken(true)
    setHasSeenNotificationsAlert(true)
  }, [
    requestPermissions,
    setPushNotificationsEnabled,
    setHasSeenNotificationsAlert,
    updatePushNotificationToken
  ])

  const shouldShowAlert =
    appLoadCount > 1 &&
    !hasSeenNotificationsAlert &&
    !isLoadingPermissionStatus &&
    // The user has not explicitly denied or granted permissions already
    isPermissionUndetermined

  if (!shouldShowAlert) {
    return null
  }

  return (
    <Alert
      cancelButton={{
        text: "No thanks",
        onPress: () => {
          setHasSeenNotificationsAlert(true)
        }
      }}
      confirmButton={{ text: "Continue", onPress: onEnableNotifications }}
      visible
    >
      <View className="items-center justify-center rounded-[30px] bg-white px-3 py-1">
        <Text className="text-2xl">🆕 🚀 🔔</Text>
      </View>
      <Text variant="bold" className="mt-3 text-lg text-primary-foreground">
        Get updates from DecentAI
      </Text>
      <Text className="my-2 text-center text-primary-foreground">
        Turn on notifications to get the most out of DecentAI by staying up to
        date on new models and features.{"\n\n"}
        You can change these settings anytime.
      </Text>
    </Alert>
  )
}
