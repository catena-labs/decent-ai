import { Stack } from "expo-router"

import { useColors } from "@/hooks/use-colors"
import { useRootBackgroundColor } from "@/hooks/use-root-background-color"

export default function NewModelLayout() {
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
