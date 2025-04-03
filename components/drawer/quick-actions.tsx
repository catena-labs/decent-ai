import { useRouter } from "expo-router"
import { Headphones, MessageCircle } from "lucide-react-native"
import { useMemo } from "react"

import { useCreateConversation } from "@/hooks/conversations/use-create-conversation"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"

import { QuickAction } from "./quick-action"
import { View } from "../elements/view"
import { GenerateImageIcon } from "../icons/generate-image-icon"

export function QuickActions() {
  const router = useRouter()
  const { mutate: createConversation } = useCreateConversation()

  const QUICK_ACTIONS = useMemo(
    () => [
      {
        id: "conversation",
        title: "Conversation",
        icon: <MessageCircle className="text-primary" size={16} />,
        onPress: () => {
          createConversation(undefined, {
            onSuccess: ({ id }) => {
              router.push(`/(main)/chat/${id}`)
            }
          })
        }
      },
      {
        id: "voice-chat",
        title: "Voice chat",
        icon: <Headphones className="text-primary" size={16} />,
        onPress: () => {
          createConversation(undefined, {
            onSuccess: ({ id }) => {
              router.push({
                pathname: "/(main)/chat/[conversationId]",
                params: {
                  conversationId: id,
                  mode: "audio"
                }
              })
            }
          })
        }
      },
      {
        id: "image-gen",
        title: "Image",
        icon: (
          <GenerateImageIcon className="text-primary" width="16" height="16" />
        ),
        onPress: () => {
          router.push("/image/generate")
        }
      }
    ],
    [createConversation, router]
  )

  return (
    <View className="mb-5">
      {QUICK_ACTIONS.map((action) => (
        <QuickAction
          analyticsEvent={ANALYTICS_EVENTS.DRAWER_QUICK_ACTION_PRESSED}
          analyticsEventProps={{ quick_action: action.id }}
          key={action.id}
          {...action}
        />
      ))}
    </View>
  )
}
