import { useMutation, useQueryClient } from "@tanstack/react-query"
import { and, eq } from "drizzle-orm"

import { db } from "@/drizzle/client"
import {
  type Conversation,
  conversationsTable,
  messagesTable
} from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"
import { conversationPath } from "@/lib/conversations/conversation-path"
import {
  conversationQueryKey,
  conversationsQueryKey
} from "@/lib/conversations/query-keys"
import { remove } from "@/lib/fs/remove"

export function useDeleteConversation(conversationId?: string) {
  const queryClient = useQueryClient()
  const { userId } = useAuthentication()

  return useMutation({
    mutationFn: async () => {
      if (!conversationId) {
        throw new Error("No conversation ID provided")
      }

      if (!userId) {
        throw new Error("Not authenticated")
      }

      /**
       * Delete any files associated with the conversation, if they exist.
       */
      const dirPath = conversationPath(userId, conversationId)
      await remove(dirPath)

      await db.transaction(async (trx) => {
        await trx
          .delete(messagesTable)
          .where(eq(messagesTable.conversationId, conversationId))

        await trx
          .delete(conversationsTable)
          .where(
            and(
              eq(conversationsTable.id, conversationId),
              eq(conversationsTable.userId, userId)
            )
          )
      })
    },
    onSuccess: async () => {
      // We know we can remove anything for this conversation
      queryClient.removeQueries({
        queryKey: conversationQueryKey(userId, conversationId)
      })
      // Remove the conversation from the primary conversations list
      queryClient.setQueryData(
        conversationsQueryKey(userId),
        (old?: Conversation[]) => {
          return old?.filter((c) => c.id !== conversationId) ?? []
        }
      )

      //  Mark conversation queries as stale
      await queryClient.invalidateQueries({
        queryKey: conversationsQueryKey(userId)
      })
    }
  })
}
