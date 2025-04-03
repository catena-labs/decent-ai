import { usePathname } from "expo-router"
import { useMemo } from "react"

import { type Model } from "@/lib/ai/models"

import { useChatState } from "./use-chat-state"
import { useImageGenState } from "./use-image-gen-state"
import { useModel } from "./use-model"

/**
 * Returns the current selected model based on whether the user is
 * in chat or image gen mode.
 */
export function useCurrentModel(): Model {
  const pathname = usePathname()

  const lastSelectedChatSlug = useChatState(
    (state) => state.lastSelectedModelSlug
  )
  const lastSelectedImageGenSlug = useImageGenState(
    (state) => state.currentModelSlug
  )

  const isImageGen = useMemo(() => {
    return pathname.includes("/image")
  }, [pathname])

  const currentModelSlug = useMemo(() => {
    return isImageGen ? lastSelectedImageGenSlug : lastSelectedChatSlug
  }, [isImageGen, lastSelectedChatSlug, lastSelectedImageGenSlug])

  const { model: currentModel } = useModel({
    modelSlug: currentModelSlug,
    mode: isImageGen ? "image-gen" : "chat"
  })

  return currentModel
}
