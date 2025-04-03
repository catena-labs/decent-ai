import { useRouter } from "expo-router"

import { ImageGallery } from "@/components/ai-chat/image-gen/image-gallery"
import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useImages } from "@/hooks/images/use-images"

export default function GalleryScreen() {
  const router = useRouter()
  const { data: images, isLoading: isLoadingImages } = useImages()

  if (isLoadingImages) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  if (!images?.length) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <View className="flex flex-col items-center gap-10">
          <View className="flex flex-col items-center">
            <Text variant="bold" className="text-lg text-foreground">
              No images in your gallery
            </Text>
            <Text className="text-foreground">Start creating images now</Text>
          </View>
          <Pressable
            onPress={() => {
              router.replace("/image/generate")
            }}
          >
            <Text variant="bold" className="text-lg text-primary">
              Create an image
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return <ImageGallery images={images} />
}
