import { getAddress, isAddress } from "viem"

/**
 * Checks if two addresses are the same.
 *
 * @param lhs - The first Account
 * @param rhs - The second Account
 * @returns A boolean indicating whether the two Accounts have the same address
 */
export function isSameAddress(
  lhs?: string | null,
  rhs?: string | null
): boolean {
  if (!lhs || !rhs) {
    return false
  }

  if (!isAddress(lhs) || !isAddress(rhs)) {
    return false
  }

  try {
    return getAddress(lhs) === getAddress(rhs)
  } catch (e) {
    return false
  }
}
