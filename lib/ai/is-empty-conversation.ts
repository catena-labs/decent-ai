import { type Message } from "./message"

/**
 * Checks if a conversation is empty.
 *
 * A conversation is considered empty if it has no messages or if it has only one message and that message is not from the user.
 *
 * @param messages - The array of messages in the conversation.
 * @returns True if the conversation is empty, false otherwise.
 */
export function isEmptyConversation(messages?: Message[]) {
  if (!messages || messages.length === 0) {
    return true
  }

  if (messages.length === 1 && messages[0]?.role !== "user") {
    return true
  }

  return false
}
