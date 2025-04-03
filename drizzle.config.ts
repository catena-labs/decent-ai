import type { Config } from "drizzle-kit"

export default {
  dialect: "sqlite",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  driver: "expo"
} satisfies Config
