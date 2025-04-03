import { useCallback } from "react"

import { useCustomModelStore } from "./use-custom-model-store"

export function useCustomModelSlug() {
  const allCustomModels = useCustomModelStore((state) => state.models)

  const getCustomModelSlug = useCallback(
    (id: string) => {
      return allCustomModels.find((model) => model.id === id)?.modelSlug ?? id
    },
    [allCustomModels]
  )

  return { getCustomModelSlug }
}
