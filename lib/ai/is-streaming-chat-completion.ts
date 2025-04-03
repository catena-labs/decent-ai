import type { OpenAI } from "openai"
import type { Stream } from "openai/streaming"

export function isStreamingChatCompletion(
  data: unknown
): data is Stream<OpenAI.Chat.ChatCompletionChunk> {
  return (
    data !== null &&
    typeof data === "object" &&
    (Symbol.asyncIterator in data || "next" in data)
  )
}
