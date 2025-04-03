import { useMutation } from "@tanstack/react-query"
import { and, desc, eq, lte } from "drizzle-orm"
import Toast from "react-native-toast-message"

import { db } from "@/drizzle/client"
import { messagesTable } from "@/drizzle/schema"

import { useApiClient } from "./api-client/use-api-client"

type FeedbackParams = {
  feedbackScore: number
}

export function useSubmitFeedback(conversationId: string, messageId: string) {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async ({ feedbackScore }: FeedbackParams) => {
      const [message] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.id, messageId))
        .limit(1)

      if (!message) {
        throw new Error("Message not found")
      }

      const contextMessages = await db
        .select()
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, conversationId),
            lte(messagesTable.createdAt, message.createdAt)
          )
        )
        .orderBy(desc(messagesTable.createdAt))
        .limit(4)

      const response = await apiClient.fetch("/api/decent/chat/feedback", {
        method: "POST",
        body: JSON.stringify({
          messageId: message.id,
          feedbackScore,
          // Send messages with latest message last
          messages: contextMessages.toReversed(),
          model: message.model,
          provider: message.provider
        })
      })

      return response
    },
    onSuccess() {
      Toast.show({ type: "info", text1: "Feedback submitted!" })
    },
    onError() {
      Toast.show({ type: "error", text1: "Error submitting feedback" })
    }
  })
}
