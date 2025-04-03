import { type User as GoogleUser } from "@react-native-google-signin/google-signin"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { usePostHog } from "posthog-react-native"
import { useCallback, useMemo, useState } from "react"
import { useDisconnect } from "wagmi"
import { z } from "zod"

import { useUserCreditsStore } from "@/hooks/use-user-credits"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { useAuthStore } from "@/lib/auth/auth-store"
import { getUserFromToken } from "@/lib/auth/get-user-from-token"
import { createLogger } from "@/lib/logger"
import { ONE_DAY } from "@/lib/utils/date-fns/dates"
import { apiURL } from "@/lib/utils/url-fns/api-url"

const PROVIDER_ENDPOINTS = {
  apple: "/api/mobile/auth/apple",
  google: "/api/mobile/auth/google",
  web3: "/api/mobile/auth/web3"
}

type AuthenticateParams = {
  provider: keyof typeof PROVIDER_ENDPOINTS
  credential: Record<string, unknown> | GoogleUser
}

const logger = createLogger("use-authentication")
const authSchema = z.object({
  token: z.string()
})

function useRefreshToken(): string | null {
  const token = useAuthStore((state) => state.token)
  const setToken = useAuthStore((state) => state.setToken)

  useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- We specifically do not want to trigger this query when the token changes
    queryKey: ["auth", "token"],
    queryFn: async () => {
      const response = await fetch(apiURL("/api/mobile/auth/refresh"), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const json = authSchema.parse(await response.json())
      setToken(json.token)

      return json.token
    },
    enabled: Boolean(token),
    // Refresh the token every day
    staleTime: ONE_DAY
  })

  return token
}

export function useAuthentication() {
  const posthog = usePostHog()
  const setToken = useAuthStore((state) => state.setToken)
  const reset = useAuthStore((state) => state.reset)
  const resetCredits = useUserCreditsStore((s) => s.reset)
  const queryClient = useQueryClient()
  const { disconnect } = useDisconnect()
  const token = useRefreshToken()

  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const isAuthenticated = useMemo(() => Boolean(token), [token])

  /**
   * Sign in to the app via Google, Apple, or Web3
   */
  const signIn = useCallback(
    async ({ provider, credential }: AuthenticateParams) => {
      try {
        setIsAuthenticating(true)
        const resp = await fetch(apiURL(PROVIDER_ENDPOINTS[provider]), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(credential)
        })

        const json = authSchema.parse(await resp.json())
        if (!json.token) {
          throw new Error("No token returned from server")
        }

        posthog.capture(ANALYTICS_EVENTS.USER_SIGNED_IN, {
          provider
        })

        setToken(json.token)
      } catch (e) {
        logger.warn(e)
        throw e
      } finally {
        setIsAuthenticating(false)
      }
    },
    [posthog, setToken]
  )

  /**
   * Sign out of the app
   */
  const signOut = useCallback(() => {
    posthog.reset()
    reset()
    resetCredits()
    disconnect()
    queryClient.clear()
  }, [disconnect, posthog, queryClient, reset, resetCredits])

  /**
   * The user object from the token
   */
  const user = useMemo(() => getUserFromToken(token), [token])
  const userId = useMemo(() => user?.id ?? null, [user])

  return {
    signIn,
    isAuthenticating,
    isAuthenticated,
    signOut,
    token,
    user,
    userId
  }
}
