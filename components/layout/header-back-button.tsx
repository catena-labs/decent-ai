import { useRouter } from "expo-router"
import { ChevronLeftIcon } from "lucide-react-native"

import { Pressable } from "../elements/pressable"
import { View } from "../elements/view"

export function HeaderBackButton() {
  const router = useRouter()

  return (
    <View className="flex-row items-center">
      <Pressable
        className="size-11 items-start justify-center"
        onPress={() => {
          if (router.canGoBack()) {
            router.back()
          } else {
            router.replace({
              pathname: "/(main)"
            })
          }
        }}
      >
        <ChevronLeftIcon className="text-foreground" size={24} />
      </Pressable>
    </View>
  )
}
