import * as Clipboard from "expo-clipboard"
import { usePostHog } from "posthog-react-native"
import { useCallback } from "react"
import { Alert } from "react-native"
import Toast from "react-native-toast-message"

import { type ContextMenuItem } from "@/components/elements/context-menu"
import { type Message } from "@/lib/ai/message"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"

import { useSubmitFeedback } from "./use-submit-feedback"
import { useUserSettings } from "./use-user-settings"

type CreateMenuOptionParams = {
  onMessageSend: (message: string) => void | Promise<void>
  message: Message
  previousMessage?: Message
}

export function useCreateChatMessageContextMenuOptions(
  conversationId: string,
  messageId: string
) {
  const { mutate: submitFeedback } = useSubmitFeedback(
    conversationId,
    messageId
  )
  const [feedbackTermsLastAccepted, setFeedbackTermsLastAccepted] =
    useUserSettings((state) => [
      state.feedbackTermsLastAccepted,
      state.setFeedbackTermsLastAccepted
    ])
  const posthog = usePostHog()

  const handleFeedback = useCallback(
    (feedback: "good" | "bad") => {
      const handleSubmit = () => {
        posthog.capture(ANALYTICS_EVENTS.AI_CHAT_FEEDBACK, {
          feedback
        })
        submitFeedback({
          feedbackScore: feedback === "good" ? 1 : 0
        })
      }

      if (feedbackTermsLastAccepted) {
        handleSubmit()
        return
      }

      Alert.alert(
        "Feedback",
        "Thank you for your feedback. Your input is valuable in improving DecentAI.\n\nThis message and the three preceding it will be securely stored and may be reviewed by our team.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              posthog.capture(ANALYTICS_EVENTS.AI_CHAT_FEEDBACK_TERMS_REJECTED)
            }
          },
          {
            text: "Submit",
            onPress: () => {
              posthog.capture(ANALYTICS_EVENTS.AI_CHAT_FEEDBACK_TERMS_ACCEPTED)
              setFeedbackTermsLastAccepted(new Date())
              handleSubmit()
            }
          }
        ]
      )
    },
    [
      feedbackTermsLastAccepted,
      posthog,
      setFeedbackTermsLastAccepted,
      submitFeedback
    ]
  )

  const createMessageMenuOptions = useCallback(
    ({ onMessageSend, message, previousMessage }: CreateMenuOptionParams) => {
      const options: ContextMenuItem[] = [
        {
          id: "copy",
          label: "Copy",
          onPress: () => {
            const copyMessage = async () => {
              await Clipboard.setStringAsync(message.content)
              Toast.show({ type: "info", text1: "Message copied!" })
            }
            posthog.capture(ANALYTICS_EVENTS.MESSAGE_COPIED)
            void copyMessage()
          },
          icon: "copy"
        }
      ]

      if (message.role === "assistant" && previousMessage) {
        options.push({
          id: "refresh",
          label: "Regenerate response",
          onPress: () => {
            posthog.capture(ANALYTICS_EVENTS.MESSAGE_REGENERATED)
            void onMessageSend(previousMessage.content)
          },
          icon: "refresh"
        })
      }

      if (message.role === "assistant") {
        options.push(
          {
            id: "thumbs-up",
            label: "Good response",
            onPress: () => {
              handleFeedback("good")
            },
            icon: "thumbsUp"
          },
          {
            id: "thumbs-down",
            label: "Bad response",
            onPress: () => {
              handleFeedback("bad")
            },
            icon: "thumbsDown"
          }
        )
      }

      return options
    },
    [handleFeedback, posthog]
  )

  return createMessageMenuOptions
}
