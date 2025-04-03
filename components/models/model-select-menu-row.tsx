import { useRouter } from "expo-router"
import { InfoIcon } from "lucide-react-native"
import { usePostHog } from "posthog-react-native"
import { Alert } from "react-native"

import { Pressable, type PressableProps } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { useColors } from "@/hooks/use-colors"
import { type Model, type Router, isCustomModel } from "@/lib/ai/models"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { cn } from "@/lib/utils/cn"

import { RadioButton } from "../elements/radio-button"
import { View } from "../elements/view"

type DataTypeSectionTitle = {
  type: "section-title"
  value: string
}

type DataTypeUpgradeBanner = {
  type: "upgrade-banner"
  value: string
}

type DataTypeCustomModel = {
  type: "custom-model"
  value: {
    name: string
    onPress: () => void
  }
}

type DataTypeModel = {
  type: "model"
  value: Model
}
type DataTypeRouter = {
  type: "router"
  value: Router
}

export type DataType =
  | DataTypeSectionTitle
  | DataTypeUpgradeBanner
  | DataTypeCustomModel
  | DataTypeModel
  | DataTypeRouter

export function isUpgradeBannerRow(
  value?: DataType
): value is DataTypeUpgradeBanner {
  return value?.type === "upgrade-banner"
}

export function isCustomModelRow(
  value?: DataType
): value is DataTypeCustomModel {
  return value?.type === "custom-model"
}

export function isSectionTitleRow(
  value?: DataType
): value is DataTypeSectionTitle {
  return value?.type === "section-title"
}

export function isRouterRow(value?: DataType): value is DataTypeRouter {
  return value?.type === "router"
}

export function isModelRow(value?: DataType): value is DataTypeModel {
  return value?.type === "model"
}

export function isModelOrRouterRow(
  value?: DataType
): value is DataTypeModel | DataTypeRouter {
  return isModelRow(value) || isRouterRow(value)
}

type Props = PressableProps & {
  item: Exclude<DataType, DataTypeSectionTitle | DataTypeUpgradeBanner>
  selected?: boolean
  isPaywalled?: boolean
  onDismiss?: () => void
}

export function ModelSelectMenuRow({
  item,
  selected,
  isPaywalled,
  className,
  onPress,
  onDismiss,
  ...props
}: Props) {
  const router = useRouter()
  const posthog = usePostHog()
  const colors = useColors()

  return (
    <Pressable
      className={cn(
        "flex-row items-center gap-2 bg-card p-3 active:opacity-75",
        className
      )}
      onPress={(e) => {
        if (isRouterRow(item)) {
          posthog.capture(
            isPaywalled
              ? ANALYTICS_EVENTS.PAYWALLED_ROUTER_SELECTED
              : ANALYTICS_EVENTS.ROUTER_SELECTED,
            {
              router: item.value.slug
            }
          )
        } else if (isModelRow(item)) {
          posthog.capture(
            isPaywalled
              ? ANALYTICS_EVENTS.PAYWALLED_MODEL_SELECTED
              : ANALYTICS_EVENTS.MODEL_SELECTED,
            {
              model: item.value.slug
            }
          )
        }

        onPress?.(e)
      }}
      {...props}
    >
      {isModelOrRouterRow(item) ? (
        <RadioButton className="mr-1" selected={selected ?? false} />
      ) : null}

      <View className="flex-1 gap-1 overflow-hidden">
        <View className="flex-row items-center">
          <Text variant="medium" className="text-foreground">
            {item.value.name}
          </Text>
          {isPaywalled ? (
            <Text className="ml-2 text-sm text-primary">PRO</Text>
          ) : null}
        </View>

        {isModelOrRouterRow(item) && item.value.shortDescription ? (
          <Text className="text-xs text-secondary-foreground">
            {item.value.shortDescription}
          </Text>
        ) : null}
      </View>

      {isModelOrRouterRow(item) && isCustomModel(item.value) ? (
        <Pressable
          className="items-center justify-center p-2"
          onPress={() => {
            router.push({
              pathname: "/(main)/new-model",
              params: { id: item.value.slug }
            })
            onDismiss?.()
          }}
        >
          <Text className="text-[15px] text-primary">Edit</Text>
        </Pressable>
      ) : null}

      {isModelOrRouterRow(item) && item.value.description ? (
        <Pressable
          className="aspect-square size-6 shrink-0 items-center justify-center"
          onPress={() => {
            posthog.capture(ANALYTICS_EVENTS.MODEL_INFO_PRESSED, {
              model: item.value.slug
            })

            Alert.alert(item.value.name, item.value.description, [
              {
                text: "Close",
                style: "cancel"
              }
            ])
          }}
        >
          <InfoIcon size={16} color={colors["secondary-foreground"]} />
        </Pressable>
      ) : null}
    </Pressable>
  )
}
