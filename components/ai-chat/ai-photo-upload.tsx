import { useActionSheet } from "@expo/react-native-action-sheet"
import * as ImagePicker from "expo-image-picker"
import { ImagePlusIcon } from "lucide-react-native"
import { usePostHog } from "posthog-react-native"
import { useCallback, useEffect, useState } from "react"

import { Pressable, type PressableProps } from "@/components/elements/pressable"
import { type Conversation } from "@/drizzle/schema"
import { useUpdateConversation } from "@/hooks/conversations/use-update-conversation"
import { useCameraPermissions } from "@/hooks/use-camera-permissions"
import { useModel } from "@/hooks/use-model"
import { isModelMatch } from "@/lib/ai/filter-model-list"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { createLogger } from "@/lib/logger"
import { isAndroid } from "@/lib/utils/platform"

import { Text } from "../elements/text"
import { ModelSelectMenu } from "../models/model-select-menu"

const logger = createLogger("components:ai-photo-upload")

const UPLOAD_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  base64: true,
  // Compress as much as we can to save on token counts.
  // Compression is much more aggressive on android, so
  // set a higher quality value there.
  quality: isAndroid ? 0.3 : 0
}

type AiPhotoUploadProps = PressableProps & {
  conversation: Conversation
  menuOpen?: boolean
  setImageUploadUrl: (imageData: string) => void
}

export function AiPhotoUpload({
  conversation,
  menuOpen,
  setImageUploadUrl,
  ...props
}: AiPhotoUploadProps) {
  const posthog = usePostHog()

  const { mutate: updateConversation } = useUpdateConversation(conversation.id)
  const { showActionSheetWithOptions } = useActionSheet()
  const {
    granted: cameraAccessGranted,
    requestPermissions: requestCameraPermissions
  } = useCameraPermissions()
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  const { model } = useModel(conversation)

  const handleImageResult = useCallback(
    (result: ImagePicker.ImagePickerResult) => {
      if (result.canceled) {
        logger.debug("Image picker was cancelled by the user.")
        return
      }

      const image = result.assets[0]
      if (image?.base64) {
        setImageUploadUrl(`data:${image.mimeType};base64,${image.base64}`)
      }
    },
    [setImageUploadUrl]
  )

  const onPressCamera = useCallback(async () => {
    if (!cameraAccessGranted) {
      await requestCameraPermissions()
    }

    const result = await ImagePicker.launchCameraAsync(UPLOAD_OPTIONS)

    handleImageResult(result)
  }, [handleImageResult, cameraAccessGranted, requestCameraPermissions])

  const onPressPhotoGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync(UPLOAD_OPTIONS)

    handleImageResult(result)
  }, [handleImageResult])

  const showPhotoUploadActionSheet = useCallback(() => {
    const cancelButtonIndex = 0
    const photoGalleryIndex = 1
    const cameraIndex = 2

    showActionSheetWithOptions(
      {
        options: ["Cancel", "Photo Gallery", "Camera"],
        cancelButtonIndex
      },
      async (index) => {
        switch (index) {
          case photoGalleryIndex:
            posthog.capture(ANALYTICS_EVENTS.PHOTO_GALLERY_UPLOAD_SELECTED)
            await onPressPhotoGallery()
            break

          case cameraIndex:
            posthog.capture(ANALYTICS_EVENTS.CAMERA_UPLOAD_SELECTED)
            await onPressCamera()
            break

          case cancelButtonIndex:
            posthog.capture(ANALYTICS_EVENTS.UPLOAD_IMAGE_CANCEL_PRESSED)
            break

          default:
            break
        }
      }
    )
  }, [showActionSheetWithOptions, posthog, onPressPhotoGallery, onPressCamera])

  const onUploadPress = useCallback(() => {
    const isVisionModelSelected = isModelMatch(model, {
      inputModality: "image"
    })

    if (isVisionModelSelected) {
      showPhotoUploadActionSheet()
    } else {
      setModelSelectorOpen(true)
    }
  }, [model, showPhotoUploadActionSheet])

  const renderMessage = useCallback(() => {
    return (
      <Text className="text-center">
        To use image upload select a mix or a model that supports vision
      </Text>
    )
  }, [])

  useEffect(() => {
    if (menuOpen) {
      onUploadPress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  return (
    <>
      <Pressable
        analyticsEvent="chat_upload_button_pressed"
        className="flex-row items-center rounded-full bg-secondary px-2 py-1"
        onPress={onUploadPress}
        {...props}
      >
        <ImagePlusIcon className="text-foreground" size={18} />
      </Pressable>

      <ModelSelectMenu
        hideAddYourOwn // Hide BYOM until we support adding vision models
        open={modelSelectorOpen}
        setOpen={setModelSelectorOpen}
        selectedSlug={model.slug}
        setSelectedSlug={(modelSlug) => {
          updateConversation({ modelSlug })
          setModelSelectorOpen(false)
          showPhotoUploadActionSheet()
        }}
        mode="vision"
        renderMessage={renderMessage}
      />
    </>
  )
}
