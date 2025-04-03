import { createId } from "@paralleldrive/cuid2"
import { type OpenAI } from "openai"
import { z } from "zod"

import { type conversationMessageSchema } from "@/drizzle/schema"

import { getModelAndProviderFromCompositeSlug } from "./get-model-and-provider-from-composite-slug"
import { modelSlugSchema } from "./models"

export const messageSchema = z.object({
  id: z.string().default(() => createId()),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
  createdAt: z.coerce.date().default(() => new Date()),
  model: modelSlugSchema.nullable().optional(),
  provider: z.string().nullable().optional(),
  imageUrls: z.array(z.string().url()).optional()
})

export type Message = z.infer<typeof messageSchema>

export function convertDatabaseMessageToMessage(
  databaseMessage: z.infer<typeof conversationMessageSchema>
): Message {
  const message = messageSchema.parse(databaseMessage)

  if (typeof databaseMessage.data?.imageUrl === "string") {
    message.imageUrls = [databaseMessage.data.imageUrl]
  }

  return message
}

/**
 * Convert a ChatCompletion (Response) object to a Message object
 */
export function convertOpenAICompletionToMessage(
  completion: OpenAI.Chat.ChatCompletion
): Message {
  const { model, provider } = getModelAndProviderFromCompositeSlug(
    completion.model
  )

  return messageSchema.parse({
    id: completion.id,
    role: completion.choices[0]?.message.role ?? "assistant",
    content: completion.choices[0]?.message.content ?? "",
    model,
    provider
  })
}

/**
 * Convert a ChatCompletionChunk (Response) object to a Message object
 */
export function convertOpenAICompletionChunkToMessage(
  chunk: OpenAI.Chat.ChatCompletionChunk
): Message {
  const { model, provider } = getModelAndProviderFromCompositeSlug(chunk.model)

  return messageSchema.parse({
    id: chunk.id,
    role: chunk.choices[0]?.delta.role ?? "assistant",
    content: chunk.choices[0]?.delta.content ?? "",
    model,
    provider
  })
}

/**
 * Takes our internal `Message` type and converts it to an OpenAI compatible
 * message param for use with the OpenAI SDK.
 */
export function convertMessageToChatCompletionMessageParam(
  message: Message
):
  | OpenAI.Chat.ChatCompletionSystemMessageParam
  | OpenAI.Chat.ChatCompletionUserMessageParam
  | OpenAI.Chat.ChatCompletionAssistantMessageParam {
  if (message.role !== "user") {
    return {
      role: message.role,
      content: message.content
    }
  }

  let content: string | OpenAI.Chat.ChatCompletionContentPart[] =
    message.content

  // If we have any image URLs, we should use the ChatCompletionContentPart
  if (message.imageUrls?.length) {
    content = [
      {
        type: "text" as const,
        text: message.content
      },
      ...message.imageUrls.map((url) => ({
        type: "image_url" as const,
        image_url: {
          url
        }
      }))
    ]
  }

  return {
    role: message.role,
    content
  }
}
