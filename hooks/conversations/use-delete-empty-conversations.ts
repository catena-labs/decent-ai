import { useMutation, useQueryClient } from "@tanstack/react-query"
import { and, eq, inArray, isNull } from "drizzle-orm"

import { db } from "@/drizzle/client"
import { conversationsTable, messagesTable } from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"

export function useDeleteEmptyConversations() {
  const queryClient = useQueryClient()
  const { userId } = useAuthentication()

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Not authenticated")
      }

      // Delete conversations with no messages from a user
      const subquery = db
        .select({ id: conversationsTable.id })
        .from(conversationsTable)
        .leftJoin(
          messagesTable,
          and(
            eq(messagesTable.conversationId, conversationsTable.id),
            eq(messagesTable.role, "user")
          )
        )
        .where(isNull(messagesTable.id))

      await db
        .delete(conversationsTable)
        .where(
          and(
            eq(conversationsTable.userId, userId),
            inArray(conversationsTable.id, subquery)
          )
        )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["conversations", userId]
      })
    }
  })
}
