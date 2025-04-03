import { Pressable, type PressableProps } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"

export type InfoButtonProps = PressableProps & {
  onPressHandler: () => void
  message: string
  icon?: React.ReactNode
}

/**
 * `InfoButton` is a pressable component that displays a message and an optional icon.
 * It supports light and dark color schemes.
 *
 * @param props - InfoButtonProps
 * @param message - The message to display on the button.
 * @param onPressHandler - The function to call when the button is pressed.
 * @param icon - An optional icon to display on the button.
 */
export function InfoButton({
  message,
  onPressHandler,
  icon,
  ...props
}: InfoButtonProps) {
  return (
    <Pressable
      className="mx-auto rounded-xl bg-secondary p-2"
      haptics
      onPress={onPressHandler}
      {...props}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {icon !== null && icon !== undefined && icon}
        <Text variant="bold" className="text-sm leading-snug text-primary">
          {message}
        </Text>
      </View>
    </Pressable>
  )
}
