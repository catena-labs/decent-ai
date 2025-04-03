/* eslint-disable camelcase -- font imports use snake */
import "@/assets/globals.css"

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold
} from "@expo-google-fonts/inter"
import { SpaceMono_400Regular } from "@expo-google-fonts/space-mono"
import * as Sentry from "@sentry/react-native"
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { useFonts } from "expo-font"
import * as Notifications from "expo-notifications"
import { Stack, useNavigationContainerRef } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { Text } from "@/components/elements/text"
import { ToastContainer } from "@/components/elements/toast"
import { View } from "@/components/elements/view"
import { Providers } from "@/components/providers/providers"
import { ReactQueryProvider } from "@/components/providers/react-query-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { db } from "@/drizzle/client"
import migrations from "@/drizzle/migrations/migrations"
import { env } from "@/env"
import { printEnv } from "@/env/debug"
import { useCustomModelStore } from "@/hooks/custom-models/use-custom-model-store"
import { useChatState } from "@/hooks/use-chat-state"
import { useImageGenState } from "@/hooks/use-image-gen-state"
import { useUserSettings } from "@/hooks/use-user-settings"
import { useAuthStore } from "@/lib/auth/auth-store"
import { createLogger } from "@/lib/logger"

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from "expo-router"

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(main)"
}

const logger = createLogger("root-layout")

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync()

// This handler determines how your app handles notifications that come in while
// the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async (_notification) => {
    return Promise.resolve({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false
    })
  }
})

// Log debug environment variables to the console.
printEnv()

// Initialize Sentry
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation()
Sentry.init({
  dsn: env.EXPO_PUBLIC_SENTRY_DSN,
  debug: false,
  integrations: [
    new Sentry.ReactNativeTracing({
      // Pass instrumentation to be used as `routingInstrumentation`
      routingInstrumentation
      // ...
    })
  ]
})

/**
 * A loader component that will perform any async tasks that need to be
 * performed _before_ the splash screen is removed.
 *
 * Keep the logic here to be as minimal as possible, as it will affect app
 * startup time.
 */
function App() {
  // Capture the NavigationContainer ref and register it with the instrumentation.
  const ref = useNavigationContainerRef()
  const [isReactQueryReady, setIsReactQueryReady] = useState(false)
  const [isFontLoaded, fontLoadError] = useFonts({
    SpaceMono_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold
  })

  // Migrate the database
  const { success: migrationSuccess, error: migrationError } = useMigrations(
    db,
    migrations
  )

  // Ensure our persisted state is loaded
  const isAuthStoreReady = useAuthStore((state) => state.isReady)
  const isUserSettingsStoreReady = useUserSettings((state) => state.isReady)
  const isChatStateReady = useChatState((state) => state.isReady)
  const isImageGenStateReady = useImageGenState((state) => state.isReady)
  const isCustomModelStoreReady = useCustomModelStore((state) => state.isReady)

  const loaded =
    isReactQueryReady &&
    isFontLoaded &&
    isAuthStoreReady &&
    isUserSettingsStoreReady &&
    isChatStateReady &&
    isImageGenStateReady &&
    isCustomModelStoreReady &&
    migrationSuccess

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontLoadError) {
      throw fontLoadError
    }
  }, [fontLoadError])

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync()
    }
  }, [loaded])

  useEffect(() => {
    routingInstrumentation.registerNavigationContainer(ref)
  }, [ref])

  if (migrationError) {
    logger.error("Migration error", migrationError.message)
    Sentry.captureException(migrationError)

    return (
      <View>
        <Text>Migration error: {migrationError.message}</Text>
      </View>
    )
  }

  return (
    <ReactQueryProvider
      setIsReady={() => {
        logger.debug("✅ React Query is ready")
        setIsReactQueryReady(true)
      }}
    >
      {loaded ? <RootLayout /> : null}
    </ReactQueryProvider>
  )
}

function RootLayout() {
  return (
    <ThemeProvider isReady>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Providers>
          <Stack initialRouteName="(main)">
            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
                animation: "none"
              }}
            />
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
          </Stack>
          <ToastContainer />
        </Providers>
      </GestureHandlerRootView>
    </ThemeProvider>
  )
}

export default Sentry.wrap(App)
