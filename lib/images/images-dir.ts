import { joinPath } from "../fs/join-path"

export function imagesDir(userId?: string) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  return joinPath(userId, "images")
}
