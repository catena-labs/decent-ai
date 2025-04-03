import { useMutation } from "@tanstack/react-query"
import { z } from "zod"

import { type Message } from "@/lib/ai/message"

import { useApiClient } from "../api-client/use-api-client"

const responseSchema = z.object({
  title: z.string()
})

/**
 * Generate a succinct conversation title based on the conversation messages.
 */
export function useCreateConversationTitle() {
  const apiClient = useApiClient()

  return useMutation({
    mutationFn: async (messages: Message[]) => {
      const response = await apiClient.fetch(
        "/api/mobile/conversations/title",
        {
          method: "POST",
          body: JSON.stringify({ messages })
        }
      )

      const { title } = responseSchema.parse(await response.json())

      return title
    }
  })
}
