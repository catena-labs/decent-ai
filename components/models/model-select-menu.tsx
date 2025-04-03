import {
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView
} from "@gorhom/bottom-sheet"
import { useRouter } from "expo-router"
import { Plus, SparkleIcon } from "lucide-react-native"
import { usePostHog } from "posthog-react-native"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useInAppPurchases } from "@/components/providers/in-app-purchase-provider"
import { useOnboardingTooltip } from "@/hooks/tooltips/use-onboarding-tooltip"
import { useAvailableModels } from "@/hooks/use-available-models"
import { useColors } from "@/hooks/use-colors"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"
import { filterModelsForMode } from "@/lib/ai/filter-model-list"
import { type ModelSlug } from "@/lib/ai/models"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { type ConversationMode } from "@/lib/conversations/conversation-modes"
import { cn } from "@/lib/utils/cn"

import {
  type DataType,
  ModelSelectMenuRow,
  isCustomModelRow,
  isModelOrRouterRow,
  isSectionTitleRow,
  isUpgradeBannerRow
} from "./model-select-menu-row"
import { InfoButton } from "../elements/info-button"
import { Pressable } from "../elements/pressable"
import { BottomSheetBackdrop } from "../layout/bottom-sheet-backdrop"

export type ModelSelectMenuProps = {
  hideAddYourOwn?: boolean
  mode?: ConversationMode
  open?: boolean
  renderMessage?: () => React.ReactElement
  setOpen?: (open: boolean) => void
  selectedSlug: ModelSlug
  setSelectedSlug: (slug: ModelSlug) => void
}

export function ModelSelectMenu({
  hideAddYourOwn = false,
  mode = "chat",
  open,
  renderMessage,
  setOpen,
  selectedSlug,
  setSelectedSlug
}: ModelSelectMenuProps) {
  useOnboardingTooltip("add-custom-model", open)
  const router = useRouter()
  const posthog = usePostHog()
  const { top, bottom } = useSafeAreaInsets()
  const colors = useColors()

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ["50%", "99%"], [])
  const { models: allModels, routers: allRouters } = useAvailableModels()

  const { presentPaywallIfNeeded } = useInAppPurchases()

  const { isLoading: isLoadingSubscriptionStatus, isSubscribed } =
    useSubscriptionStatus()

  const filteredRouters = useMemo(() => {
    return filterModelsForMode(allRouters, mode)
  }, [allRouters, mode])

  const filteredModels = useMemo(() => {
    return filterModelsForMode(allModels, mode)
  }, [allModels, mode])

  /**
   * Show or hide the modal
   */
  useEffect(() => {
    if (open) {
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
  }, [open])

  const data = useMemo<DataType[]>(() => {
    let result: DataType[] = []

    if (!hideAddYourOwn) {
      result.push({
        type: "custom-model",
        value: {
          name: "Add your own model",
          onPress: () => {
            router.push(`/new-model`)
            bottomSheetModalRef.current?.dismiss()
          }
        }
      })
    }

    const routers = filteredRouters.map(
      (value) => ({ type: "router", value }) as const
    )

    const models = filteredModels.map(
      (value) => ({ type: "model", value }) as const
    )

    // If we have any routers, add them to the list, with a header
    if (routers.length > 0) {
      result = [
        ...result,
        { type: "section-title", value: "Model Mixes" },
        ...routers
      ]
    }

    if (!isLoadingSubscriptionStatus && !isSubscribed) {
      result.push({
        type: "upgrade-banner",
        value: "Upgrade to Pro for more model access"
      })
    }

    result = [...result, { type: "section-title", value: "Models" }, ...models]

    return result
  }, [
    hideAddYourOwn,
    filteredRouters,
    filteredModels,
    isLoadingSubscriptionStatus,
    isSubscribed,
    router
  ])

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof data)[0]; index: number }) => {
      if (isSectionTitleRow(item)) {
        return (
          <Text className="mb-[10px] mt-[30px] text-sm text-muted-foreground">
            {item.value}
          </Text>
        )
      }

      if (isCustomModelRow(item)) {
        return (
          <View className="flex items-end">
            <Pressable
              className="flex flex-row items-center gap-1 px-4"
              onPress={item.value.onPress}
            >
              <Plus className="text-primary" size={20} />
              <Text>Add your own</Text>
            </Pressable>
          </View>
        )
      }

      if (isUpgradeBannerRow(item)) {
        return (
          <View className="mt-4">
            <InfoButton
              icon={
                <SparkleIcon
                  className="mr-1.5 text-primary"
                  fill={colors.primary}
                  size={17.6}
                />
              }
              message={item.value}
              onPressHandler={async () => {
                posthog.capture(ANALYTICS_EVENTS.FULL_ACCESS_OPENED)
                await presentPaywallIfNeeded()
                setOpen?.(false)
              }}
            />
          </View>
        )
      }

      const isFirstInSection = isSectionTitleRow(data[index - 1])
      const isLastInSection =
        !data[index + 1] ||
        isSectionTitleRow(data[index + 1]) ||
        isUpgradeBannerRow(data[index + 1])

      const selected =
        isModelOrRouterRow(item) && selectedSlug === item.value.slug

      const isPaywalled =
        isModelOrRouterRow(item) &&
        !isSubscribed &&
        item.value.availability === "subscription"

      return (
        <ModelSelectMenuRow
          item={item}
          selected={selected}
          isPaywalled={isPaywalled}
          onPress={async () => {
            if (isPaywalled) {
              setOpen?.(false)
              await presentPaywallIfNeeded()
            } else {
              setSelectedSlug(item.value.slug)
              setOpen?.(false)
            }
          }}
          onDismiss={() => setOpen?.(false)}
          className={cn(
            isFirstInSection ? "rounded-t-xl" : "",
            isLastInSection
              ? "rounded-b-xl border border-border"
              : "border-x border-t border-border"
          )}
        />
      )
    },
    [
      colors.primary,
      data,
      isSubscribed,
      posthog,
      presentPaywallIfNeeded,
      selectedSlug,
      setOpen,
      setSelectedSlug
    ]
  )

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
    return (
      <BottomSheetBackdrop
        {...props}
        onPress={() => bottomSheetModalRef.current?.close()}
      />
    )
  }, [])

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      topInset={top}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: colors.primary,
        opacity: 0.1
      }}
      handleStyle={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
      }}
      onDismiss={() => setOpen?.(false)}
    >
      {renderMessage ? (
        <BottomSheetView className="bg-background px-6 py-4">
          {renderMessage()}
        </BottomSheetView>
      ) : null}

      <BottomSheetFlatList
        data={data}
        style={{ backgroundColor: colors.background }}
        keyExtractor={(i) =>
          typeof i.value === "string" ? i.value : `${i.type}-${i.value.name}`
        }
        renderItem={renderItem}
        contentContainerStyle={{
          backgroundColor: colors.background,
          paddingHorizontal: 20,
          paddingBottom: bottom + 20
        }}
      />
    </BottomSheetModal>
  )
}
