import { Image } from "expo-image"
import { ArrowUpIcon, SquareIcon, X } from "lucide-react-native"
import { useState } from "react"
import { KeyboardAvoidingView } from "react-native"

import { SpeechToText } from "@/components/audio/speech-to-text"
import { Pressable } from "@/components/elements/pressable"
import { AnimatedHeightTextInput } from "@/components/elements/text-input"
import { View } from "@/components/elements/view"
import { AppearingSubmitButton } from "@/components/home/quick-input/appearing-submit-button"
import { useColors } from "@/hooks/use-colors"
import { useHaptics } from "@/hooks/use-haptics"
import { useUpgradeBar } from "@/hooks/use-upgrade-bar"
import { type AnalyticsEvent } from "@/lib/analytics/events"
import { cn } from "@/lib/utils/cn"
import { isAndroid } from "@/lib/utils/platform"

import { UpgradeBar } from "./upgrade-bar"

export type InputControlsProps = {
  input: string
  setInput: (input: string) => void
}

type Props = {
  disabled?: boolean
  initialInput?: string
  inputControls?: React.FC<InputControlsProps>
  interruptEvent?: AnalyticsEvent
  imageUploadUrl?: string
  isAwaitingResponse?: boolean
  submitEvent?: AnalyticsEvent
  onClearImageUpload?: () => void
  onFocus?: () => void
  onInterrupt?: () => void
  onSubmit?: (input: string) => void
  persistOnSubmit?: boolean
  placeholder?: string
}

export function BottomInput({
  disabled,
  inputControls,
  initialInput,
  imageUploadUrl,
  interruptEvent,
  isAwaitingResponse,
  submitEvent,
  onClearImageUpload,
  onFocus,
  onInterrupt,
  onSubmit,
  persistOnSubmit = false,
  placeholder
}: Props) {
  const colors = useColors()
  const [input, setInput] = useState(initialInput ?? "")
  const { triggerHaptics } = useHaptics()
  const { showUpgradeBar } = useUpgradeBar()

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={100}
      className="w-full bg-transparent"
      style={{
        position: "absolute",
        bottom: 0
      }}
    >
      <UpgradeBar visible={showUpgradeBar} />
      <View
        className={cn(
          "w-full rounded-t-xl border-x border-t border-input bg-card text-[16px]",
          isAndroid && "px-3"
        )}
      >
        <View
          className="flex flex-1 flex-col rounded-t-xl bg-card px-4 pb-6 pt-2"
          safeArea={isAndroid ? "bottom" : false}
        >
          {imageUploadUrl ? (
            <View className="pb-1 pt-3">
              <View className="size-[120px]">
                <Image
                  source={{ uri: imageUploadUrl }}
                  contentFit="cover"
                  style={{ width: 120, height: 120, borderRadius: 10 }}
                />
                <Pressable
                  className="absolute right-[2px] top-[2px] size-6 items-center justify-center rounded-full bg-primary"
                  onPress={() => {
                    onClearImageUpload?.()
                  }}
                >
                  <X color={colors.background} size={16} />
                </Pressable>
              </View>
            </View>
          ) : null}
          <View className="flex flex-row items-center pr-5">
            <AnimatedHeightTextInput
              className="w-full bg-card text-lg text-card-foreground"
              maxInputHeight={100}
              minInputHeight={45}
              multiline
              value={input}
              onFocus={() => {
                triggerHaptics("light")
                onFocus?.()
              }}
              onChangeText={setInput}
              placeholder={placeholder}
              placeholderTextColor={colors["muted-foreground"]}
              disabled={disabled}
            />
            {!isAwaitingResponse && input.length === 0 && (
              <SpeechToText
                initialPlaceholder={placeholder}
                setInput={setInput}
              />
            )}
          </View>

          <View
            className={cn(
              "mt-2 w-full shrink flex-row items-center justify-between gap-2"
            )}
          >
            <View className="shrink flex-row gap-2">
              {inputControls?.({ input, setInput })}
            </View>

            <AppearingSubmitButton
              analyticsEvent={isAwaitingResponse ? interruptEvent : submitEvent}
              visible={input.length > 0 || Boolean(isAwaitingResponse)}
              onPress={() => {
                if (isAwaitingResponse) {
                  onInterrupt?.()
                } else {
                  onSubmit?.(input)

                  if (!persistOnSubmit) {
                    setInput("")
                  }
                }
              }}
              className="shrink-0 bg-primary"
            >
              {isAwaitingResponse ? (
                <SquareIcon
                  color={colors.background}
                  fill={colors.background}
                  size={16}
                />
              ) : (
                <ArrowUpIcon
                  className="text-white dark:text-background"
                  size={20}
                />
              )}
            </AppearingSubmitButton>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
