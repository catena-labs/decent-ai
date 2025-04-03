import { useActionSheet } from "@expo/react-native-action-sheet"
import { useRouter } from "expo-router"
import { usePostHog } from "posthog-react-native"
import { useCallback, useEffect, useRef, useState } from "react"
import { Alert } from "react-native"

import { Text } from "@/components/elements/text"
import { type Conversation } from "@/drizzle/schema"
import { useCreateConversationTitle } from "@/hooks/conversations/use-create-conversation-title"
import { useDeleteConversation } from "@/hooks/conversations/use-delete-conversation"
import { useUpdateConversation } from "@/hooks/conversations/use-update-conversation"
import { useMessages } from "@/hooks/messages/use-messages"
import { convertDatabaseMessageToMessage } from "@/lib/ai/message"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { createLogger } from "@/lib/logger"
import { cn } from "@/lib/utils/cn"
import { isAndroid } from "@/lib/utils/platform"

import { RenameConversationModal } from "./rename-conversation-modal"
import { ActivityIndicator } from "../elements/activity-indicator"
import { ContextMenu, type ContextMenuItem } from "../elements/context-menu"
import { Pressable } from "../elements/pressable"
import { View } from "../elements/view"

const logger = createLogger("components:home:conversation-row")

type Props = {
  className?: string
  conversation: Conversation
}

export function ConversationRow({ conversation, className }: Props) {
  const router = useRouter()
  const posthog = usePostHog()
  const { showActionSheetWithOptions } = useActionSheet()

  // load message history for this conversation, but only if the name is missing, so
  // we can generate a new name
  const requiresMessageHistory = !conversation.name?.length
  const { data: messages } = useMessages(
    requiresMessageHistory ? conversation.id : undefined,
    { limit: 2 }
  )

  const { mutate: updateConversation } = useUpdateConversation(conversation.id)
  const { mutate: deleteConversation } = useDeleteConversation(conversation.id)
  const { mutate: createConversationTitle, isPending: isGeneratingTitle } =
    useCreateConversationTitle()

  const [renameModalVisible, setRenameModalVisible] = useState(false)

  const showDeleteActionSheet = useCallback(() => {
    showActionSheetWithOptions(
      {
        title: "Are you sure you want to delete this conversation?",
        options: ["Cancel", "Delete"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1
      },
      (index) => {
        if (index === 1) {
          deleteConversation()
        }
      }
    )
  }, [deleteConversation, showActionSheetWithOptions])

  const handleDeleteConversation = () => {
    posthog.capture(ANALYTICS_EVENTS.DRAWER_CONVERSATION_DELETED)
    showDeleteActionSheet()
  }

  const options: ContextMenuItem[] = [
    {
      id: "rename",
      label: "Rename",
      onPress: () => {
        if (isAndroid) {
          setRenameModalVisible(true)
          return
        }

        Alert.prompt(
          "Rename conversation",
          undefined,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Save",
              onPress: (newName) => {
                if (newName) {
                  updateConversation({ name: newName })
                }
              }
            }
          ],
          "plain-text",
          conversation.name ?? ""
        )
      },
      icon: "edit"
    },
    {
      id: "delete",
      label: "Delete",
      onPress: handleDeleteConversation,
      icon: "delete"
    }
  ]

  const titleGenerationInitiated = useRef(false)

  useEffect(() => {
    if (
      !conversation.name &&
      messages &&
      messages.length > 1 &&
      !titleGenerationInitiated.current
    ) {
      titleGenerationInitiated.current = true
      logger.debug("Generating missing conversation title ...")
      // This will exclude system messages by default, since system messages are stored
      // separately on the `conversation` itself.
      const vercelMessages = messages
        // Messages hook returns messages in reverse chronological order, need to reverse
        // to get oldest message first.
        .toReversed()
        .map((m) => convertDatabaseMessageToMessage(m))

      createConversationTitle(vercelMessages, {
        onSuccess: (title) => {
          updateConversation({ name: title })
        },
        // On error, fallback to using the first user message as the title
        onError: () => {
          logger.debug(
            "Failed to generate title, falling back to first user message"
          )
          // Messages are in reverse chronological order, so first user message is last
          const userMessage = messages[messages.length - 1]?.content
          updateConversation({ name: userMessage })
          titleGenerationInitiated.current = false
        }
      })
    }
  }, [conversation.name, messages, createConversationTitle, updateConversation])

  // do not render a conversation row if it has no messages
  if (messages && messages.length === 0) {
    return null
  }

  return (
    <View className="my-2">
      <RenameConversationModal
        conversation={conversation}
        open={renameModalVisible}
        setOpen={setRenameModalVisible}
      />
      <ContextMenu items={options}>
        <Pressable
          analyticsEvent="conversation_opened"
          className={cn(className, "rounded-md py-2")}
          onPress={() => {
            router.push({
              pathname: "/(main)/chat/[conversationId]",
              params: {
                conversationId: conversation.id,
                mode: conversation.mode
              }
            })
          }}
          onLongPress={() => null}
          delayLongPress={150}
        >
          {conversation.name ? (
            <Text
              variant="medium"
              className="line-clamp-1 flex-1 shrink text-sm text-foreground"
            >
              {conversation.name}
            </Text>
          ) : isGeneratingTitle ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text
              variant="medium"
              className="line-clamp-1 grow text-sm text-foreground"
            >
              {messages?.[messages.length - 1]?.content}
            </Text>
          )}
        </Pressable>
      </ContextMenu>
    </View>
  )
}
