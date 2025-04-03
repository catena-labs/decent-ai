import {
  View as DefaultView,
  type ViewProps as DefaultViewProps,
  type StyleProp,
  type ViewStyle
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export type ViewProps = DefaultViewProps & {
  /**
   * If a safe area should be included or not, or if it should be included
   * only on one vertical side
   */
  safeArea?: boolean | "top" | "bottom"
}

/**
 * A wrapper around the <View> component which applies our basic styles,
 * considering dark mode, etc.
 */
export function View({ safeArea, style, ...props }: ViewProps) {
  const insets = useSafeAreaInsets()

  const safeAreaStyle: StyleProp<ViewStyle> =
    safeArea === "top"
      ? { paddingTop: insets.top }
      : safeArea === "bottom"
        ? { paddingBottom: insets.bottom }
        : safeArea
          ? { paddingTop: insets.top, paddingBottom: insets.bottom }
          : {}

  return <DefaultView style={[style, safeAreaStyle]} {...props} />
}
