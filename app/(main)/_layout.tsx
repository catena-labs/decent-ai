import { Stack } from "expo-router"

import { RequireAuthentication } from "@/components/providers/authentication/require-authentication"
import { InAppPurchaseProvider } from "@/components/providers/in-app-purchase-provider"

export default function Layout() {
  return (
    <RequireAuthentication>
      <InAppPurchaseProvider>
        <Stack
          initialRouteName="chat"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen
            name="chat"
            options={{ headerShown: false, title: "" }}
          />
          <Stack.Screen name="settings" options={{ presentation: "modal" }} />
          <Stack.Screen name="new-model" options={{ presentation: "modal" }} />
          <Stack.Screen name="whats-new" options={{ presentation: "modal" }} />
        </Stack>
      </InAppPurchaseProvider>
    </RequireAuthentication>
  )
}
