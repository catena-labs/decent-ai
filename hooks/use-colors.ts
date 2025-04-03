import { useColorScheme } from "nativewind"

const colors = {
  background: "#ffffff",
  foreground: "#09090b",
  card: "#ffffff",
  "card-foreground": "#09090b",
  popover: "#ffffff",
  "popover-foreground": "#09090b",
  primary: "#18181b",
  "primary-foreground": "#fafafa",
  secondary: "#f4f4f5",
  "secondary-foreground": "#18181b",
  muted: "#f4f4f5",
  "muted-foreground": "#71717a",
  accent: "#f4f4f5",
  "accent-foreground": "#18181b",
  destructive: "#ef4444",
  "destructive-foreground": "#fafafa",
  border: "#e4e4e7",
  input: "#e4e4e7",
  ring: "#18181b",

  // Non-standard:

  "background-highlight": "#EFEBE1",
  codeblock: "#1F1E2F",
  "codeblock-foreground": "#FFFFFF",
  "handle-indicator": "#E5E1D7"
}

const darkColors = {
  ...colors,
  background: "#09090b",
  foreground: "#fafafa",
  card: "#09090b",
  "card-foreground": "#fafafa",
  popover: "#09090b",
  "popover-foreground": "#fafafa",
  primary: "#fafafa",
  "primary-foreground": "#18181b",
  secondary: "#27272a",
  "secondary-foreground": "#fafafa",
  muted: "#27272a",
  "muted-foreground": "#a1a1aa",
  accent: "#27272a",
  "accent-foreground": "#fafafa",
  destructive: "#7f1d1d",
  "destructive-foreground": "#fafafa",
  border: "#27272a",
  input: "#27272a",
  ring: "#d4d4d8",

  // Non-standard:
  "background-highlight": "#1E264B",
  codeblock: "#27272a",
  "codeblock-foreground": "#FFFFFF",
  "handle-indicator": "#1E264B"
}

/**
 * A hook to get the colors based on the current color scheme.
 *
 * NOTE: This file has to be manually updated when we modify /assets/globals.css
 * It is not ideal.
 */
export function useColors() {
  const { colorScheme } = useColorScheme()
  const resolvedColors = colorScheme === "dark" ? darkColors : colors
  const invertedColors = colorScheme === "dark" ? colors : darkColors

  return {
    ...resolvedColors,
    inverted: invertedColors,
    light: colors,
    dark: darkColors
  }
}
