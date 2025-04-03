import { useQuery } from "@tanstack/react-query"
import { desc, eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import {
  conversationSchema,
  conversationsTable,
  messagesTable
} from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"
import { conversationsQueryKey } from "@/lib/conversations/query-keys"
import { createLogger } from "@/lib/logger"

const logger = createLogger("use-conversations")

/**
 * Get a list of conversations in reverse chronological order (newest first)
 * that have at least one message.
 */
export function useConversations() {
  const { userId } = useAuthentication()

  return useQuery({
    enabled: Boolean(userId),
    queryKey: conversationsQueryKey(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User not authenticated")
      }

      logger.debug("Loading conversations ...")
      const conversations = await db
        .select({ conversation: conversationsTable })
        .from(conversationsTable)
        .innerJoin(
          messagesTable,
          eq(conversationsTable.id, messagesTable.conversationId)
        )
        .where(eq(conversationsTable.userId, userId))
        .groupBy(conversationsTable.id)
        .orderBy(desc(conversationsTable.updatedAt))

      return conversations.map((c) => conversationSchema.parse(c.conversation))
    }
  })
}
