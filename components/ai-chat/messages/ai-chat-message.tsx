import Animated, { FadeIn } from "react-native-reanimated"

import { ShareableImage } from "@/components/elements/shareable-image"
import { Text } from "@/components/elements/text"
import { UserAvatar } from "@/components/elements/user-avatar"
import { View } from "@/components/elements/view"
import { DotsCircleIcon } from "@/components/icons/dots-circle-icon"
import { MarkdownContent } from "@/components/markdown/markdown-content"
import { useMessageMetadata } from "@/hooks/messages/use-message-metadata"
import { useAuthentication } from "@/hooks/use-authentication"
import { type Message } from "@/lib/ai/message"
import { senderName } from "@/lib/ai/sender-name"

import { LoadingIndicator } from "../loading-indicator"

export type AiChatMessageProps = {
  isLongWait?: boolean
  message: Message
}

function AiChatContent({
  message,
  isLongWait
}: Pick<AiChatMessageProps, "message" | "isLongWait">) {
  /**
   * For user-generated messages, display the raw text without markdown
   * formatting.
   *
   * Spacing mimics the default settings from `react-native-marked`:
   * https://github.com/gmsgowtham/react-native-marked/blob/main/src/theme/spacing.ts
   */
  if (message.role === "user") {
    return (
      <View className="max-w-full flex-col flex-wrap items-start">
        <Text className="pb-2 text-[16px] leading-[25px]">
          {message.content}
        </Text>
        {message.imageUrls?.[0] ? (
          <ShareableImage
            uri={message.imageUrls[0]}
            style={{
              borderRadius: 10
            }}
          />
        ) : null}
      </View>
    )
  }

  /**
   * If we have an empty message, we should consider this a loading state and
   * render the loading indicator.
   */
  if (!message.content.length) {
    return (
      <View className="flex-row py-4">
        <LoadingIndicator />
        {isLongWait ? (
          <Animated.View entering={FadeIn.duration(500)}>
            <Text className="pl-3 text-[16px]">Still working...</Text>
          </Animated.View>
        ) : null}
      </View>
    )
  }

  /**
   * Render whatever content we get from the assistant, assuming it is in
   * markdown format.
   */
  return <MarkdownContent value={message.content} />
}

export function AiChatMessage({ message, isLongWait }: AiChatMessageProps) {
  const { user } = useAuthentication()
  const { modelName } = useMessageMetadata(message)

  return (
    <View className="mb-2 flex-1 items-start p-1">
      <View className="flex w-full flex-row items-center pb-[5px]">
        <View className="mr-[10px] size-[24px]">
          {message.role === "assistant" ? (
            <View className="aspect-square size-full rounded-full">
              <DotsCircleIcon className="text-primary" />
            </View>
          ) : (
            <UserAvatar user={user} />
          )}
        </View>

        <View className="flex-1 flex-row items-end gap-2">
          <Text variant="bold" className="text-[16px]">
            {senderName(message)}
          </Text>
          <View className="flex-1">
            <Text className="ml-1 line-clamp-1 shrink text-[12px] font-thin text-muted-foreground">
              {modelName}
            </Text>
          </View>
        </View>
      </View>

      <View className="ml-[34px] flex flex-row flex-wrap">
        <AiChatContent isLongWait={isLongWait} message={message} />
      </View>
    </View>
  )
}
