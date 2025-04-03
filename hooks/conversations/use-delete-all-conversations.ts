import { useMutation, useQueryClient } from "@tanstack/react-query"
import { and, eq, inArray } from "drizzle-orm"
import { usePostHog } from "posthog-react-native"

import { db } from "@/drizzle/client"
import { conversationsTable, messagesTable } from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"
import { conversationsPath } from "@/lib/conversations/conversation-path"
import { conversationsQueryKey } from "@/lib/conversations/query-keys"
import { remove } from "@/lib/fs/remove"

export function useDeleteAllConversations() {
  const posthog = usePostHog()
  const queryClient = useQueryClient()
  const { userId } = useAuthentication()

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Not authenticated")
      }

      posthog.capture("delete_all_conversations")

      // Delete all local files associated with stored convesations
      const dirPath = conversationsPath(userId)
      await remove(dirPath)

      await db.transaction(async (trx) => {
        // remove all conversations for this user
        const records = await trx
          .delete(conversationsTable)
          .where(and(eq(conversationsTable.userId, userId)))
          .returning()

        // remove all messages from the conversations that were removed
        await trx.delete(messagesTable).where(
          inArray(
            messagesTable.conversationId,
            records.map((r) => r.id)
          )
        )
      })
    },
    onSuccess: async () => {
      // Optimistically remove all conversations for this user
      queryClient.setQueryData(conversationsQueryKey(userId), [])
      queryClient.removeQueries({
        queryKey: conversationsQueryKey(userId)
      })

      // Mark the queries as stale
      await queryClient.invalidateQueries({
        queryKey: conversationsQueryKey(userId)
      })
    }
  })
}
