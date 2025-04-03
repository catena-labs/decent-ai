import { z } from "zod"

import { createLogger } from "@/lib/logger"
import { apiURL } from "@/lib/utils/url-fns/api-url"

const logger = createLogger("lib:auth:web3-auth:get-signing-message")

const messageSchema = z.object({
  message: z.string()
})

/**
 * Fetches a wallet signing message from the server.
 */
export async function getSigningMessage(address: string) {
  try {
    const url = apiURL("/api/mobile/auth/web3")
    url.searchParams.set("address", address)

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Unable to get signing message: ${response.statusText}`)
    }

    const json = messageSchema.parse(await response.json())

    if (!json.message) {
      throw new Error(`Unable to get signing message: ${response.statusText}`)
    }

    return json.message
  } catch (e) {
    logger.warn("Unable to get signing message", e)

    // return the default message:
    return `
Sign in to DecentAI

Address: ${address}
Timestamp: ${Date.now().toString()}
`
  }
}
