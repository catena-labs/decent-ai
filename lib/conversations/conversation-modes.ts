export type ConversationMode = "chat" | "audio" | "vision" | "image-gen"

export function isChatMode(mode?: unknown): mode is "chat" {
  return mode === "chat"
}

export function isImageGenMode(mode?: unknown): mode is "image-gen" {
  return mode === "image-gen"
}

export function isVisionMode(mode?: unknown): mode is "vision" {
  return mode === "vision"
}
