import { describe, expect, it } from "vitest"

import { getModelAndProviderFromCompositeSlug } from "./get-model-and-provider-from-composite-slug"

describe("getModelAndProviderFromCompositeSlug", () => {
  it("returns the full slug as model slug if a router slug is provided", () => {
    const result = getModelAndProviderFromCompositeSlug("router:model")
    expect(result).toEqual({ model: "router:model" })
  })

  it("returns the provider and model if the modelAndProvider is defined", () => {
    const result = getModelAndProviderFromCompositeSlug("provider:model")
    expect(result).toEqual({ model: "model", provider: "provider" })
  })

  it("returns only a model if the provider is not defined", () => {
    const result = getModelAndProviderFromCompositeSlug("model")
    expect(result).toEqual({ model: "model" })
  })
})
