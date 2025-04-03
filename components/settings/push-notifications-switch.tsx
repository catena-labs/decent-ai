import { useCallback } from "react"
import { Alert, Linking } from "react-native"

import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { Switch } from "@/components/elements/switch"
import { usePushNotificationStatus } from "@/hooks/push-notifications/use-push-notification-status"
import { useRegisterForPushNotifications } from "@/hooks/push-notifications/use-register-for-push-notifications"
import { useUpdatePushNotificationToken } from "@/hooks/push-notifications/use-update-push-notification-token"
import { useUserSettings } from "@/hooks/use-user-settings"

/**
 * A component to allow toggling push notifications, while also handling the
 * permissions and status of push notifications.
 *
 * This component is meant to be used in-place of a <Switch /> component in the
 * settings screen.
 */
export function PushNotificationsSwitch() {
  const { mutate: updatePushNotificationToken } =
    useUpdatePushNotificationToken()

  const { mutate: requestPermissions, isPending: isRegistering } =
    useRegisterForPushNotifications()
  const {
    isPermissionDenied,
    isPermissionUndetermined,
    isPermissionGranted,
    isUnavailable,
    isLoading: isLoadingPermissionStatus
  } = usePushNotificationStatus()

  const pushNotificationsEnabled = useUserSettings(
    (state) => state.pushNotificationsEnabled
  )
  const setPushNotificationsEnabled = useUserSettings(
    (state) => state.setPushNotificationsEnabled
  )

  /**
   * If the user has granted us permission, and the setting is enabled, we
   * should consider push notifications to be enabled.
   */
  const isPushEnabled = pushNotificationsEnabled && isPermissionGranted

  /**
   * Handler which is called when a user enables or disables our push
   * notification settings
   *
   */
  const onPushNotificationsToggled = useCallback(
    (value: boolean) => {
      /**
       * If push notifications are not available on this device, show an
       * error. This should never occur because the Switch will be disabled,
       */
      if (isUnavailable) {
        Alert.alert(
          "Push Notifications Unavailable",
          "Push notifications are not available on this device."
        )
        return
      }

      /**
       * Update the push notification token with the API
       */
      updatePushNotificationToken(value)

      /**
       * Toggle the user-level setting for push notifications. The switch will
       * still remain "off" if the user has not granted us permission.
       */
      setPushNotificationsEnabled(value)

      // If the user turns off this setting, we can simply turn off our global
      // setting and return early.
      if (!value) {
        return
      }

      /**
       * If the user has explicitly DENIED permission, they must go to the
       * settings app to re-enable. In this case, we should show an alert
       * guiding them.
       */
      if (isPermissionDenied) {
        Alert.alert(
          "Enable Push Notifications",
          "Please enable push notifications in your device settings.",
          [
            {
              text: "Go to Settings",
              onPress: () => void Linking.openSettings()
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        )
        return
      }

      /**
       * If the user has not yet been prompted for permission, we should
       * request it now.  If they deny here, the switch will remain off. If they
       * approve, the switch will be enabled.
       */
      if (isPermissionUndetermined) {
        requestPermissions()
      }
    },
    [
      isPermissionDenied,
      isPermissionUndetermined,
      isUnavailable,
      requestPermissions,
      setPushNotificationsEnabled,
      updatePushNotificationToken
    ]
  )

  /**
   * While we're registering for push notifications, we should show a loading
   * indicator.
   */
  if (isLoadingPermissionStatus || isRegistering) {
    return <ActivityIndicator size={20} />
  }

  return (
    <Switch
      analyticsEvent={(value) =>
        `push_notifications_${value ? "enabled" : "disabled"}`
      }
      disabled={isUnavailable}
      onValueChange={onPushNotificationsToggled}
      value={isPushEnabled}
    />
  )
}
