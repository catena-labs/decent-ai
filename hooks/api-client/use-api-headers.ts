import { useMemo } from "react"

import { appBuildVersion, appVersion } from "@/lib/constants"

import { useAuthentication } from "../use-authentication"

export const defaultApiHeaders = {
  "x-app-version": appVersion,
  "x-app-build": appBuildVersion
}

export function useApiHeaders() {
  const { token } = useAuthentication()

  const apiHeaders = useMemo(() => {
    const headers: Record<string, string> = { ...defaultApiHeaders }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }, [token])

  return {
    apiHeaders
  }
}
