import { resolve } from "node:path"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./")
    }
  },
  test: {
    env: loadEnv(mode, process.cwd(), ""),
    watch: false
  }
}))
