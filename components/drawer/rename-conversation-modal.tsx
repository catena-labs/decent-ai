import { usePostHog } from "posthog-react-native"
import { useState } from "react"
import { Button, Modal } from "react-native"

import { type Conversation } from "@/drizzle/schema"
import { useUpdateConversation } from "@/hooks/conversations/use-update-conversation"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"

import { Text } from "../elements/text"
import { TextInput } from "../elements/text-input"
import { View } from "../elements/view"

type Props = {
  conversation: Conversation
  open?: boolean
  setOpen?: (open: boolean) => void
}

/**
 * A modal for renaming a conversation, only used on Android.
 */
export function RenameConversationModal({
  conversation,
  open,
  setOpen
}: Props) {
  const posthog = usePostHog()
  const [newConversationName, setNewConversationName] = useState(
    conversation.name ?? ""
  )
  const { mutate: updateConversation } = useUpdateConversation(conversation.id)

  const isSaveEnabled =
    newConversationName.trim() !== "" &&
    newConversationName !== conversation.name

  return (
    <Modal
      animationType="fade"
      transparent
      visible={open}
      onRequestClose={() => {
        setOpen?.(false)
      }}
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="w-4/5 rounded-lg bg-white/90 p-5">
          <Text className="mb-4 text-center text-lg text-black">
            Rename conversation
          </Text>
          <TextInput
            placeholder="New name"
            value={newConversationName}
            onChangeText={setNewConversationName}
            className="mb-4 rounded-lg bg-white p-2 text-black"
          />
          <View className="h-10 flex-row justify-evenly">
            <Button
              title="Cancel"
              onPress={() => {
                setOpen?.(false)
              }}
            />
            <Button
              title="Save"
              onPress={() => {
                posthog.capture(ANALYTICS_EVENTS.CONVERSATION_RENAMED)
                updateConversation({ name: newConversationName })
                setOpen?.(false)
              }}
              disabled={!isSaveEnabled}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}
