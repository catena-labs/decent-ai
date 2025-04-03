import { Redirect, Stack } from "expo-router"

import { useAuthentication } from "@/hooks/use-authentication"

export default function AuthLayout() {
  const { isAuthenticated } = useAuthentication()

  if (isAuthenticated) {
    return <Redirect href="/" />
  }

  return (
    <Stack>
      <Stack.Screen name="signin" options={{ headerShown: false }} />
      <Stack.Screen name="connect-wallet" options={{ headerShown: false }} />
    </Stack>
  )
}
