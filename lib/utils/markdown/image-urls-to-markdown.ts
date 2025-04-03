export function imageUrlsToMarkdown(imageUrls: string[]): string {
  return imageUrls.map((imageUrl) => `![image](${imageUrl})`).join("\n")
}
