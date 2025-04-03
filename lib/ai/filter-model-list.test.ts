import { describe, expect, it } from "vitest"

import { filterModelList, filterModelsForMode } from "./filter-model-list"
import { type Model } from "./models"

const FREE_CHAT: Model = {
  slug: "free-chat",
  name: "free chat",
  availability: "free",
  inputModality: ["text"],
  outputModality: ["text"]
}

const PAID_CHAT: Model = {
  slug: "paid-chat",
  name: "paid chat",
  availability: "subscription",
  inputModality: ["text"],
  outputModality: ["text"]
}

const PAID_VISION: Model = {
  slug: "paid-vision",
  name: "paid vision",
  availability: "subscription",
  inputModality: ["text", "image"],
  outputModality: ["text"]
}

const FREE_IMAGE: Model = {
  slug: "free-image",
  name: "free image",
  availability: "free",
  inputModality: ["text"],
  outputModality: ["image"]
}

const PAID_IMAGE: Model = {
  slug: "paid-image",
  name: "paid image",
  availability: "subscription",
  inputModality: ["text"],
  outputModality: ["image"]
}

const MISSING_OUTPUT_MODALITY: Model = {
  slug: "missing-output-modality",
  name: "missing output modality",
  availability: "free",
  inputModality: ["text"]
}

const MODELS: Model[] = [
  FREE_CHAT,
  PAID_CHAT,
  PAID_VISION,
  FREE_IMAGE,
  PAID_IMAGE,
  MISSING_OUTPUT_MODALITY
]

describe("filterModelList", () => {
  it("filters models by availability", () => {
    const filters = { availability: "free" } as const
    const result = filterModelList(MODELS, filters)
    expect(result).toEqual([FREE_CHAT, FREE_IMAGE, MISSING_OUTPUT_MODALITY])
  })

  it("filters models by input modality", () => {
    const filters = { inputModality: "text" } as const
    const result = filterModelList(MODELS, filters)
    expect(result).toEqual([
      FREE_CHAT,
      PAID_CHAT,
      PAID_VISION,
      FREE_IMAGE,
      PAID_IMAGE,
      MISSING_OUTPUT_MODALITY
    ])
  })

  it("filters models by output modality", () => {
    const filters = { outputModality: "image" } as const
    const result = filterModelList(MODELS, filters)
    expect(result).toEqual([FREE_IMAGE, PAID_IMAGE])
  })

  it("filters models by multiple criteria", () => {
    const filters = {
      availability: "free",
      inputModality: "text",
      outputModality: "image"
    } as const
    const result = filterModelList(MODELS, filters)
    expect(result).toEqual([FREE_IMAGE])
  })

  it("returns all models if no filters are provided", () => {
    const result = filterModelList(MODELS)
    expect(result).toEqual(MODELS)
  })
})

describe("filterModelsForMode", () => {
  it("only returns image output models for image-gen mode", () => {
    const result = filterModelsForMode(MODELS, "image-gen")
    expect(result).toEqual([FREE_IMAGE, PAID_IMAGE])
  })

  it("only returns vision input models for vision mode", () => {
    const result = filterModelsForMode(MODELS, "vision")
    expect(result).toEqual([PAID_VISION])
  })

  it("only returns text output models for chat mode", () => {
    const result = filterModelsForMode(MODELS, "chat")
    expect(result).toEqual([
      FREE_CHAT,
      PAID_CHAT,
      PAID_VISION,
      MISSING_OUTPUT_MODALITY
    ])
  })

  it("returns text output models if the mode is not known", () => {
    const result = filterModelsForMode(MODELS, null)
    expect(result).toEqual([
      FREE_CHAT,
      PAID_CHAT,
      PAID_VISION,
      MISSING_OUTPUT_MODALITY
    ])
  })

  it("returns text output models no mode is provided", () => {
    const result = filterModelsForMode(MODELS)
    expect(result).toEqual([
      FREE_CHAT,
      PAID_CHAT,
      PAID_VISION,
      MISSING_OUTPUT_MODALITY
    ])
  })
})
