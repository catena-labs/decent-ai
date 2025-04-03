import { FlashList, type ListRenderItem } from "@shopify/flash-list"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useColorScheme } from "nativewind"
import { type ComponentType, useCallback } from "react"
import { type ScrollViewProps } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import Animated, { FadeIn } from "react-native-reanimated"

import { Pressable } from "@/components/elements/pressable"
import { View } from "@/components/elements/view"
import { type UserImage } from "@/drizzle/schema"
import { maybeResolveFileUri } from "@/lib/fs/maybe-resolve-file-uri"

type ImageGalleryProps = {
  images: UserImage[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const router = useRouter()
  const { colorScheme } = useColorScheme()

  const renderItem = useCallback<ListRenderItem<UserImage>>(
    ({ item }) => {
      return (
        <Pressable
          analyticsEvent="image_gallery_image_opened"
          onPress={() => {
            router.push({
              pathname: "/image/generate/[image]",
              params: { image: item.id, modelSlug: item.modelSlug }
            })
          }}
          className="flex-1 items-center"
        >
          <Image
            source={{ uri: maybeResolveFileUri(item.uri) }}
            style={{
              width: 160,
              height: 160,
              borderRadius: 10,
              marginBottom: 20
            }}
          />
        </Pressable>
      )
    },
    [router]
  )

  return (
    <View className="flex-1 bg-background">
      <Animated.View className="flex-1" entering={FadeIn.duration(400)}>
        <FlashList
          renderScrollComponent={ScrollView as ComponentType<ScrollViewProps>}
          contentContainerStyle={{
            paddingTop: 20,
            paddingHorizontal: 16
          }}
          data={images}
          extraData={[colorScheme]}
          estimatedItemSize={160}
          numColumns={2}
          keyExtractor={(item) => `${item.id}-${item.uri}`}
          renderItem={renderItem}
        />
      </Animated.View>
    </View>
  )
}
