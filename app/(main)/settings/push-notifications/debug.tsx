import { FlashList } from "@shopify/flash-list"
import {
  CheckIcon,
  ChevronRightIcon,
  HeartHandshakeIcon,
  VibrateIcon
} from "lucide-react-native"
import { type ComponentType } from "react"
import { Linking, type ScrollViewProps } from "react-native"
import { ScrollView } from "react-native-gesture-handler"

import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { ModalHeader } from "@/components/layout/modal-header"
import { usePushNotificationStatus } from "@/hooks/push-notifications/use-push-notification-status"
import { useRegisterForPushNotifications } from "@/hooks/push-notifications/use-register-for-push-notifications"
import { useTestPushNotification } from "@/hooks/push-notifications/use-test-push-notification"
import { cn } from "@/lib/utils/cn"

export default function AdvancedSettingsScreen() {
  const { mutate: requestPermissions, isPending: isRegistering } =
    useRegisterForPushNotifications()

  const { mutate: sendTestNotification, isPending: isSendingTestNotification } =
    useTestPushNotification()

  const {
    isPermissionDenied,
    isPermissionUndetermined,
    isPermissionGranted,
    isLoading: isLoadingPermissionStatus
  } = usePushNotificationStatus()

  const pushNotifications = (
    <View className="gap-3">
      <Text className="uppercase text-secondary-foreground">
        Push Notifications
      </Text>

      <View className="gap-px">
        <Pressable
          className={cn(
            "flex-row items-center gap-2 rounded-t-xl bg-card p-3",
            isPermissionDenied || isPermissionUndetermined
              ? "active:opacity-50"
              : undefined
          )}
          onPress={() => {
            if (isPermissionDenied) {
              void Linking.openSettings()
            } else if (isPermissionUndetermined) {
              requestPermissions()
            }
          }}
        >
          <HeartHandshakeIcon className="text-primary" size={20} />
          <Text className="grow text-foreground">Permissions</Text>
          <>
            {isLoadingPermissionStatus || isRegistering ? (
              <ActivityIndicator size={20} />
            ) : isPermissionDenied ? (
              <View className="flex-row gap-1">
                <Text className="text-secondary-foreground">
                  Denied &ndash;
                </Text>
                <Text className="text-primary">Fix in Settings</Text>
              </View>
            ) : isPermissionGranted ? (
              <CheckIcon className="text-primary" size={20} />
            ) : isPermissionUndetermined ? (
              <Text variant="bold" className="text-primary">
                Request
              </Text>
            ) : (
              <Text className="text-secondary-foreground">Unavailable</Text>
            )}
          </>
        </Pressable>

        <Pressable
          className={cn(
            "flex-row items-center gap-2 rounded-b-xl bg-card p-3",
            isPermissionGranted ? " active:opacity-50" : "opacity-50"
          )}
          onPress={() => {
            if (isPermissionGranted) {
              sendTestNotification()
            }
          }}
        >
          <VibrateIcon className="text-primary" size={20} />
          <Text className="grow text-foreground">Send test notification</Text>
          <>
            {isSendingTestNotification ? (
              <ActivityIndicator size={20} />
            ) : (
              <ChevronRightIcon
                className="text-secondary-foreground"
                size={20}
              />
            )}
          </>
        </Pressable>
      </View>
    </View>
  )

  return (
    <View className="size-full bg-background">
      <ModalHeader backIcon="back" title="Push Notification Settings" />
      <FlashList
        renderScrollComponent={ScrollView as ComponentType<ScrollViewProps>}
        contentContainerStyle={{ padding: 20 }}
        data={[pushNotifications]}
        estimatedItemSize={150}
        keyExtractor={(_item, index) => index.toString()}
        renderItem={({ item }) => <View className="mb-7">{item}</View>}
      />
    </View>
  )
}
