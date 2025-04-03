import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { externalLinkHrefSchema } from "@/components/elements/external-link"
import { createLogger } from "@/lib/logger"
import { ONE_DAY } from "@/lib/utils/date-fns/dates"

import { useApiFetch } from "./api-client/use-api-fetch"

const logger = createLogger("use-app-config")

const appConfigSchema = z.object({
  minimumBuildNumber: z.object({
    ios: z.number(),
    android: z.number()
  }),
  urls: z
    .object({
      points: externalLinkHrefSchema.optional()
    })
    .optional(),
  flags: z.record(z.boolean()).optional()
})

/**
 * A hook that fetches the API configuration, including the default endpoint to
 * hit, etc.
 */
export function useAppConfig() {
  const { apiFetch } = useApiFetch()

  const { data, refetch } = useQuery({
    queryKey: ["appConfig"],
    queryFn: async () => {
      const response = await apiFetch("/api/mobile/settings")
      const settings = appConfigSchema.parse(await response.json())
      logger.debug("Fetched apiSettings", JSON.stringify(settings, null, 2))
      return settings
    },
    staleTime: ONE_DAY,
    gcTime: ONE_DAY
  })

  return { appConfig: data, refetch }
}
