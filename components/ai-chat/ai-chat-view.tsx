import * as Sentry from "@sentry/react-native"
import { FlashList, type ListRenderItem } from "@shopify/flash-list"
import { ArrowDownIcon, HeadphonesIcon } from "lucide-react-native"
import { useColorScheme } from "nativewind"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, Keyboard, KeyboardAvoidingView } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"

import { Pressable } from "@/components/elements/pressable"
import { View } from "@/components/elements/view"
import { type Conversation } from "@/drizzle/schema"
import { useCreateMessage } from "@/hooks/messages/use-create-message"
import { useAudioAccessStatus } from "@/hooks/use-audio-access"
import { useConversationChat } from "@/hooks/use-conversation-chat"
import { useHaptics } from "@/hooks/use-haptics"
import { useUpgradeBar } from "@/hooks/use-upgrade-bar"
import { type Message, messageSchema } from "@/lib/ai/message"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { type ConversationMode } from "@/lib/conversations/conversation-modes"
import { createLogger } from "@/lib/logger"
import { cn } from "@/lib/utils/cn"
import { isIOS } from "@/lib/utils/platform"

import { AiPhotoUpload } from "./ai-photo-upload"
import { AIChatMessageView } from "./messages/ai-chat-message-view"
import { QuickActionsList } from "./quick-actions-list"
import { AudioMode } from "../audio/audio-mode"
import {
  AUDIO_DATA_PREFIX,
  SPEECH_TRANSCRIPTION_HEADER
} from "../audio/audio-mode-constants"
import { AudioModeLoading } from "../audio/audio-mode-loading"
import { BottomInput } from "../layout/bottom-input"

const logger = createLogger("components:ai-chat:ai-chat-view")

const BOTTOM_SCROLL_THRESHOLD = 50

const LONG_WAIT_MESSAGE_TIME_MS = 8_000

const LOADING_MESSAGE: Message = messageSchema.parse({
  content: "",
  role: "assistant"
})

export type AiChatViewProps = {
  conversation: Conversation
  initialMessage?: string
  mode?: ConversationMode
}

export function AiChatView({
  initialMessage,
  conversation,
  mode = "chat"
}: AiChatViewProps) {
  // User Settings
  const { triggerHaptics } = useHaptics()

  const [isSending, setIsSending] = useState(false)

  const messageContainerRef = useRef<FlashList<Message> | null>(null)
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false)
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState(false)

  // Still waiting message - this is a temporary UX improvement to indicate to user
  // we are still doing something on responses that are taking a long time.
  const stillWaitingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const [showStillWaitingMessage, setShowStillWaitingMessage] = useState(false)

  const { colorScheme } = useColorScheme()

  // User credits / upgrade bar
  const { showUpgradeBar } = useUpgradeBar()

  // audio mode takes over the top-view UI
  const [isAudioModeRequested, setIsAudioModeRequested] = useState(false)
  const [audioError, setAudioError] = useState<Error | undefined>()

  // determine if the current user has access to audio mode
  const audioAccess = useAudioAccessStatus()
  const isAudioModePermitted = useMemo(() => {
    return audioAccess.status === 200
  }, [audioAccess])

  // If defined, contains data url of base64 encoded uploaded user image
  const [imageUploadUrl, setImageUploadUrl] = useState<string>()

  const { mutate: createMessage } = useCreateMessage(conversation.id)

  const onStartAudioMode = useCallback(() => {
    setIsAudioModeRequested(true)

    if (audioAccess.isLoading) {
      return
    }

    if (!isAudioModePermitted) {
      setIsAudioModeRequested(false)
      Alert.alert(
        audioAccess.body ?? "Sorry, voice chat is currently unavailable."
      )
    }
  }, [audioAccess, isAudioModePermitted])

  const headers: Record<string, string> = {}

  if (conversation.excludeTools?.length) {
    headers["x-excluded-tools"] = JSON.stringify(conversation.excludeTools)
  }

  if (isAudioModeRequested) {
    headers["x-is-audio-mode"] = "true"
  }

  const {
    append,
    error: chatError,
    isLoading, // is `true` from send until streaming has ended
    messages,
    setMessages,
    stop
  } = useConversationChat({
    conversationId: conversation.id,
    headers,
    onResponse(_response) {
      clearTimeout(stillWaitingTimeoutRef.current)
      setShowStillWaitingMessage(false)

      // if the user input was raw audio that was transcribed, persist the transciption as that message's content
      const transcribedText = _response.headers.get(SPEECH_TRANSCRIPTION_HEADER)
      if (transcribedText) {
        const userMessage = messageSchema.parse({
          content: transcribedText,
          role: "user"
        })
        createMessage({ message: userMessage })
        setMessages((prev) => {
          const lastUserMessageIndex = prev
            .map((m) => m.role)
            .lastIndexOf("user")
          if (lastUserMessageIndex !== -1) {
            prev[lastUserMessageIndex] = userMessage
          }
          return prev
        })
      }
    }
  })

  const onMessageSend = useCallback(
    (text: string) => {
      try {
        setIsSending(true)
        setShowStillWaitingMessage(false)

        // Allow auto scrolling
        setIsAutoScrollEnabled(true)

        stillWaitingTimeoutRef.current = globalThis.setTimeout(() => {
          setShowStillWaitingMessage(true)
        }, LONG_WAIT_MESSAGE_TIME_MS)

        setImageUploadUrl(undefined)

        append(
          messageSchema.parse({
            content: text,
            imageUrls: imageUploadUrl ? [imageUploadUrl] : undefined,
            role: "user"
          })
        )

        setTimeout(() => {
          Keyboard.dismiss()
        }, 0)

        setTimeout(() => {
          messageContainerRef.current?.scrollToIndex({
            index: 0,
            animated: true,
            viewPosition: 1 // bottom
          })
        }, 100)
      } catch (error) {
        Sentry.captureException(error)
        logger.error("onMessageSend", error)
      } finally {
        setIsSending(false)
      }
    },
    [append, imageUploadUrl]
  )

  /**
   * Initialize the component on mount.
   */
  useEffect(() => {
    /**
     * If we have a starting message, send it as the first message in the
     * conversation.
     */
    if (initialMessage) {
      onMessageSend(initialMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only want to run once
  }, [])

  /**
   * If we launch the screen in audio mode, trigger it
   */
  useEffect(() => {
    if (mode === "audio") {
      onStartAudioMode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only want to run when 'mode' changes
  }, [mode])

  /**
   * The message list, in reverse chronological order (newest message first),
   * for the UI (and eventually pagination), with the loading message appended
   * and the system message removed.
   */
  const reversedMessages = useMemo(() => {
    // exclude both system and audio data messages
    const list = messages.filter(
      (m) => m.role !== "system" && !m.content.startsWith(AUDIO_DATA_PREFIX)
    )

    if (isLoading && messages[messages.length - 1]?.role !== "assistant") {
      list.push(LOADING_MESSAGE)
    }

    return list.reverse()
  }, [messages, isLoading])

  // Add vibration as new messages are streamed in
  useEffect(() => {
    if (messages.length > 0 && isLoading) {
      triggerHaptics(isIOS ? "selection" : "light")
    }
  }, [isLoading, messages, triggerHaptics])

  // Always scroll to the bottom
  useEffect(() => {
    if (messages.length > 0) {
      // If the user hasn't manually overwritten the scroll position,
      // auto scroll to the last item, leaving it at the top. However
      // if the top of the last item is already off screen, scroll to
      // the bottom of the last item.
      if (isAutoScrollEnabled) {
        messageContainerRef.current?.scrollToIndex({
          index: 0,
          animated: true,
          viewPosition: 0
        })
      }
    }
  }, [isAutoScrollEnabled, messages])

  const memoizedRenderItem = useCallback<ListRenderItem<Message>>(
    ({ index, item }) => (
      <AIChatMessageView
        conversationId={conversation.id}
        message={item}
        previousMessage={reversedMessages[index + 1]}
        onMessageSend={onMessageSend}
        isLongWait={showStillWaitingMessage}
      />
    ),
    [conversation, reversedMessages, onMessageSend, showStillWaitingMessage]
  )

  const onClearImageUpload = useCallback(() => {
    setImageUploadUrl(undefined)
  }, [setImageUploadUrl])

  const inputControls = useCallback(() => {
    return (
      <>
        <AiPhotoUpload
          conversation={conversation}
          menuOpen={mode === "vision"}
          setImageUploadUrl={setImageUploadUrl}
        />
        <Pressable
          analyticsEvent="chat_audio_mode_started"
          className="flex-row items-center rounded-full bg-secondary px-2 py-1"
          haptics
          onPress={() => {
            triggerHaptics("success")
            onStartAudioMode()
          }}
        >
          <HeadphonesIcon className="text-foreground" size={18} />
        </Pressable>
      </>
    )
  }, [conversation, mode, onStartAudioMode, triggerHaptics])

  return (
    <>
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <Animated.View
          className={cn("flex-1", showUpgradeBar ? "pb-40" : "pb-28")}
          entering={FadeIn.duration(400)}
        >
          <Animated.View className="flex-1">
            <View className="relative flex-1">
              {!messages.length && (
                <QuickActionsList
                  className="mt-10"
                  onStartAudioMode={onStartAudioMode}
                />
              )}
              <FlashList
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 20
                }}
                data={reversedMessages}
                estimatedItemSize={100}
                extraData={[colorScheme, isLoading]}
                inverted
                keyExtractor={(item) => `${item.id}-${item.role}`}
                onScroll={({ nativeEvent }) => {
                  const isCloseToBottom =
                    nativeEvent.contentOffset.y > BOTTOM_SCROLL_THRESHOLD
                  setShowScrollToBottomButton(isCloseToBottom)
                }}
                onScrollBeginDrag={() => {
                  setIsAutoScrollEnabled(false)
                }}
                onScrollEndDrag={({ nativeEvent }) => {
                  setIsAutoScrollEnabled(
                    nativeEvent.contentOffset.y > 0 &&
                      nativeEvent.contentOffset.y < BOTTOM_SCROLL_THRESHOLD
                  )
                }}
                ref={messageContainerRef}
                renderItem={memoizedRenderItem}
              />

              {showScrollToBottomButton ? (
                <Pressable
                  className="absolute bottom-4 left-1/2 -ml-5 size-10 items-center justify-center rounded-full bg-card shadow-md active:scale-90"
                  onPress={() => {
                    messageContainerRef.current?.scrollToIndex({
                      index: 0,
                      animated: true
                    })
                  }}
                >
                  <ArrowDownIcon className="size-5 text-primary" />
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>

      {isAudioModeRequested ? (
        audioAccess.isLoading ? (
          <AudioModeLoading setIsVisible={setIsAudioModeRequested} />
        ) : isAudioModePermitted ? (
          <AudioMode
            audioError={audioError}
            chatError={chatError}
            isLoading={isLoading}
            isVisible={isAudioModeRequested}
            messages={messages}
            onMessageSend={onMessageSend}
            setAudioError={setAudioError}
            setIsVisible={setIsAudioModeRequested}
            stop={stop}
          />
        ) : null
      ) : null}

      <BottomInput
        inputControls={inputControls}
        imageUploadUrl={imageUploadUrl}
        isAwaitingResponse={isSending || isLoading}
        onClearImageUpload={onClearImageUpload}
        onInterrupt={stop}
        onSubmit={onMessageSend}
        placeholder="Type a message..."
        submitEvent={ANALYTICS_EVENTS.CHAT_MESSAGE_SENT}
        interruptEvent={ANALYTICS_EVENTS.CHAT_MESSAGE_INTERRUPTED}
      />
    </>
  )
}
