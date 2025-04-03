import { useSubscriptionStatus } from "./use-subscription-status"
import { useUserCreditsStore } from "./use-user-credits"

export function useUpgradeBar() {
  const userCredits = useUserCreditsStore((state) => state.userCredits)

  const { isSubscribed, isLoading: isLoadingSubscriptionStatus } =
    useSubscriptionStatus()

  const showUpgradeBar =
    userCredits !== null && !isLoadingSubscriptionStatus && !isSubscribed

  return { showUpgradeBar }
}
