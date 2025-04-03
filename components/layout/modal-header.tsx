import { useRouter } from "expo-router"
import { ChevronLeftIcon, XIcon } from "lucide-react-native"

import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View, type ViewProps } from "@/components/elements/view"
import { isAndroid } from "@/lib/utils/platform"

export type ModalHeaderProps = ViewProps & {
  title?: string
  backIcon?: "x" | "back"
}

export function ModalHeader({
  title,
  backIcon = "x",
  ...props
}: ModalHeaderProps) {
  const router = useRouter()
  return (
    <View
      className="android:mt-4 flex-row rounded-t-lg bg-background px-5 pt-5"
      safeArea={isAndroid ? "top" : false}
      {...props}
    >
      <Pressable
        className="size-11"
        onPress={() => {
          if (router.canGoBack()) {
            router.back()
          } else {
            router.navigate({
              pathname: "/(main)"
            })
          }
        }}
      >
        {backIcon === "x" ? (
          <XIcon className="size-full text-foreground" />
        ) : (
          <ChevronLeftIcon className="size-full text-foreground" />
        )}
      </Pressable>
      <Text variant="bold" className="text-[17px] text-foreground">
        {title}
      </Text>
    </View>
  )
}
