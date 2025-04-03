import { useActionSheet } from "@expo/react-native-action-sheet"
import { Image, type ImageProps } from "expo-image"
import * as Linking from "expo-linking"
import * as MediaLibrary from "expo-media-library"
import * as Sharing from "expo-sharing"
import { ShareIcon } from "lucide-react-native"
import { memo, useMemo, useState } from "react"
import ImageView from "react-native-image-viewing"

import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { Pressable } from "@/components/elements/pressable"
import { View } from "@/components/elements/view"
import { useLocalFile } from "@/hooks/use-local-file"
import { maybeResolveFileUri } from "@/lib/fs/maybe-resolve-file-uri"
import { createLogger } from "@/lib/logger"

type ShareableImageProps = ImageProps & {
  uri: string
  label?: string
}

// const blurhash =
//   "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj["

const logger = createLogger("components:shareable-image")

export const ShareableImage = memo(function ShareableImage({
  uri,
  label,
  style,
  ...props
}: ShareableImageProps) {
  const resolvedUri = useMemo(() => maybeResolveFileUri(uri), [uri])

  const { showActionSheetWithOptions } = useActionSheet()
  const { withLocalFile, isLoading: isDownloadingFile } =
    useLocalFile(resolvedUri)
  const [isVisible, setIsVisible] = useState(false)

  const shareImage = async () => {
    try {
      await withLocalFile(Sharing.shareAsync)
    } catch (error) {
      logger.error("Unable to share image", error)
    }
  }

  const showActionSheet = () => {
    showActionSheetWithOptions(
      {
        options: ["Cancel", "Open in Browser", "Save Image"],
        cancelButtonIndex: 0
      },
      async (index) => {
        if (index === 1) {
          void Linking.openURL(resolvedUri)
        } else if (index === 2) {
          try {
            await withLocalFile(MediaLibrary.saveToLibraryAsync)
          } catch (error) {
            logger.error("Unable to save image", error)
          }
        }
      }
    )
  }

  return (
    <View className="w-full flex-row">
      <ImageView
        imageIndex={0}
        images={[{ uri: resolvedUri }]}
        onLongPress={() => {
          showActionSheet()
        }}
        onRequestClose={() => {
          setIsVisible(false)
        }}
        visible={isVisible}
      />
      <View className="flex-row items-center justify-start">
        <Pressable
          onPress={() => {
            setIsVisible(true)
          }}
        >
          <Image
            {...props}
            aria-label={label}
            contentFit="cover"
            // placeholder={blurhash}
            source={{ uri: resolvedUri }}
            style={[
              {
                width: 200,
                height: 200,
                backgroundColor: "#0553"
              },
              style
            ]}
            // transition={1000}
          />
        </Pressable>
        <Pressable
          className="size-11 items-center justify-center pl-4"
          haptics
          onPress={() => {
            void shareImage()
          }}
        >
          <View className="size-8 items-center justify-center rounded-full bg-card">
            {isDownloadingFile ? (
              <ActivityIndicator size="small" />
            ) : (
              <ShareIcon className="text-primary" size={20} />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  )
})
