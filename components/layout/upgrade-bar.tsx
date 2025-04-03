import { useMemo } from "react"

import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useCurrentModel } from "@/hooks/use-current-model"
import { useUserCreditsStore } from "@/hooks/use-user-credits"
import { calculateCallsRemaining } from "@/lib/ai/calculate-calls-remaining"
import { formatNumber } from "@/lib/utils/string-fns/format-number"
import { pluralize } from "@/lib/utils/string-fns/pluralize"

import { Pressable } from "../elements/pressable"
import { useInAppPurchases } from "../providers/in-app-purchase-provider"

type Props = {
  visible?: boolean
}

export function UpgradeBar({ visible }: Props) {
  const userCredits = useUserCreditsStore((state) => state.userCredits)
  const currentModel = useCurrentModel()
  const { presentPaywallIfNeeded } = useInAppPurchases()

  const callsRemaining = useMemo(() => {
    return calculateCallsRemaining(userCredits ?? 0, currentModel.creditCost)
  }, [currentModel, userCredits])

  if (!visible) {
    return null
  }

  return (
    <View className="-mb-3 flex flex-row items-center justify-between rounded-t-xl border-x border-t border-border bg-secondary px-5 pb-5 pt-2">
      <Text className="text-foreground">
        {userCredits === null ? (
          <>Upgrade for more credits</>
        ) : (
          <>
            {formatNumber(callsRemaining)}{" "}
            {pluralize(callsRemaining, "call", "calls")} remaining
          </>
        )}
      </Text>
      <Pressable
        analyticsEvent="upgrade_to_pro_pressed"
        onPress={async () => await presentPaywallIfNeeded()}
      >
        <Text variant="medium">Upgrade</Text>
      </Pressable>
    </View>
  )
}
