/**
 * Logger
 */
import { logger as rnLogger } from "react-native-logs"

import { env } from "@/env"

// import { env } from "@/env"

/**
 * The default logger instance
 */
export const logger = rnLogger.createLogger<
  "debug" | "info" | "log" | "warn" | "error" | "fatal"
>({
  enabled: true, //env.EXPO_PUBLIC_APP_ENV === "development",
  severity: env.EXPO_PUBLIC_APP_ENV === "development" ? "debug" : "info",
  levels: {
    debug: 0,
    info: 1,
    log: 1,
    warn: 2,
    error: 3,
    fatal: 4
  },
  transportOptions: {
    colors: {
      debug: "blueBright",
      info: "greenBright",
      log: "greenBright",
      warn: "yellowBright",
      error: "red",
      fatal: "redBright"
    }
  }
})

/**
 * Build a new logger with a namespace to distinguish the logs
 */
export function createLogger(namespace: string) {
  return logger.extend(namespace)
}
