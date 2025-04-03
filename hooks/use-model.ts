import { useMemo } from "react"

import {
  type ConversationMode,
  isImageGenMode
} from "@/lib/conversations/conversation-modes"

import { type ModelFilters, useAvailableModels } from "./use-available-models"

type ConversationLike = {
  modelSlug?: string | null
  mode?: ConversationMode | null
}

/**
 * Hook to find the current _available_ model for a given user. If there is a
 * conversation provided, it will try to use the currently-selected model in the
 * conversation. If that model is not available to the user, or if no conversation
 * is provided, it will use the `defaultAvailableModelOrRouter` for the user.
 *
 * If a model does not satisfy the requested filters, then the first suitable one
 * will be selected
 */
export function useModel(conversation?: ConversationLike | null) {
  const {
    filteredModels,
    filteredRouters,
    findModelOrRouterBySlug,
    customModels,
    defaultAvailableModelOrRouter
  } = useAvailableModels()

  const filters = useMemo<ModelFilters>(
    () => ({
      onlyAvailable: true,
      outputModality: isImageGenMode(conversation?.mode) ? "image" : "text"
    }),
    [conversation]
  )

  const model = useMemo(() => {
    // First, try to find the model from the conversation
    const selected = findModelOrRouterBySlug(conversation?.modelSlug, filters)

    if (selected) {
      return selected
    }

    // If the conversation model is not available, find the first model
    // that satisfies the filters
    const models = filteredModels(filters)
    if (models[0]) {
      return models[0]
    }

    const routers = filteredRouters(filters)
    if (routers[0]) {
      return routers[0]
    }

    // If no models satisfy the filters, pick the custom model if any
    if (customModels[0]) {
      return customModels[0]
    }

    return defaultAvailableModelOrRouter
  }, [
    findModelOrRouterBySlug,
    conversation?.modelSlug,
    filters,
    filteredModels,
    filteredRouters,
    customModels,
    defaultAvailableModelOrRouter
  ])

  return { model, slug: model.slug }
}
