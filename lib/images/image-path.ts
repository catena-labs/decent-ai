import { joinPath } from "@/lib/fs/join-path"

/**
 * Returns path to the local directory for an image relative to
 * the document directory.
 *
 * @param userId - The user id
 * @param imageId - The image id
 * @param fileExtension - The file extension
 */
export function imagePath(
  userId: string,
  imageId: string,
  fileExtension = "jpg"
) {
  if (!userId || !imageId) {
    throw new Error("userId and imageId are required")
  }

  return joinPath(userId, "images", `${imageId}.${fileExtension}`)
}
