import {
  BottomSheetHandle,
  type BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetView
} from "@gorhom/bottom-sheet"
import { usePostHog } from "posthog-react-native"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Keyboard } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useColors } from "@/hooks/use-colors"
import { useUserSettings } from "@/hooks/use-user-settings"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { cn } from "@/lib/utils/cn"

import { Alert } from "../elements/alert"
import { Pressable } from "../elements/pressable"
import { Text } from "../elements/text"
import { TextInput } from "../elements/text-input"
import { View } from "../elements/view"

export type SystemPromptModalProps = {
  currentSystemPrompt?: string | null
  open: boolean
  setOpen: (open: boolean) => void
  setSystemPrompt: (systemPrompt: string) => void
}

function ModalHandle({
  saveEnabled,
  onCancel,
  onSave
}: {
  saveEnabled: boolean
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <View className="flex flex-row items-center justify-between px-2">
      <Pressable haptics onPress={onCancel}>
        <Text className="text-card-foreground">Cancel</Text>
      </Pressable>
      <Pressable
        disabled={!saveEnabled}
        className={cn(
          "rounded-md text-card-foreground",
          !saveEnabled && "opacity-50"
        )}
        haptics
        onPress={onSave}
      >
        <Text>Save</Text>
      </Pressable>
    </View>
  )
}

export function SystemPromptModal({
  currentSystemPrompt,
  open,
  setOpen,
  setSystemPrompt
}: SystemPromptModalProps) {
  const { top } = useSafeAreaInsets()
  const posthog = usePostHog()
  const colors = useColors()
  const [hasSeenSystemPromptInfo, setHasSeenSystemPromptInfo] = useUserSettings(
    (state) => [state.hasSeenSystemPromptInfo, state.setHasSeenSystemPromptInfo]
  )

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ["99%"], [])

  const initialInput = useMemo(
    () => currentSystemPrompt ?? "",
    [currentSystemPrompt]
  )

  const [input, setInput] = useState(initialInput)

  // If the system prompt is reset from the parent, update the input
  useEffect(() => {
    setInput(initialInput)
  }, [initialInput])

  /**
   * Show or hide the modal
   */
  useEffect(() => {
    if (open && hasSeenSystemPromptInfo) {
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
  }, [open, hasSeenSystemPromptInfo])

  const onClose = useCallback(
    (action: "save" | "cancel", finalInput: string) => {
      Keyboard.dismiss()
      setOpen(false)

      if (action === "save") {
        setSystemPrompt(finalInput)
        posthog.capture(ANALYTICS_EVENTS.SYSTEM_PROMPT_EDIT_SAVED)
      } else {
        // revert to initial system prompt
        setInput(initialInput)
        posthog.capture(ANALYTICS_EVENTS.SYSTEM_PROMPT_EDIT_CANCELLED)
      }
    },
    [initialInput, posthog, setOpen, setSystemPrompt]
  )

  const onCancel = () => {
    onClose("cancel", input)
  }

  const onSave = () => {
    onClose("save", input)
  }

  const renderHandle = (props: BottomSheetHandleProps) => {
    return (
      <BottomSheetHandle {...props}>
        <ModalHandle
          saveEnabled={input !== initialInput}
          onCancel={onCancel}
          onSave={onSave}
        />
      </BottomSheetHandle>
    )
  }

  if (open && !hasSeenSystemPromptInfo) {
    return (
      <Alert
        confirmButton={{
          text: "Continue",
          onPress: () => {
            setHasSeenSystemPromptInfo(true)
          }
        }}
        visible
      >
        <View className="items-center justify-center rounded-[30px] bg-white px-3 py-1">
          <Text className="text-2xl">🔧 🤖 🛠️</Text>
        </View>
        <Text variant="bold" className="mt-3 text-lg text-primary-foreground">
          Customizing behavior
        </Text>
        <Text className="my-2 text-center text-primary-foreground">
          You can customize DecentAI&apos;s behavior, personality, and tone with
          custom instructions. These instructions will adapt the AI model&apos;s
          responses in a given conversation.{"\n\n"}
          Example: “Keep your answers brief at all times and respond using
          bullet points”
        </Text>
      </Alert>
    )
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      topInset={top}
      snapPoints={snapPoints}
      handleComponent={renderHandle}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleStyle={{
        backgroundColor: colors.card,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
      }}
      onDismiss={onCancel}
    >
      <BottomSheetView className="justify-between px-4 pt-2">
        <TextInput
          // eslint-disable-next-line jsx-a11y/no-autofocus -- we want to autofocus here
          autoFocus
          defaultValue={input}
          className="bg-card text-card-foreground"
          onChangeText={setInput}
          multiline
          textAlignVertical="top"
          placeholder="Enter custom instructions..."
          blurOnSubmit={false}
        />
      </BottomSheetView>
    </BottomSheetModal>
  )
}
