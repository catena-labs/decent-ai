import { createId } from "@paralleldrive/cuid2"
import { useCallback, useState } from "react"
import { Keyboard, KeyboardAvoidingView } from "react-native"

import { View } from "@/components/elements/view"
import {
  BottomInput,
  type InputControlsProps
} from "@/components/layout/bottom-input"
import { type UserImage } from "@/drizzle/schema"
import { useCreateImages } from "@/hooks/images/use-create-images"
import { useDeleteImage } from "@/hooks/images/use-delete-image"
import {
  type AspectRatio,
  useGenerateImage
} from "@/hooks/openai/use-generate-image"
import { useOpenAI } from "@/hooks/openai/use-openai"
import { useImageGenState } from "@/hooks/use-image-gen-state"
import { useModel } from "@/hooks/use-model"
import { useUpgradeBar } from "@/hooks/use-upgrade-bar"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { compact } from "@/lib/utils/array-fns/compact"
import { cn } from "@/lib/utils/cn"

import { ImageGenImageList } from "./image-gen-image-list"
import { ImageGenInputAccessories } from "./image-gen-input-accessories"

type ImageGenViewProps = {
  image?: UserImage
}

export function ImageGenView({ image }: ImageGenViewProps) {
  const currentModelSlug = useImageGenState((state) => state.currentModelSlug)

  const { model: currentModel } = useModel({
    modelSlug: currentModelSlug,
    mode: "image-gen"
  })

  const { mutateAsync: createImages } = useCreateImages()
  const { mutate: deleteImage } = useDeleteImage()

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1024x1024")

  const [isSending, setIsSending] = useState(false)

  const { openai } = useOpenAI("internal")
  const { mutateAsync: generateImage, isPending: isGeneratingImage } =
    useGenerateImage({ openai })

  const [abortController, setAbortController] =
    useState<AbortController | null>(null)

  const { showUpgradeBar } = useUpgradeBar()

  // Inverted list of images
  const [images, setImages] = useState<UserImage[]>(image ? [image] : [])

  const stop = useCallback(() => {
    abortController?.abort()
  }, [abortController])

  const onMessageSend = useCallback(
    async (prompt: string) => {
      const newAbortController = new AbortController()
      setAbortController(newAbortController)
      setIsSending(true)

      try {
        const { data, model, provider } = await generateImage({
          model: currentModel.slug,
          prompt,
          size: aspectRatio,
          signal: newAbortController.signal
        })

        const uris = compact(data.data.map((d) => d.url))

        const newImages = await createImages({
          generationId: createId(),
          model,
          modelSlug: currentModel.slug,
          prompt,
          provider,
          uris
        })

        setImages((current) => [...newImages, ...current])
      } catch {
        // Do nothing - error handling is done in the hook
      } finally {
        setIsSending(false)
      }
    },
    [aspectRatio, createImages, currentModel.slug, generateImage]
  )

  const onSubmit = useCallback(
    (input: string) => {
      Keyboard.dismiss()
      if (input) {
        void onMessageSend(input)
      }
    },
    [onMessageSend]
  )

  const onInterrupt = useCallback(() => {
    stop()
  }, [stop])

  const onDeleteImage = useCallback(
    (imageId: string) => {
      const index = images.findIndex((i) => i.id === imageId)

      // Remove the image from the view
      if (index !== -1) {
        setImages(images.toSpliced(index, 1))
      }

      deleteImage(imageId)
    },
    [deleteImage, images]
  )

  const inputControls = useCallback(
    ({ input, setInput }: InputControlsProps) => {
      return (
        <ImageGenInputAccessories
          input={input}
          setInput={setInput}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
        />
      )
    },
    [aspectRatio]
  )

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <ImageGenImageList
          images={images}
          isAwaitingResponse={isSending}
          onDeleteImage={onDeleteImage}
          className={cn(showUpgradeBar ? "pb-10" : "")}
        />
      </KeyboardAvoidingView>

      <BottomInput
        initialInput={image?.prompt}
        inputControls={inputControls}
        isAwaitingResponse={isSending || isGeneratingImage}
        onInterrupt={onInterrupt}
        onSubmit={onSubmit}
        persistOnSubmit
        placeholder="Describe your image ..."
        submitEvent={ANALYTICS_EVENTS.IMAGE_GEN_PROMPT_SUBMITTED}
      />
    </View>
  )
}
