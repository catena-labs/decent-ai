import { createLogger } from "@/lib/logger"

import { env } from "./env"

const logger = createLogger("env")

export function printEnv() {
  logger.debug("-----------")
  logger.debug(`APP_ENV:                  ${env.EXPO_PUBLIC_APP_ENV}`)
  logger.debug(`API_URL:                  ${env.EXPO_PUBLIC_API_URL}`)
  logger.debug(
    `WALLETCONNECT_PROJECT_ID: ${process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID}`
  )
  logger.debug("-----------")
}
