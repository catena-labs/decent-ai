import { useCallback } from "react"

import { apiURL } from "@/lib/utils/url-fns/api-url"

import { useApiHeaders } from "./use-api-headers"
import { useUserCreditsStore } from "../use-user-credits"

/**
 * A hook to get a `fetch` method for the API, including all
 * required API headers. This does not include any error handling
 *
 * You likely want to use `useApiClient` instead, which includes
 * error handling.
 */
export function useApiFetch() {
  const { apiHeaders } = useApiHeaders()
  const setUserCreditsFromResponse = useUserCreditsStore(
    (s) => s.setUserCreditsFromResponse
  )

  /**
   * A wrapper around fetch that adds additional app headers, without
   * performing any response or error handling.
   */
  const apiFetch = useCallback(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === "string" && !input.startsWith("http")
          ? apiURL(input)
          : input

      const result = await fetch(url, {
        ...init,
        headers: {
          ...apiHeaders,
          ...init?.headers
        }
      })

      setUserCreditsFromResponse(result)
      return result
    },
    [apiHeaders, setUserCreditsFromResponse]
  )

  return {
    apiFetch
  }
}
