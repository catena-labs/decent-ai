import { createId } from "@paralleldrive/cuid2"

import { conversationPath } from "@/lib/conversations/conversation-path"
import { downloadFile } from "@/lib/fs/download-file"
import { ensureDir } from "@/lib/fs/ensure-dir"
import { joinPath } from "@/lib/fs/join-path"
import { getImageUrls } from "@/lib/utils/markdown/get-image-urls"

export async function downloadAndReplaceImages(
  markdown: string,
  userId: string,
  conversationId: string,
  imageUrlMatcher: (url: string) => boolean = () => true
) {
  let finalMarkdown = markdown

  const imageUrls = getImageUrls(markdown).filter(imageUrlMatcher)

  if (imageUrls.length === 0) {
    return finalMarkdown
  }

  // Create conversation directory if it doesn't exist
  const convDirPath = conversationPath(userId, conversationId)
  await ensureDir(convDirPath)

  for (const imageUrl of imageUrls) {
    const imageFilePath = joinPath(convDirPath, `${createId()}.jpg`)
    const localPath = await downloadFile(imageUrl, imageFilePath)
    finalMarkdown = finalMarkdown.replace(imageUrl, localPath)
  }

  return finalMarkdown
}
