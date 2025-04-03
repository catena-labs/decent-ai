import { describe, expect, it } from "vitest"

import { imagePath } from "./image-path"

describe("imagePath", () => {
  it("throws if userId is not provided", () => {
    expect(() => imagePath("", "imageId")).toThrow(
      "userId and imageId are required"
    )
  })

  it("throws if imageId is not provided", () => {
    expect(() => imagePath("userId", "")).toThrow(
      "userId and imageId are required"
    )
  })

  it("returns the correct file name", () => {
    const result = imagePath("userId", "imageId")
    expect(result).toEqual("userId/images/imageId.jpg")
  })

  it("uses specified file extension", () => {
    const result = imagePath("userId", "imageId", "png")
    expect(result).toEqual("userId/images/imageId.png")
  })
})
