import { env } from "@/env"

export function apiURL(
  path: string | URL = "/",
  base: string | URL = env.EXPO_PUBLIC_API_URL
) {
  const baseUrl = new URL(base)
  const pathUrl = new URL(path, "http://example.com")

  // remove any trailing slashes from the base URL and
  // leading slashes from the path URL
  return new URL(
    `${baseUrl.href.replace(/\/$/, "")}/${pathUrl.pathname.replace(/^\//, "")}`
  )
}
