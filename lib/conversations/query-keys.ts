import { compact } from "../utils/array-fns/compact"

export function conversationsQueryKey(userId?: string | null) {
  return ["conversations", userId]
}

export function conversationQueryKey(
  userId?: string | null,
  conversationId?: string | null
) {
  return ["conversations", userId, conversationId]
}

export function messagesQueryKey(
  userId?: string | null,
  conversationId?: string | null,
  limit?: number
) {
  return compact(["conversations", userId, conversationId, "messages", limit])
}
