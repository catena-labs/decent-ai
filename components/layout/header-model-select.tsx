import { ChevronDownIcon } from "lucide-react-native"
import { useState } from "react"
import { Dimensions, Keyboard } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"

import { type Model } from "@/lib/ai/models"
import { type AnalyticsEvent } from "@/lib/analytics/events"
import { type ConversationMode } from "@/lib/conversations/conversation-modes"

import { Pressable } from "../elements/pressable"
import { Text } from "../elements/text"
import { View } from "../elements/view"
import { ModelSelectMenu } from "../models/model-select-menu"

// Calculate dynamic maxWidth
const deviceWidth = Dimensions.get("window").width
const dynamicMaxWidth = Number(deviceWidth) * 0.6

type HeaderModelSelectProps = {
  hideAddYourOwn?: boolean
  onOpenEvent?: AnalyticsEvent
  mode?: ConversationMode
  selectedModel: Model
  onModelSelect: (modelSlug: string) => void
}

export function HeaderModelSelect({
  hideAddYourOwn = false,
  mode,
  selectedModel,
  onOpenEvent,
  onModelSelect
}: HeaderModelSelectProps) {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  return (
    <>
      <Animated.View entering={FadeIn.duration(500)}>
        <Pressable
          // NEED TO PASS THIS THROUGH
          analyticsEvent={onOpenEvent}
          className="mx-auto rounded-xl bg-secondary p-2"
          haptics
          onPress={() => {
            Keyboard.dismiss()
            setModelSelectorOpen(true)
          }}
          style={{ maxWidth: dynamicMaxWidth }}
        >
          <View className="flex-row items-center">
            <Text
              variant="bold"
              className="line-clamp-1 shrink text-sm leading-snug text-foreground"
            >
              {selectedModel.name}
            </Text>
            <ChevronDownIcon className="text-foreground" size={17.6} />
          </View>
        </Pressable>
      </Animated.View>

      <ModelSelectMenu
        hideAddYourOwn={hideAddYourOwn}
        open={modelSelectorOpen}
        setOpen={setModelSelectorOpen}
        selectedSlug={selectedModel.slug}
        setSelectedSlug={(modelSlug) => {
          onModelSelect(modelSlug)
        }}
        mode={mode}
      />
    </>
  )
}
