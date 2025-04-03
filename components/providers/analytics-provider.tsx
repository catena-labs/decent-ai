import { usePostHog } from "posthog-react-native"
import { type PropsWithChildren, useEffect } from "react"

import { useAuthentication } from "@/hooks/use-authentication"

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const posthog = usePostHog()
  const { user } = useAuthentication()

  /**
   * Whenever the user object changes, identify the user in PostHog
   */
  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        name: user.name,
        email: user.email
      })
    }
  }, [posthog, user])

  return <>{children}</>
}
