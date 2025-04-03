import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"
import { z } from "zod"

import {
  type ModelAttributeFilters,
  filterModelList
} from "@/lib/ai/filter-model-list"
import {
  DEFAULT_ROUTER,
  type Model,
  type ModelSlug,
  type Router,
  modelSchema,
  routerSchema
} from "@/lib/ai/models"

import { useApiFetch } from "./api-client/use-api-fetch"
import { useCustomModels } from "./custom-models/use-custom-models"
import { useSubscriptionStatus } from "./use-subscription-status"

export type ModelFilters = ModelAttributeFilters & {
  onlyAvailable?: boolean
}

const modelConfigSchema = z.object({
  models: modelSchema
    .array()
    .refine((data): data is Model[] => true)
    .optional(),
  routers: routerSchema
    .array()
    .refine((data): data is Router[] => true)
    .optional(),
  defaultRouter: routerSchema.refine((data): data is Router => true).optional()
})

export function useAvailableModels() {
  const { isSubscribed } = useSubscriptionStatus()
  const { apiFetch } = useApiFetch()
  const { customModels } = useCustomModels()

  const {
    data: modelConfig,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const response = await apiFetch("/api/mobile/models")
      return modelConfigSchema.parse(await response.json())
    }
  })

  const defaultRouter = useMemo<Router>(
    () => modelConfig?.defaultRouter ?? DEFAULT_ROUTER,
    [modelConfig]
  )
  const models = useMemo(
    () => [...customModels, ...(modelConfig?.models ?? [])],
    [customModels, modelConfig?.models]
  )
  const routers = useMemo(
    () => modelConfig?.routers ?? [defaultRouter],
    [defaultRouter, modelConfig]
  )

  /**
   * List of models available to the current user.
   *
   * NOTE: This list will OMIT all models that are not available to the user.
   * To see the full list of models, use the `models` property.
   */
  const availableModels = useMemo<Model[]>(() => {
    if (!isSubscribed) {
      return models.filter((m) => m.availability === "free")
    }

    return models
  }, [models, isSubscribed])

  /**
   * List of routers available to the current user
   *
   * NOTE: This list will OMIT all routers that are not available to the user.
   * To see the full list of routers, use the `routers` property.
   */
  const availableRouters = useMemo<Router[]>(() => {
    if (!isSubscribed) {
      return routers.filter((r) => r.availability === "free")
    }

    return routers
  }, [isSubscribed, routers])

  /**
   * Build a list of filter parameters based on the user's subscription status,
   * if needed.
   *
   * This will convert the `onlyAvailable` filter to an `availability` filter
   * for models, so these params can be used outside of the `useAvailableModels`
   * hook.
   */
  const filterParams = useCallback(
    ({ onlyAvailable, ...filters }: ModelFilters) => {
      const modelFilters: ModelAttributeFilters = { ...filters }
      if (onlyAvailable && !isSubscribed) {
        modelFilters.availability = "free"
      }

      return modelFilters
    },
    [isSubscribed]
  )

  /**
   * Get a list of models filtered by the given filters
   */
  const filteredModels = useCallback(
    (filters: ModelFilters) => {
      return filterModelList(models, filterParams(filters))
    },
    [filterParams, models]
  )

  /**
   * Get a list of routers filtered by the given filters
   */
  const filteredRouters = useCallback(
    (filters: ModelFilters) => {
      return filterModelList(routers, filterParams(filters))
    },
    [filterParams, routers]
  )

  /**
   * Finds a given model or router by it's slug. This method does not check if
   * the model or router is available to the user.
   */
  const findModelOrRouterBySlug = useCallback(
    (slug?: ModelSlug | null, filters: ModelFilters = {}) => {
      if (!slug) {
        return
      }

      const modelsList = filterModelList(models, filterParams(filters))
      const routersList = filterModelList(routers, filterParams(filters))

      return (
        modelsList.find((m) => m.slug === slug) ??
        routersList.find((r) => r.slug === slug)
      )
    },
    [filterParams, models, routers]
  )

  /**
   * Returns the default model or router for the user
   */
  const defaultAvailableModelOrRouter = useMemo(() => {
    return availableRouters[0] ?? availableModels[0] ?? defaultRouter
  }, [availableModels, availableRouters, defaultRouter])

  return {
    isLoading,
    refetch,
    findModelOrRouterBySlug,
    availableModels,
    filteredModels,
    models,
    customModels,
    availableRouters,
    filteredRouters,
    routers,
    defaultRouter,
    defaultAvailableModelOrRouter
  }
}
