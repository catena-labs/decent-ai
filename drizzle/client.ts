import { drizzle } from "drizzle-orm/expo-sqlite"
import { openDatabaseSync } from "expo-sqlite/next"

const DATABASE_NAME = "decent.01.db"

const expo = openDatabaseSync(DATABASE_NAME)

export const db = drizzle(expo, { logger: true })
