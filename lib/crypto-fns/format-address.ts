import { type Address } from "viem"

export function formatAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
