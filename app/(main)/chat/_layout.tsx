import { useActionSheet } from "@expo/react-native-action-sheet"
import { type MenuAction, MenuView } from "@react-native-menu/menu"
import { useGlobalSearchParams, useRouter } from "expo-router"
import { Drawer } from "expo-router/drawer"
import { MoreHorizontalIcon } from "lucide-react-native"
import { usePostHog } from "posthog-react-native"
import { useCallback, useMemo, useState } from "react"
import { Platform } from "react-native"

import { DrawerContent } from "@/components/drawer/drawer-content"
import { DrawerToggleButton } from "@/components/drawer/drawer-toggle-button"
import { Pressable } from "@/components/elements/pressable"
import { View } from "@/components/elements/view"
import { HeaderModelSelect } from "@/components/layout/header-model-select"
import { SystemPromptModal } from "@/components/system-prompt/system-prompt-modal"
import { useConversation } from "@/hooks/conversations/use-conversation"
import { useConversationTools } from "@/hooks/conversations/use-conversation-tools"
import { useCreateConversation } from "@/hooks/conversations/use-create-conversation"
import { useDeleteConversation } from "@/hooks/conversations/use-delete-conversation"
import { useUpdateConversation } from "@/hooks/conversations/use-update-conversation"
import { useMessages } from "@/hooks/messages/use-messages"
import { useOnboardingTooltip } from "@/hooks/tooltips/use-onboarding-tooltip"
import { useChatState } from "@/hooks/use-chat-state"
import { useColors } from "@/hooks/use-colors"
import { useModel } from "@/hooks/use-model"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { type ConversationMode } from "@/lib/conversations/conversation-modes"

type SearchParams = {
  conversationId?: string
  mode?: ConversationMode
}

export default function Layout() {
  const colors = useColors()

  return (
    <Drawer
      backBehavior="initialRoute"
      drawerContent={() => <DrawerContent />}
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
          shadowColor: "transparent"
        },
        swipeEdgeWidth: 200,
        headerLeft: () => <DrawerToggleButton />,
        headerRight: () => <HeaderRightButton />,
        headerTitleAlign: "center",
        headerTitle: () => <HeaderTitleButton />
      }}
    />
  )
}

function checkMarkMenuAction(
  action: MenuAction & { enabled: boolean }
): MenuAction {
  return {
    ...action,
    image: action.enabled
      ? Platform.select({
          ios: "checkmark"
        })
      : undefined,
    title:
      Platform.select({
        android: `${action.enabled ? "✔ " : ""}${action.title}`
      }) ?? action.title
  }
}

function HeaderRightButton() {
  useOnboardingTooltip("add-custom-instructions")
  const posthog = usePostHog()
  const router = useRouter()
  const { showActionSheetWithOptions } = useActionSheet()
  const { conversationId } = useGlobalSearchParams<SearchParams>()

  const { data: conversation } = useConversation(conversationId)
  const { data: messages } = useMessages(conversationId, { limit: 1 })
  const { model: currentModel } = useModel(conversation)

  const { mutate: createConversation } = useCreateConversation()
  const { mutate: deleteConversation } = useDeleteConversation(conversation?.id)
  const { mutate: updateConversation } = useUpdateConversation(conversation?.id)
  const { isToolEnabled, toggleTool } = useConversationTools(conversation)
  const [systemPromptModalOpen, setSystemPromptModalOpen] = useState(false)

  const deleteConversationAndRedirect = useCallback(() => {
    if (conversation) {
      deleteConversation(undefined, {
        onSuccess: () => {
          createConversation(undefined, {
            onSuccess: ({ id }) => {
              router.push(`/(main)/chat/${id}`)
            }
          })
        }
      })
    }
  }, [conversation, createConversation, deleteConversation, router])

  const menuActions = useMemo<MenuAction[]>(() => {
    const actions: MenuAction[] = []

    // If the model supports tools, add toggles for enabling/disabling them
    if (currentModel.supportsTools) {
      actions.push(
        checkMarkMenuAction({
          id: "toggle-image-gen-tool",
          title: "Creates Images",
          enabled: isToolEnabled("image_gen")
        }),
        checkMarkMenuAction({
          id: "toggle-search-web-tool",
          title: "Searches Web",
          enabled: isToolEnabled("search_web")
        })
      )
    }

    actions.push({
      id: "system-prompt",
      image: undefined,
      title: "Custom instructions"
    })

    if (messages?.length) {
      actions.push({
        id: "delete-conversation",
        title: "Delete conversation",
        attributes: {
          destructive: true
        }
      })
    }

    return actions
  }, [currentModel.supportsTools, isToolEnabled, messages?.length])

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
          deleteConversationAndRedirect()
        }
      }
    )
  }, [showActionSheetWithOptions, deleteConversationAndRedirect])

  if (!conversation) {
    return null
  }

  return (
    <>
      <View className="flex-row items-center bg-background">
        <MenuView
          actions={menuActions}
          onPressAction={({ nativeEvent }) => {
            if (nativeEvent.event === "toggle-image-gen-tool") {
              toggleTool("image_gen")
            } else if (nativeEvent.event === "toggle-search-web-tool") {
              toggleTool("search_web")
            } else if (nativeEvent.event === "system-prompt") {
              setSystemPromptModalOpen(true)
            } else if (nativeEvent.event === "delete-conversation") {
              posthog.capture(ANALYTICS_EVENTS.CHAT_CONVERSATION_DELETED)
              showDeleteActionSheet()
            }
          }}
        >
          <Pressable
            analyticsEvent={ANALYTICS_EVENTS.CHAT_OVERFLOW_MENU_OPENED}
            className="mr-3 size-11 items-center justify-center"
          >
            <MoreHorizontalIcon className="text-foreground" size={24} />
          </Pressable>
        </MenuView>
      </View>
      <SystemPromptModal
        currentSystemPrompt={conversation.systemPrompt}
        open={systemPromptModalOpen}
        setOpen={setSystemPromptModalOpen}
        setSystemPrompt={(prompt) => {
          updateConversation({ systemPrompt: prompt })
        }}
      />
    </>
  )
}

function HeaderTitleButton() {
  useOnboardingTooltip("explore-models")
  // Per-conversation Settings
  const { conversationId, mode } = useGlobalSearchParams<SearchParams>()
  const { data: conversation } = useConversation(conversationId)
  const { mutate: updateConversation } = useUpdateConversation(conversation?.id)
  const { model: selectedModel } = useModel(conversation)

  const setLastSelectedModelSlug = useChatState(
    (state) => state.setLastSelectedModelSlug
  )

  // If we're not on a conversation screen, hide the button
  if (!conversation) {
    return null
  }

  return (
    <HeaderModelSelect
      mode={mode}
      selectedModel={selectedModel}
      onOpenEvent={ANALYTICS_EVENTS.CHAT_MODEL_SELECTOR_OPENED}
      onModelSelect={(modelSlug) => {
        setLastSelectedModelSlug(modelSlug)
        updateConversation({ modelSlug })
      }}
    />
  )
}
