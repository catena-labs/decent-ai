import { useMutation, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { createLogger } from "@/lib/logger"

import { useApiClient } from "./api-client/use-api-client"
import { useAuthentication } from "./use-authentication"

const logger = createLogger("use-user-points")

const actionSchema = z.enum(["bookmark-conversation", "model-change"])

const getPointsResponseSchema = z.object({
  points: z.number()
})

const assignPointsResponseSchema = z.object({
  pointsAssigned: z.number()
})

export function useUserPoints() {
  const apiClient = useApiClient()
  const { userId } = useAuthentication()
  const queryKey = ["user-points", userId]

  const { data, isLoading } = useQuery({
    enabled: Boolean(userId),
    queryKey,
    queryFn: async () => {
      logger.debug("Fetching user points")
      const response = await apiClient.fetch("/api/user-points")
      return getPointsResponseSchema.parse(await response.json())
    }
  })

  return {
    data,
    isLoading
  }
}

type ActionType = z.infer<typeof actionSchema>

export function useAssignUserPoints(action: ActionType) {
  const apiClient = useApiClient()
  const { userId } = useAuthentication()

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Not authenticated")
      }

      actionSchema.parse(action)

      logger.debug("Assigning user points", action)
      const response = await apiClient.fetch("/api/user-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      })
      return assignPointsResponseSchema.parse(await response.json())
    }
  })
}
