import { useRouter } from "expo-router"
import { Headphones } from "lucide-react-native"
import { useMemo } from "react"
import { type ScrollViewProps } from "react-native"

import { View } from "@/components/elements/view"
import { createLogger } from "@/lib/logger"
import { cn } from "@/lib/utils/cn"

import { QuickActionItem } from "./quick-action-item"
import { GenerateImageIcon } from "../icons/generate-image-icon"

const logger = createLogger("components:home:quick-actions")

type Props = ScrollViewProps & {
  onStartAudioMode: () => void
}

export function QuickActionsList({
  className,
  onStartAudioMode,
  ...props
}: Props) {
  const router = useRouter()

  const QUICK_ACTIONS = useMemo(
    () => [
      {
        id: "voice-chat",
        title: "Voice chat",
        icon: (
          <Headphones className="text-primary" strokeWidth={2.5} size={26} />
        ),

        onPress: onStartAudioMode
      },
      {
        id: "generate-image",
        title: "Image",
        icon: <GenerateImageIcon className="size-6 text-primary" />,
        onPress: () => {
          router.push({
            pathname: "/image/generate"
          })
        }
      }
    ],
    [router, onStartAudioMode]
  )

  return (
    <View className={cn("flex flex-row px-5", className)} {...props}>
      {QUICK_ACTIONS.map((item) => (
        <QuickActionItem
          analyticsEvent="quick_action_pressed"
          analyticsEventProps={{ quick_action: item.id }}
          key={item.id}
          title={item.title}
          icon={item.icon}
          className="flex-1"
          onPress={() => {
            logger.debug("Quick action pressed", { action: item.title })
            item.onPress()
          }}
        />
      ))}
    </View>
  )
}
