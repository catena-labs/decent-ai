import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider
} from "@react-navigation/native"
import * as NavigationBar from "expo-navigation-bar"
import { useColorScheme } from "nativewind"
import { type PropsWithChildren, useEffect } from "react"

import { useColors } from "@/hooks/use-colors"
import { useUserSettings } from "@/hooks/use-user-settings"
import { isAndroid } from "@/lib/utils/platform"

// Set the android bottom navigation bar to `absolute` so we can slide our UI
// behind it, and apply a transparent color.
if (isAndroid) {
  void NavigationBar.setPositionAsync("absolute")
}

type ThemeProviderProps = PropsWithChildren & {
  /**
   * Boolean indicating whether the user settings store is ready
   */
  isReady: boolean
}

export function ThemeProvider({ children, isReady }: ThemeProviderProps) {
  const colors = useColors()
  // eslint-disable-next-line @typescript-eslint/unbound-method -- this is appropriate usage of the hook
  const { colorScheme, setColorScheme } = useColorScheme()
  const userColorScheme = useUserSettings((state) => state.colorScheme)

  useEffect(() => {
    // Change application color scheme to match selected user preference
    if (isReady) {
      setColorScheme(userColorScheme)
    }
  }, [isReady, userColorScheme, setColorScheme])

  useEffect(() => {
    // Any time our theme changes, we can apply the appropriate color to the
    // bottom navigation bar on android
    if (isAndroid) {
      void NavigationBar.setBackgroundColorAsync(
        `${colors.background}00` // append 0 to the end to make it transparent
      )
    }
  }, [colors.background])

  return (
    // Wrapping with theme provider since react navigation components are not styled with tailwind.
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      {children}
    </NavigationThemeProvider>
  )
}
