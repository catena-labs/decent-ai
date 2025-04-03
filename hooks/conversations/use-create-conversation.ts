import { useMutation, useQueryClient } from "@tanstack/react-query"
import { and, desc, eq, getTableColumns, isNull } from "drizzle-orm"

import { db } from "@/drizzle/client"
import {
  type Conversation,
  type NewConversation,
  conversationSchema,
  conversationsTable,
  messagesTable,
  newConversationSchema
} from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"
import {
  conversationQueryKey,
  conversationsQueryKey
} from "@/lib/conversations/query-keys"

import { useChatState } from "../use-chat-state"

export function useCreateConversation() {
  const queryClient = useQueryClient()
  const { userId } = useAuthentication()

  const lastSelectedModelSlug = useChatState(
    (state) => state.lastSelectedModelSlug
  )

  return useMutation<Conversation, Error, Partial<NewConversation> | undefined>(
    {
      mutationFn: async ({ name, modelSlug, systemPrompt, mode } = {}) => {
        if (!userId) {
          throw new Error("Not authenticated")
        }

        const [latestEmptyConversation] = await db
          .select({ ...getTableColumns(conversationsTable) })
          .from(conversationsTable)
          .leftJoin(
            messagesTable,
            eq(conversationsTable.id, messagesTable.conversationId)
          )
          .where(
            and(
              eq(conversationsTable.userId, userId),
              isNull(messagesTable.id) // Filter for conversations with no messages
            )
          )
          .orderBy(desc(conversationsTable.updatedAt))
          .limit(1)

        // If we already have an empty conversation, return it. This prevents
        // generating a new conversation every time the user lands on home.
        if (latestEmptyConversation) {
          return conversationSchema.parse(latestEmptyConversation)
        }

        const values = newConversationSchema.parse({
          userId,
          name,
          mode,
          // default to the last selected model slug if none explicitly specified.
          modelSlug: modelSlug ?? lastSelectedModelSlug,
          systemPrompt
        })

        const [conversation] = await db
          .insert(conversationsTable)
          .values(values)
          .returning()

        if (!conversation) {
          throw new Error("Failed to create conversation")
        }

        return conversationSchema.parse(conversation)
      },
      onSuccess: async (conversation) => {
        // Manually update known query data
        queryClient.setQueryData(
          conversationsQueryKey(userId),
          (old: Conversation[] = []) => [conversation, ...old]
        )
        queryClient.setQueryData(
          conversationQueryKey(userId, conversation.id),
          conversation
        )
        // Mark the queries as stale
        await queryClient.invalidateQueries({
          queryKey: conversationsQueryKey(userId)
        })
      }
    }
  )
}
