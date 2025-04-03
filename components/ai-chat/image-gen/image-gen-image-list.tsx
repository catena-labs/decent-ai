import { FlashList, type ListRenderItem } from "@shopify/flash-list"
import { useColorScheme } from "nativewind"
import { type ComponentType, useCallback, useMemo } from "react"
import { Dimensions, type ScrollViewProps } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import Animated, { FadeIn } from "react-native-reanimated"

import { type ViewProps } from "@/components/elements/view"
import { type UserImage } from "@/drizzle/schema"
import { cn } from "@/lib/utils/cn"

import { type ImageGenImage, ImageGenImageRow } from "./image-gen-image-row"

type Props = ViewProps & {
  images: UserImage[]
  isAwaitingResponse?: boolean
  onDeleteImage: (imageId: string) => void
}

export function ImageGenImageList({
  images,
  isAwaitingResponse,
  onDeleteImage,
  className,
  ...props
}: Props) {
  const { colorScheme } = useColorScheme()

  const imageUrls = useMemo(() => {
    const urls: ImageGenImage[] = images.map((i) => ({
      uri: i.uri,
      id: i.id
    }))

    // If we're waiting on a response, add a loading indicator
    if (isAwaitingResponse) {
      urls.unshift({ id: "loading", uri: "", isLoading: true })
    }
    return urls
  }, [images, isAwaitingResponse])

  const renderItem = useCallback<ListRenderItem<ImageGenImage>>(
    ({ item, index }) => {
      return (
        <ImageGenImageRow
          image={item}
          onDeleteImage={onDeleteImage}
          allowTooltip={index === 0}
        />
      )
    },
    [onDeleteImage]
  )

  return (
    <Animated.View
      className={cn("flex-1", className)}
      entering={FadeIn.duration(400)}
      {...props}
    >
      <FlashList
        renderScrollComponent={ScrollView as ComponentType<ScrollViewProps>}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
          // Bottom padding, due to the list being inverted
          paddingTop: 120
        }}
        data={imageUrls}
        extraData={[colorScheme]}
        estimatedItemSize={Dimensions.get("window").width}
        inverted
        keyExtractor={(item) => `${item.id}-${item.uri}`}
        renderItem={renderItem}
      />
    </Animated.View>
  )
}
