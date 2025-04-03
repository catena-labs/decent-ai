import { type PropsWithChildren } from "react"
import { Modal } from "react-native"

import { cn } from "@/lib/utils/cn"

import { Pressable } from "./pressable"
import { Text } from "./text"
import { View } from "./view"

type AlertButton = {
  text: string
  onPress: () => void
}

type AlertProps = PropsWithChildren & {
  visible: boolean
  cancelButton?: AlertButton
  confirmButton: AlertButton
}

export function Alert({
  children,
  visible,
  cancelButton,
  confirmButton
}: AlertProps) {
  return (
    <Modal
      statusBarTranslucent
      animationType="fade"
      transparent
      visible={visible}
    >
      <View className="absolute size-full bg-[#000000] opacity-70" />
      <View className="flex-1 items-center justify-center">
        <View className="w-10/12 rounded-xl bg-primary">
          <View className="items-center px-6 pt-8">{children}</View>
          <View className="w-full flex-row items-center">
            {cancelButton ? (
              <Pressable
                className="w-1/2 items-center py-3"
                onPress={cancelButton.onPress}
              >
                <Text className="text-primary-foreground">
                  {cancelButton.text}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              className={cn(
                "items-center py-3",
                cancelButton ? "w-1/2" : "w-full"
              )}
              onPress={confirmButton.onPress}
            >
              <Text variant="bold" className="text-primary-foreground">
                {confirmButton.text}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
