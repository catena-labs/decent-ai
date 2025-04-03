import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { createLogger } from "@/lib/logger"

import { useApiFetch } from "./api-client/use-api-fetch"
import { useAuthentication } from "./use-authentication"

const logger = createLogger("use-subscription-status")

const responseSchema = z.object({
  expiration: z.number().nullable(),
  subscribed: z.boolean()
})

/**
 * A hook that fetches the API configuration, including the default endpoint to
 * hit, etc.
 */
export function useSubscriptionStatus() {
  // directly use fetch here since our api client relies on this hook
  const { apiFetch } = useApiFetch()
  const { userId } = useAuthentication()
  const queryKey = ["subscriptions", userId]

  const { data, isLoading, refetch } = useQuery({
    enabled: Boolean(userId),
    queryKey,
    queryFn: async () => {
      logger.debug("Fetching subscription status")
      const response = await apiFetch("/api/mobile/subscriptions")
      return responseSchema.parse(await response.json())
    }
  })

  const subscriptionExpiresAt =
    data?.expiration && data.expiration > 0 ? new Date(data.expiration) : null

  return {
    data,
    isLoading,
    refetch,
    isSubscribed: data?.subscribed,
    subscriptionExpiresAt
  }
}
