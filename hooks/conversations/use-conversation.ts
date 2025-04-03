import { useQuery } from "@tanstack/react-query"
import { and, eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import {
  type Conversation,
  conversationSchema,
  conversationsTable
} from "@/drizzle/schema"
import { conversationQueryKey } from "@/lib/conversations/query-keys"
import { createLogger } from "@/lib/logger"

import { useAuthentication } from "../use-authentication"

const logger = createLogger("use-conversation")

export function useConversation(conversationId?: string) {
  const { userId } = useAuthentication()

  return useQuery<Conversation | undefined>({
    enabled: Boolean(userId && conversationId),
    queryKey: conversationQueryKey(userId, conversationId),
    queryFn: async () => {
      if (!conversationId) {
        throw new Error("No conversation ID provided")
      }

      if (!userId) {
        throw new Error("User not authenticated")
      }

      logger.debug("Loading conversation ...")
      const [conversation] = await db
        .select()
        .from(conversationsTable)
        .where(
          and(
            eq(conversationsTable.id, conversationId),
            eq(conversationsTable.userId, userId)
          )
        )
        .limit(1)

      return conversationSchema.parse(conversation)
    }
  })
}
