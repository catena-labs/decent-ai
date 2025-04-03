/**
 * A naive method to get the initials from a name. This function takes a name
 * and returns the initials. If the name has more than two words, it takes the
 * first letter of the first two words. If the name is a single word, it takes
 * the first letter of that word.
 *
 * @param name - The name to be converted into initials.
 * @returns The initials derived from the input name.
 */
export function getInitials(name?: string | null) {
  // IF the name corresponds to a wallet address, return an empty string
  if (name?.startsWith("0x")) {
    return ""
  }

  const names = (name ?? "").trim().split(" ")

  return names.reduce((acc, curr, index) => {
    if (index === 0 || index === names.length - 1) {
      return `${acc}${curr.charAt(0).toUpperCase()}`
    }

    return acc
  }, "")
}
