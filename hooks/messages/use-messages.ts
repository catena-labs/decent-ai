import { useQuery } from "@tanstack/react-query"
import { and, desc, eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import { conversationMessageSchema, messagesTable } from "@/drizzle/schema"
import { messagesQueryKey } from "@/lib/conversations/query-keys"
import { createLogger } from "@/lib/logger"

import { useAuthentication } from "../use-authentication"

type UseMessagesOptions = {
  limit?: number
}

const logger = createLogger("hooks:use-messages")

export function useMessages(
  conversationId?: string,
  { limit }: UseMessagesOptions = {}
) {
  const { userId } = useAuthentication()

  return useQuery({
    queryKey: messagesQueryKey(userId, conversationId, limit),
    queryFn: async () => {
      if (!conversationId) {
        throw new Error("No conversation ID provided")
      }

      logger.debug("Fetching messages...")

      const query = db
        .select()
        .from(messagesTable)
        .where(and(eq(messagesTable.conversationId, conversationId)))
        .orderBy(desc(messagesTable.createdAt))

      if (limit) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- invalid
        query.limit(limit)
      }

      const messages = await query

      return messages.map((m) => conversationMessageSchema.parse(m))
    },
    enabled: Boolean(userId && conversationId)
  })
}
