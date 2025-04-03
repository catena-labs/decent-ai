import { useFocusEffect, useRouter } from "expo-router"
import { useCallback } from "react"

import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { View } from "@/components/elements/view"
import { useCreateConversation } from "@/hooks/conversations/use-create-conversation"
import { createLogger } from "@/lib/logger"

const logger = createLogger("screens:chat-index")

export default function ChatIndexScreen() {
  const router = useRouter()
  const { mutate: createConversation } = useCreateConversation()

  const createNewChat = useCallback(() => {
    createConversation(undefined, {
      onSuccess: ({ id }) => {
        logger.debug(`  -> Redirecting to conversation: ${id}`)
        router.push({
          pathname: "/(main)/chat/[conversationId]",
          params: { conversationId: id }
        })
      }
    })
  }, [createConversation, router])

  useFocusEffect(
    useCallback(() => {
      logger.debug("MOUNTED, creating new conversation...")
      createNewChat()
      // eslint-disable-next-line react-hooks/exhaustive-deps -- want to run every time we focus
    }, [])
  )

  return (
    <View className="size-full flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  )
}
