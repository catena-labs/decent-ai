import { type MenuAction, MenuView } from "@react-native-menu/menu"
import { Platform } from "react-native"

import { Pressable, type PressableProps } from "./pressable"

export type SelectMenuOption<T extends string> = {
  id: T
  title: string
  subtitle?: string
  iosIcon?: string
  androidIcon?: string
  disabled?: boolean
}

export type SelectMenuProps<T extends string = string> = PressableProps & {
  value: T
  options: SelectMenuOption<T>[]
  onSelect?: (id: T) => void
}

/**
 * Converts a menu action into a selectable menu action, based on the `state`
 * property, which was previously only used for iOS devices.
 */
export function selectableMenuAction(action: MenuAction): MenuAction {
  return {
    ...action,
    title:
      Platform.select({
        android: `${action.state === "on" ? "✔ " : ""}${action.title}`
      }) ?? action.title
  }
}

/**
 * This component shows a native UIMenu for iOS and Android, and falls back
 * to a custom action sheet for Expo Go.
 */
export function SelectMenu<T extends string>({
  options,
  value,
  onSelect,
  ...props
}: SelectMenuProps<T>) {
  return (
    <MenuView
      actions={options.map(
        ({ id, title, subtitle, iosIcon, androidIcon, disabled }) =>
          selectableMenuAction({
            id,
            title,
            subtitle,
            state: value === id ? "on" : "off",
            image: Platform.select({
              ios: iosIcon,
              android: androidIcon
            }),
            attributes: {
              disabled
            }
          })
      )}
      onPressAction={({ nativeEvent }) => {
        onSelect?.(nativeEvent.event as T)
      }}
    >
      <Pressable {...props} />
    </MenuView>
  )
}
