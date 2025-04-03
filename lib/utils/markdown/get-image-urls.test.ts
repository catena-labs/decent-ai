import { describe, expect, it } from "vitest"

import { getImageUrls } from "./get-image-urls"

describe("getImageUrls", () => {
  function isSingleImagePresent(markdown: string, expectedImageUrl: string) {
    const [imageUrl] = getImageUrls(markdown)

    if (!imageUrl) {
      throw new Error("Image URL not found")
    }

    return imageUrl === expectedImageUrl
  }

  it("returns empty list when no image is present", () => {
    const markdown = "This is a test!!! We should not find any image here"

    const imageUrls = getImageUrls(markdown)

    expect(imageUrls).toEqual([])
  })

  it("returns image when image is present", () => {
    const markdown =
      "Here is a wonderful image for you to enjoy. ![simply sublime!](https://www.myurl.com/image.jpg) I hope you enjoy it"

    expect(
      isSingleImagePresent(markdown, "https://www.myurl.com/image.jpg")
    ).toBe(true)
  })

  it("ignores parantheses in image alt text", () => {
    const markdown =
      'Here is a wonderful image for you to enjoy. ![simply sublime (like really)!](https://www.myurl.com/image.jpg "a sublime image") I hope you enjoy it'

    expect(
      isSingleImagePresent(markdown, "https://www.myurl.com/image.jpg")
    ).toBe(true)
  })

  it("returns image when image is present with title", () => {
    const markdown =
      'Here is a wonderful image for you to enjoy. ![simply sublime!](https://www.myurl.com/image.jpg "a sublime image") I hope you enjoy it'

    expect(
      isSingleImagePresent(markdown, "https://www.myurl.com/image.jpg")
    ).toBe(true)
  })

  it("handles linked image", () => {
    const markdown =
      "Here is a wonderful image for you to enjoy. [![simply sublime!](https://www.myurl.com/image.jpg)](https://www.google.com) I hope you enjoy it"

    expect(
      isSingleImagePresent(markdown, "https://www.myurl.com/image.jpg")
    ).toBe(true)
  })

  it("handles multiple images in the markdown", () => {
    const markdown = `Here is a wonderful image for you to enjoy. ![simply sublime!](https://www.myurl.com/image.jpg) I hope you enjoy it.
    Here is another image for you to enjoy. ![simply sublime!](https://www.myurl.com/image2.jpg) I hope you enjoy it
    Wait a second??? what is this???? ANOTHER image!!! Let's freaking gooooo ![simply sublime!](https://www.myurl.com/image3.jpg)`

    const expectedImageUrls = [
      "https://www.myurl.com/image.jpg",
      "https://www.myurl.com/image2.jpg",
      "https://www.myurl.com/image3.jpg"
    ]

    const imageUrls = getImageUrls(markdown)

    for (const [index, imageUrl] of imageUrls.entries()) {
      expect(imageUrl).toBe(expectedImageUrls[index])
    }
  })
})
