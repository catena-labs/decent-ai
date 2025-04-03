import { useMutation, useQueryClient } from "@tanstack/react-query"
import { and, eq } from "drizzle-orm"
import { type z } from "zod"

import { db } from "@/drizzle/client"
import {
  type Conversation,
  conversationsTable,
  newConversationSchema
} from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"
import { useAssignUserPoints } from "@/hooks/use-user-points"
import {
  conversationQueryKey,
  conversationsQueryKey
} from "@/lib/conversations/query-keys"
import { createLogger } from "@/lib/logger"

const updateAttributesSchema = newConversationSchema.pick({
  name: true,
  bookmarked: true,
  excludeTools: true,
  modelSlug: true,
  systemPrompt: true,
  updatedAt: true
})

const logger = createLogger("use-update-conversation")

/**
 * Only allow updating the name, bookmarked status, model slug and system prompt.
 */
type UpdateAttributes = Partial<z.infer<typeof updateAttributesSchema>>

export function useUpdateConversation(conversationId?: string) {
  const queryClient = useQueryClient()
  const { userId } = useAuthentication()
  const { mutateAsync: assignUserPoints } = useAssignUserPoints(
    "bookmark-conversation"
  )

  return useMutation({
    mutationFn: async (attrs: UpdateAttributes = {}) => {
      if (!conversationId) {
        throw new Error("No conversation ID provided")
      }

      if (!userId) {
        throw new Error("Not authenticated")
      }

      logger.debug(`Updating conversation ${conversationId}`, attrs)

      const values = updateAttributesSchema.parse(attrs)

      const [conversation] = await db
        .update(conversationsTable)
        .set(values)
        .where(
          and(
            eq(conversationsTable.id, conversationId),
            eq(conversationsTable.userId, userId)
          )
        )
        .returning()

      if (values.bookmarked) {
        await assignUserPoints()
      }

      return conversation
    },
    onSuccess: async (conversation) => {
      if (!conversation) {
        return
      }

      // Set the query data for this conversation
      queryClient.setQueryData(
        conversationQueryKey(userId, conversationId),
        conversation
      )
      // Update the conversations list
      // mark the conversation as the latest
      queryClient.setQueryData(
        conversationsQueryKey(userId),
        (old?: Conversation[]) => {
          return (
            old?.map((c) => {
              if (c.id === conversationId) {
                return conversation
              }

              return c
            }) ?? []
          )
        }
      )

      await queryClient.invalidateQueries({
        queryKey: conversationQueryKey(conversationId)
      })
    }
  })
}
