import * as Notifications from "expo-notifications"
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react"
import { AppState } from "react-native"

type PushNotificationsContext = {
  latestNotification: Notifications.Notification | null
}

const Context = createContext<PushNotificationsContext | undefined>(undefined)

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const notificationListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()
  const [latestNotification, setLatestNotification] =
    useState<Notifications.Notification | null>(null)

  // Whenever the app enters the foreground, including initial launch, dismiss
  // any notifications that may be present.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        void Notifications.dismissAllNotificationsAsync()
      }
    })

    // Dismiss any notifications on initial app launch as well.
    void Notifications.dismissAllNotificationsAsync()

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    // This listener is fired whenever a notification is received while the app
    // is foregrounded.
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setLatestNotification(notification)
      })

    // This listener is fired whenever a user taps on or interacts with a
    // notification (works when an app is foregrounded, backgrounded, or
    // killed).
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((_response) => {
        // noop
      })

    // Unsubscribe from the listener when the component unmounts.
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        )
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [])

  return (
    <Context.Provider value={{ latestNotification }}>
      {children}
    </Context.Provider>
  )
}

export const usePushNotifications = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error(
      "usePushNotification must be used within a PushNotificationProvider"
    )
  }
  return context
}
