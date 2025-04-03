import { type Conversation, conversationSchema } from "@/drizzle/schema"

/**
 * Checks if a given item is a conversation
 */
export function isConversation(item: unknown): item is Conversation {
  return conversationSchema.safeParse(item).success
}
