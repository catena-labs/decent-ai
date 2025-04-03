import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A small extension to `clsx` to make it TailwindCSS class-aware.
 *
 * Aliased as `cn`
 */
export function cn(...classNames: ClassValue[]) {
  return twMerge(clsx(classNames))
}
