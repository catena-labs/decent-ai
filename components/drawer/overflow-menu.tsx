import { useActionSheet } from "@expo/react-native-action-sheet"
import { MenuView } from "@react-native-menu/menu"
import { useRouter } from "expo-router"
import { MoreHorizontal } from "lucide-react-native"
import { usePostHog } from "posthog-react-native"
import { useCallback } from "react"

import { useConversations } from "@/hooks/conversations/use-conversations"
import { useCreateConversation } from "@/hooks/conversations/use-create-conversation"
import { useDeleteAllConversations } from "@/hooks/conversations/use-delete-all-conversations"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"

import { Pressable } from "../elements/pressable"
import { View } from "../elements/view"

export function OverflowMenu() {
  const posthog = usePostHog()
  const router = useRouter()
  const { showActionSheetWithOptions } = useActionSheet()
  const { mutate: deleteAllConversations } = useDeleteAllConversations()
  const { mutate: createConversation } = useCreateConversation()

  const { data: allConversations, isLoading: isLoadingConversations } =
    useConversations()

  const menuActions = [
    {
      id: "settings",
      title: "Settings"
    },
    {
      id: "delete-conversation-history",
      title: "Delete conversation history",
      attributes: {
        destructive: true
      }
    }
  ]

  if (
    !isLoadingConversations &&
    (!allConversations || allConversations.length === 0)
  ) {
    const indexToDelete = menuActions.findIndex(
      (action) => action.id === "delete-conversation-history"
    )

    if (indexToDelete !== -1) {
      menuActions.splice(indexToDelete, 1)
    }
  }

  const showDeleteActionSheet = useCallback(() => {
    showActionSheetWithOptions(
      {
        title: "Are you sure you want to delete all of your conversations?",
        options: ["Cancel", "Delete"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1
      },
      (index) => {
        if (index === 1) {
          deleteAllConversations(undefined, {
            onSuccess: () => {
              // need to navigate the user to a new conversation
              createConversation(undefined, {
                onSuccess: ({ id }) => {
                  router.push(`/(main)/chat/${id}`)
                }
              })
            }
          })
        }
      }
    )
  }, [
    showActionSheetWithOptions,
    createConversation,
    deleteAllConversations,
    router
  ])

  return (
    <View className="flex-row items-center bg-background">
      <MenuView
        actions={menuActions}
        onPressAction={({ nativeEvent }) => {
          if (nativeEvent.event === "settings") {
            posthog.capture(ANALYTICS_EVENTS.SETTINGS_OPENED)
            router.push("/settings")
          } else if (nativeEvent.event === "delete-conversation-history") {
            posthog.capture(ANALYTICS_EVENTS.CONVERSATION_HISTORY_DELETED)
            showDeleteActionSheet()
          }
        }}
      >
        <Pressable
          analyticsEvent="drawer_overflow_menu_opened"
          className="size-11 items-center justify-center"
        >
          <MoreHorizontal className="text-secondary-foreground" size={24} />
        </Pressable>
      </MenuView>
    </View>
  )
}
