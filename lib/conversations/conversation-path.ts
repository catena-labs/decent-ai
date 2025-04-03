import { joinPath } from "@/lib/fs/join-path"

/**
 * Returns path to the local directory for all conversations relative to the document
 * directory.
 *
 * @param userId - The user id
 * @returns The path to the conversations directory
 */
export function conversationsPath(userId: string) {
  if (!userId) {
    throw new Error("userId is required")
  }

  return joinPath(userId, "conversations")
}

/**
 * Returns path to the local directory for a conversation relative to the document
 * directory. Used to store assets related to the conversation.
 *
 * @param userId - The user id
 * @param conversationId - The conversation id
 */
export function conversationPath(userId: string, conversationId: string) {
  if (!userId || !conversationId) {
    throw new Error("userId and conversationId are required")
  }

  return joinPath(conversationsPath(userId), conversationId)
}
