import { type ClientOptions, OpenAI } from "openai"
import { useMemo } from "react"

import { apiURL } from "@/lib/utils/url-fns/api-url"

import { defaultApiHeaders } from "../api-client/use-api-headers"
import { useAuthentication } from "../use-authentication"
import { useUserCreditsStore } from "../use-user-credits"

type HookMode = "internal" | "external"

/**
 * A hook to get an instance of an OpenAI client suitable to
 * be used with hooks such as useGenerateImage and useChatCompletion
 */
export function useOpenAI(mode: HookMode, opts: ClientOptions = {}) {
  const { token } = useAuthentication()
  const setUserCreditsFromResponse = useUserCreditsStore(
    (s) => s.setUserCreditsFromResponse
  )

  const defaultOptions = useMemo(
    () =>
      mode === "internal"
        ? {
            apiKey: opts.apiKey ?? token ?? "",
            baseURL: opts.baseURL ?? apiURL("/api/decent").toString(),
            defaultHeaders: {
              ...defaultApiHeaders,
              "x-compatibility": "openai",
              ...opts.defaultHeaders
            }
          }
        : {},
    [mode, opts, token]
  )

  const openai = useMemo(() => {
    return new OpenAI({
      ...opts,
      ...defaultOptions,
      dangerouslyAllowBrowser: true,
      fetch: async (input, init) => {
        const result = await fetch(input, {
          ...init,
          // @ts-expect-error -- this actually exists
          reactNative: { textStreaming: true }
        })
        setUserCreditsFromResponse(result)

        return result
      }
    })
  }, [defaultOptions, opts, setUserCreditsFromResponse])

  return {
    openai
  }
}
