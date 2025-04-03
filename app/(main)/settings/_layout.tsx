import { Stack } from "expo-router"

import { useColors } from "@/hooks/use-colors"
import { useRootBackgroundColor } from "@/hooks/use-root-background-color"

export default function Layout() {
  const colors = useColors()
  useRootBackgroundColor(colors.primary)

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    />
  )
}
