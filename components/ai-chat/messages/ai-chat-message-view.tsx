import { ContextMenu } from "@/components/elements/context-menu"
import { useCreateChatMessageContextMenuOptions } from "@/hooks/use-create-chat-message-context-menu-options"
import { type Message } from "@/lib/ai/message"

import { AiChatMessage } from "./ai-chat-message"

type Props = {
  conversationId: string
  message: Message
  previousMessage?: Message
  onMessageSend: (content: string) => void
  isLongWait?: boolean
}
/**
 * Render a Chat Message, including the Context Menu if necessary
 */
export function AIChatMessageView({
  conversationId,
  message,
  previousMessage,
  onMessageSend,
  isLongWait
}: Props) {
  const createMessageMenuOptions = useCreateChatMessageContextMenuOptions(
    conversationId,
    message.id
  )

  const options = createMessageMenuOptions({
    onMessageSend,
    message,
    previousMessage
  })

  if (message.role === "user") {
    return (
      <ContextMenu items={options}>
        <AiChatMessage
          key={`${message.id}-${message.role}`}
          message={message}
        />
      </ContextMenu>
    )
  }

  if (!message.content.length || !previousMessage) {
    return (
      <AiChatMessage
        isLongWait={isLongWait}
        key={`${message.id}-${message.role}`}
        message={message}
      />
    )
  }

  return (
    <ContextMenu items={options}>
      <AiChatMessage key={`${message.id}-${message.role}`} message={message} />
    </ContextMenu>
  )
}
