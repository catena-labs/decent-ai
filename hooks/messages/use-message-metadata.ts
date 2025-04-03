import { useMemo } from "react"

import { type Message } from "@/lib/ai/message"
import { isCustomModel } from "@/lib/ai/models"

import { useAvailableModels } from "../use-available-models"

/**
 * Returns the model name for a given message, which may be the name of a router
 * or a specific model.
 */
export function useMessageMetadata(message?: Message) {
  const { findModelOrRouterBySlug } = useAvailableModels()

  /**
   * The model name for the given
   */
  const modelName = useMemo(() => {
    if (message?.model) {
      //const modelInfo = models.find((m) => m.slug === message.model)
      const modelInfo = findModelOrRouterBySlug(message.model)
      if (!modelInfo) {
        return message.model
      }

      if (isCustomModel(modelInfo)) {
        return modelInfo.slug
      }

      return modelInfo.name
    }
  }, [findModelOrRouterBySlug, message?.model])

  return {
    modelName
  }
}
