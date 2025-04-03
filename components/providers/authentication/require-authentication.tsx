import { Redirect } from "expo-router"
import { type PropsWithChildren } from "react"

import { useAuthentication } from "@/hooks/use-authentication"
import { createLogger } from "@/lib/logger"

const logger = createLogger(
  "components:providers:authentication:require-authentication"
)

export function RequireAuthentication({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuthentication()

  if (!isAuthenticated) {
    logger.debug("Not authenticated, show the signin screen")
    return <Redirect href="/signin" />
  }

  // If we are fully connected, render the children
  return children
}
