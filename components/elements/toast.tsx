import { useSafeAreaInsets } from "react-native-safe-area-context"
import OriginalToast, {
  type ToastConfig,
  type ToastConfigParams,
  type ToastProps
} from "react-native-toast-message"

import { cn } from "@/lib/utils/cn"

import { Pressable, type PressableProps } from "./pressable"
import { Text } from "./text"
import { View } from "./view"

function BaseToast({
  text1,
  text2,
  type,
  hide,
  props,
  ..._rest
}: ToastConfigParams<PressableProps>) {
  return (
    <View className="w-full px-4">
      <Pressable
        analyticsEvent="toast_dismissed"
        className={cn(
          "rounded-md p-4",
          type === "error" ? "bg-destructive" : "bg-primary"
        )}
        onPress={() => {
          hide()
        }}
        {...props}
      >
        <Text
          variant="semibold"
          className={cn(
            "text-sm",
            type === "error"
              ? "text-destructive-foreground"
              : "text-primary-foreground"
          )}
        >
          {text1}
        </Text>
        {text2 ? (
          <Text
            className={cn(
              "text-xs",
              type === "error"
                ? "text-destructive-foreground"
                : "text-primary-foreground"
            )}
          >
            {text2}
          </Text>
        ) : null}
      </Pressable>
    </View>
  )
}

const toastConfig: ToastConfig = {
  success: (props) => <BaseToast {...props} />,
  error: (props) => <BaseToast {...props} />,
  info: (props) => <BaseToast {...props} />
}

export function ToastContainer(props: ToastProps) {
  const { top } = useSafeAreaInsets()

  return <OriginalToast {...props} config={toastConfig} topOffset={top} />
}
