import {
  ActivityIndicator as DefaultActivityIndicator,
  type ActivityIndicatorProps as DefaultActivityIndicatorProps
} from "react-native"

import { useColors } from "@/hooks/use-colors"

export type ActivityIndicatorProps = DefaultActivityIndicatorProps

/**
 * A wrapper around the <ActivityIndicator> component which applies our basic
 * styles, considering dark mode, etc.
 */
export function ActivityIndicator(props: ActivityIndicatorProps) {
  const colors = useColors()

  return <DefaultActivityIndicator color={colors.foreground} {...props} />
}
