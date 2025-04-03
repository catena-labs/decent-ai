import { useLocalSearchParams } from "expo-router"

import { ImageGenView } from "@/components/ai-chat/image-gen/image-gen-view"
import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { View } from "@/components/elements/view"
import { useImage } from "@/hooks/images/use-image"

type SearchParams = {
  image: string
}

export default function ImageScreen() {
  const { image } = useLocalSearchParams<SearchParams>()
  const { data: userImage, isLoading: isLoadingImage } = useImage(image)

  if (image && isLoadingImage) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  return <ImageGenView image={userImage} />
}
