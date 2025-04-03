/**
 * Joins provided path parts. Removes leading slashes from all but the
 * first part and trailing slashes from all but the last part.
 *
 * @param parts - The path parts to join.
 * @returns The joined path.
 */
export function joinPath(...parts: string[]) {
  return parts
    .map((part, index) => {
      let result = part

      // Remove trailing slashes from all parts except the last one
      if (index !== parts.length - 1) {
        result = result.replace(/\/+$/, "")
      }

      // Remove leading slashes from all parts except the first one
      if (index !== 0) {
        result = result.replace(/^\/+/, "")
      }

      return result
    })
    .join("/")
}
