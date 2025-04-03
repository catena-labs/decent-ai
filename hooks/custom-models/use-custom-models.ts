import { useMemo } from "react"

import { modelSchema } from "@/lib/ai/models"

import { useCustomModelStore } from "./use-custom-model-store"

export function useCustomModels() {
  const allCustomModels = useCustomModelStore((state) => state.models)
  const customModels = useMemo(
    () =>
      allCustomModels.map((model) =>
        modelSchema.parse({
          // we use the model id as the slug, since we expect slugs
          // to uniquely identify a model in the app, but different
          // custom models could have the same slug
          slug: model.id,
          name: model.name ?? "Your model",
          shortDescription: model.modelSlug,
          inputModality: ["text"],
          outputModality: ["text"],
          availability: "free",
          endpoint: {
            baseURL: model.baseURL,
            apiKey: model.apiKey
          }
        })
      ),
    [allCustomModels]
  )

  return { customModels }
}
