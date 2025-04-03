import * as SystemUI from "expo-system-ui"
import { useEffect } from "react"
import { type ColorValue } from "react-native"

/**
 * A hook that sets the root background color of the app. This is useful for
 * changing the color when a modal opens.
 *
 * Upon unload, the original background color will be restored.
 *
 * @param color - a Color Value to use for the
 */
export function useRootBackgroundColor(backgroundColor?: ColorValue | null) {
  useEffect(() => {
    if (!backgroundColor) {
      return
    }

    let originalBackgroundColor: ColorValue | null = null

    void SystemUI.getBackgroundColorAsync().then((color) => {
      originalBackgroundColor = color

      void SystemUI.setBackgroundColorAsync(backgroundColor)
    })

    return () => {
      if (originalBackgroundColor) {
        void SystemUI.setBackgroundColorAsync(originalBackgroundColor)
      }
    }
  }, [backgroundColor])
}
