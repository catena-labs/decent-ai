/**
 * Extracts image URLs from a markdown string.
 *
 * @param markdown - The markdown string to extract image URLs from.
 * @returns An array of image URLs.
 */
export function getImageUrls(markdown: string): string[] {
  let index = 0

  const imageUrls: string[] = []

  while (index < markdown.length) {
    if (markdown.substring(index, index + 2) === "![") {
      const imageStart = skipToImageStart(index, markdown)

      if (!imageStart) {
        break
      }

      const imageEnd = skipToImageEnd(imageStart, markdown)

      if (!imageEnd) {
        break
      }

      imageUrls.push(markdown.substring(imageStart, imageEnd))

      index = imageEnd
    }

    index++
  }

  return imageUrls
}

function skipToImageStart(
  startIndex: number,
  markdown: string
): number | undefined {
  let index = startIndex

  while (index < markdown.length) {
    if (markdown.substring(index, index + 2) === "](") {
      return index + 2
    }

    index++
  }
}

function skipToImageEnd(
  startIndex: number,
  markdown: string
): number | undefined {
  let index = startIndex

  while (index < markdown.length) {
    if (markdown[index] === ")" || markdown[index] === " ") {
      return index
    }

    index++
  }
}
