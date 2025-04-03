import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "EXPO_PUBLIC_",

  client: {
    EXPO_PUBLIC_APP_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    EXPO_PUBLIC_APP_VARIANT: z
      .enum(["development", "preview", "staging", "production"])
      .default("development"),

    // Api Host
    EXPO_PUBLIC_API_URL: z.string().url(),

    // WalletConnect
    EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string(),

    // Google auth
    EXPO_PUBLIC_AUTH_GOOGLE_IOS_ID: z.string(),
    EXPO_PUBLIC_AUTH_GOOGLE_WEB_ID: z.string(),

    // PostHog
    EXPO_PUBLIC_POSTHOG_API_KEY: z.string().optional(),

    // Sentry
    EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),

    // RevenueCat
    EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY: z.string(),
    EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY: z.string()
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnvStrict: {
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
    EXPO_PUBLIC_APP_VARIANT: process.env.EXPO_PUBLIC_APP_ENV,

    // Api Host
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,

    // WalletConnect
    EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID,

    // Google Auth
    EXPO_PUBLIC_AUTH_GOOGLE_IOS_ID: process.env.EXPO_PUBLIC_AUTH_GOOGLE_IOS_ID,
    EXPO_PUBLIC_AUTH_GOOGLE_WEB_ID: process.env.EXPO_PUBLIC_AUTH_GOOGLE_WEB_ID,

    // PostHog
    EXPO_PUBLIC_POSTHOG_API_KEY: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,

    // Sentry
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,

    // RevenueCat
    EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY:
      process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
    EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY:
      process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY
  },

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true
})
