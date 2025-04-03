import { Link, Stack } from "expo-router"

import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />

      <View className="flex-1 items-center justify-center p-5">
        <Text variant="bold" className="text-xl">
          This screen doesn&apos;t exist.
        </Text>

        <Link className="mt-4 py-4" href="/">
          <Text className="text-sm text-blue-500">Go to home screen!</Text>
        </Link>
      </View>
    </>
  )
}
