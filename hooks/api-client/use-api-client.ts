import { useCallback } from "react"

import { useApiErrorHandler } from "./use-api-error-handler"
import { useApiFetch } from "./use-api-fetch"

/**
 * A hook for getting an an apiFetch method with error handling
 */
export function useApiClient() {
  const { apiFetch } = useApiFetch()
  const { unauthorizedError, notFoundError, rateLimitError } =
    useApiErrorHandler()

  /**
   * A wrapper around fetch that adds additional app headers, as well as
   * adding centralized error handling (so we can log out on 401, etc)
   */
  const apiFetchWithErrorHandling = useCallback(
    async (input: string | URL | Request, init?: RequestInit) => {
      const response = await apiFetch(input, init)

      if (response.status === 401) {
        unauthorizedError()
      } else if (response.status === 404) {
        notFoundError()
      } else if (response.status === 429) {
        rateLimitError()
        // } else if (!response.ok) {
        //   handleUnknownError()
      }

      if (!response.ok) {
        throw new Error(
          `Unable to fetch ${response.url}: ${response.statusText}`
        )
      }
      return response
    },
    [apiFetch, unauthorizedError, notFoundError, rateLimitError]
  )

  return {
    fetch: apiFetchWithErrorHandling
  }
}
