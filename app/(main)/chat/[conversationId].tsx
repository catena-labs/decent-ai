import { useLocalSearchParams, useRouter } from "expo-router"
import { AlertTriangleIcon } from "lucide-react-native"
import { useEffect } from "react"

import { AiChatView } from "@/components/ai-chat/ai-chat-view"
import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { NotificationPermissionsAlert } from "@/components/home/notification-permissions-alert"
import { useConversation } from "@/hooks/conversations/use-conversation"
import { useUserSettings } from "@/hooks/use-user-settings"
import { type ConversationMode } from "@/lib/conversations/conversation-modes"
import { logger } from "@/lib/logger"
import { isAndroid } from "@/lib/utils/platform"

type SearchParams = {
  conversationId: string
  initialMessage?: string
  mode?: ConversationMode
}

export default function ConversationScreen() {
  const { conversationId, initialMessage, mode } =
    useLocalSearchParams<SearchParams>()
  const router = useRouter()
  const { data: conversation, isLoading: isLoadingConversation } =
    useConversation(conversationId)

  /**
   * Show the "What's new" message once to existing users, not new users.
   */
  const hasSeenAppUpdateMessage = useUserSettings(
    (s) => s.hasSeenAppUpdateMessage
  )
  const setHasSeenAppUpdateMessage = useUserSettings(
    (s) => s.setHasSeenAppUpdateMessage
  )
  const appLoadCount = useUserSettings((s) => s.appLoadCount)
  useEffect(() => {
    if (isAndroid) {
      // Temporarily disable the "what's new" message on Android
      setHasSeenAppUpdateMessage(true)
      return
    }

    if (appLoadCount <= 1) {
      // On a fresh install, mark the "what's new" message as seen
      setHasSeenAppUpdateMessage(true)
    } else if (!hasSeenAppUpdateMessage) {
      // If we have opened the app in the past (we're upgrading),
      // and we have not seen the "what's new" message, show it.
      setHasSeenAppUpdateMessage(true)
      router.push("/(main)/whats-new")
    }
  }, [
    appLoadCount,
    hasSeenAppUpdateMessage,
    router,
    setHasSeenAppUpdateMessage
  ])

  if (isLoadingConversation) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  logger.debug("ConversationScreen", { conversationId })

  if (!conversation) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Pressable
          className="flex flex-col items-center"
          onPress={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.replace({
                pathname: "/(main)"
              })
            }
          }}
        >
          <AlertTriangleIcon size={32} color="white" />
          <Text className="text-lg text-foreground">
            Unable to find conversation
          </Text>
          <Text className="text-lg text-foreground">Go back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <>
      <View className="flex-1 bg-background">
        <AiChatView
          initialMessage={initialMessage}
          conversation={conversation}
          mode={mode}
        />
      </View>
      <NotificationPermissionsAlert />
    </>
  )
}
