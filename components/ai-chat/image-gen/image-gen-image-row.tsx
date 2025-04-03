import { MenuView } from "@react-native-menu/menu"
import { Image } from "expo-image"
import * as Sharing from "expo-sharing"
import { MoreHorizontal } from "lucide-react-native"
import { usePostHog } from "posthog-react-native"
import { useMemo, useState } from "react"
import ImageView from "react-native-image-viewing"
import Toast from "react-native-toast-message"

import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { Pressable } from "@/components/elements/pressable"
import { View } from "@/components/elements/view"
import { Tooltip } from "@/components/tooltip/tooltip"
import { useColors } from "@/hooks/use-colors"
import { useLocalFile } from "@/hooks/use-local-file"
import { useUserSettings } from "@/hooks/use-user-settings"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { maybeResolveFileUri } from "@/lib/fs/maybe-resolve-file-uri"
import { createLogger } from "@/lib/logger"

const logger = createLogger("components:ai-chat:image-gen:image-gen-image-row")

export type ImageGenImage = {
  id: string
  uri: string
  isLoading?: boolean
}

type Props = {
  image: ImageGenImage
  onDeleteImage: (imageId: string) => void
  allowTooltip?: boolean
}

export function ImageGenImageRow({
  image,
  onDeleteImage,
  allowTooltip
}: Props) {
  const posthog = usePostHog()
  const colors = useColors()
  const [hasSeenImageTooltip, setHasSeenImageTooltip] = useUserSettings(
    (state) => [state.hasSeenImageTooltip, state.setHasSeenImageTooltip]
  )

  const resolvedUri = useMemo(() => maybeResolveFileUri(image.uri), [image.uri])

  const { withLocalFile } = useLocalFile(resolvedUri)
  const [isVisible, setIsVisible] = useState(false)

  const menuActions = [
    {
      id: "share-image",
      title: "Share image"
    },
    {
      id: "flag-image",
      title: "Flag as inappropriate",
      attributes: {
        destructive: true
      }
    },
    {
      id: "delete-image",
      title: "Delete image",
      attributes: {
        destructive: true
      }
    }
  ]

  const shouldShowTooltip = useMemo(() => {
    return !image.isLoading && allowTooltip && !hasSeenImageTooltip
  }, [hasSeenImageTooltip, image.isLoading, allowTooltip])

  const shareImage = async () => {
    try {
      await withLocalFile(Sharing.shareAsync)
    } catch (error) {
      logger.error("Unable to share image", error)
    }
  }

  return (
    <>
      <Pressable
        className="mb-4 aspect-square w-full overflow-hidden rounded-lg bg-secondary"
        onPress={() => {
          if (resolvedUri) {
            setIsVisible(true)
          }
        }}
      >
        {image.isLoading ? (
          <ActivityIndicator
            className="size-full"
            color={colors["secondary-foreground"]}
          />
        ) : (
          <>
            <Image
              recyclingKey={resolvedUri}
              source={{ uri: resolvedUri }}
              className="aspect-square w-full flex-1"
              style={{
                flex: 1,
                width: "100%",
                backgroundColor: colors["background-highlight"]
              }}
            />
            <View className="absolute right-2.5 top-4 flex size-[30px] items-center justify-center rounded-full bg-[#000000]/50">
              <MenuView
                actions={menuActions}
                onPressAction={({ nativeEvent }) => {
                  if (nativeEvent.event === "share-image") {
                    posthog.capture(ANALYTICS_EVENTS.IMAGE_GEN_SHARE_IMAGE)
                    void shareImage()
                  } else if (nativeEvent.event === "flag-image") {
                    posthog.capture(ANALYTICS_EVENTS.IMAGE_GEN_FLAG_IMAGE)
                    Toast.show({
                      type: "info",
                      text1: "Flagged as inappropriate",
                      text2: "Thank you for reporting this image"
                    })
                    onDeleteImage(image.id)
                  } else if (nativeEvent.event === "delete-image") {
                    posthog.capture(ANALYTICS_EVENTS.IMAGE_GEN_DELETE_IMAGE)
                    onDeleteImage(image.id)
                  }
                }}
              >
                <Pressable>
                  <MoreHorizontal
                    className="text-white opacity-100"
                    size={24}
                  />
                </Pressable>
              </MenuView>
            </View>
          </>
        )}
      </Pressable>
      {shouldShowTooltip ? (
        <View className="absolute inset-x-0 top-15 -mr-2">
          <Tooltip
            title="Send Feedback"
            description="Flag an image as inappropriate, send feedback, delete, share, or save."
            arrowPosition="top-right"
            onClose={() => {
              setHasSeenImageTooltip(true)
            }}
            delay={500}
          />
        </View>
      ) : null}
      <ImageView
        imageIndex={0}
        images={[{ uri: resolvedUri }]}
        onRequestClose={() => {
          setIsVisible(false)
        }}
        visible={isVisible}
      />
    </>
  )
}
