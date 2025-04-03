import { Image } from "expo-image"
import { useRouter } from "expo-router"

import { type UserImage } from "@/drizzle/schema"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { maybeResolveFileUri } from "@/lib/fs/maybe-resolve-file-uri"
import { cn } from "@/lib/utils/cn"

import { Pressable } from "../elements/pressable"
import { Text } from "../elements/text"
import { View } from "../elements/view"

export type ImageGalleryRowProps = {
  className?: string
  latestImages?: UserImage[]
}

export function ImageGalleryRow({
  className,
  latestImages
}: ImageGalleryRowProps) {
  const router = useRouter()

  if (!latestImages?.length) {
    return null
  }

  return (
    <Pressable
      analyticsEvent={ANALYTICS_EVENTS.IMAGE_GALLERY_OPENED}
      className={cn(className, "min-h-[60px] flex-row items-center gap-2 py-2")}
      onPress={() => {
        router.push({
          pathname: "/(main)/image/gallery"
        })
      }}
      onLongPress={() => null}
      delayLongPress={150}
    >
      <View className="size-7">
        {latestImages.toReversed().map((image, index) => (
          <Image
            key={image.id}
            source={{ uri: maybeResolveFileUri(image.uri) }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 5,
              position: "absolute",
              transform: [{ rotate: `${index * 15}deg` }]
            }}
          />
        ))}
      </View>

      <Text variant="medium" className="text-sm text-foreground">
        Image Gallery
      </Text>
    </Pressable>
  )
}
