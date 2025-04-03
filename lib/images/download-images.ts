import { createId } from "@paralleldrive/cuid2"

import { imagePath } from "./image-path"
import { imagesDir } from "./images-dir"
import { downloadFile } from "../fs/download-file"
import { ensureDir } from "../fs/ensure-dir"

type DownloadResult = {
  localUri: string
  id: string
}

export async function downloadImages(imageUrls: string[], userId: string) {
  const downloadedUrls: DownloadResult[] = []

  if (imageUrls.length === 0) {
    return downloadedUrls
  }

  // Create images directory if it doesn't exist
  const imagesPath = imagesDir(userId)
  await ensureDir(imagesPath)

  for (const imageUrl of imageUrls) {
    const id = createId()
    const imageFilePath = imagePath(userId, id)
    const localUri = await downloadFile(imageUrl, imageFilePath)
    downloadedUrls.push({ id, localUri })
  }

  return downloadedUrls
}
