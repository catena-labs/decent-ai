import { useMutation, useQueryClient } from "@tanstack/react-query"

import { db } from "@/drizzle/client"
import {
  type ConversationMessage,
  conversationsTable,
  messagesTable,
  newConversationMessageSchema
} from "@/drizzle/schema"
import { useAuthentication } from "@/hooks/use-authentication"
import { type Message } from "@/lib/ai/message"
import {
  conversationQueryKey,
  conversationsQueryKey,
  messagesQueryKey
} from "@/lib/conversations/query-keys"
import { createLogger } from "@/lib/logger"
import { downloadAndReplaceImages } from "@/lib/messages/download-and-replace-images"

const logger = createLogger("hooks:use-create-message")

type CreateMessageParams = {
  message: Message
  provider?: string
  model?: string
}

export function useCreateMessage(conversationId?: string) {
  const { userId } = useAuthentication()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ message, provider, model }: CreateMessageParams) => {
      if (!conversationId) {
        throw new Error("No conversation ID provided")
      }

      if (!userId) {
        throw new Error("Not authenticated")
      }

      logger.debug("Saving response to database.", {
        provider,
        model
      })

      const markdownContent = message.content

      // Download images and replace any generated images. Right now we are doing a simple
      // check for URLs that include "/gen/" in the path, but this should be replaced with
      // a more robust check for our known URLs.
      const finalContent = await downloadAndReplaceImages(
        markdownContent,
        userId,
        conversationId,
        (url) => url.includes("/gen/")
      )

      /**
       * Create the conversation, or update the last updated time.
       */
      await db
        .insert(conversationsTable)
        .values({
          id: conversationId,
          userId
        })
        .onConflictDoUpdate({
          target: conversationsTable.id,
          set: { updatedAt: new Date() }
        })

      const values = newConversationMessageSchema.parse({
        id: message.id,
        conversationId,
        role: message.role,
        content: finalContent,
        createdAt: message.createdAt,
        data: message.imageUrls?.[0]
          ? { imageUrl: message.imageUrls[0] }
          : undefined,
        provider,
        model
      })

      /**
       * Insert the message
       */
      const [newMessage] = await db
        .insert(messagesTable)
        .values(values)
        .returning()

      return newMessage
    },
    onSuccess: async (message) => {
      if (!conversationId || !message) {
        return
      }

      // update the message history
      queryClient.setQueryData(
        messagesQueryKey(userId, conversationId),
        (old?: ConversationMessage[]) => [message, ...(old ?? [])]
      )
      // mark the queries as stale
      await queryClient.invalidateQueries({
        queryKey: conversationsQueryKey(userId)
      })

      await queryClient.invalidateQueries({
        queryKey: conversationQueryKey(userId, conversationId)
      })
    }
  })
}
