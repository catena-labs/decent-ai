import { createId } from "@paralleldrive/cuid2"
import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { type ConversationMode } from "@/lib/conversations/conversation-modes"

export const conversationsTable = sqliteTable(
  "conversations",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    name: text("name"),
    bookmarked: integer("bookmarked", { mode: "boolean" }).default(false),
    mode: text("mode").default("chat"),
    modelSlug: text("model_slug"),
    systemPrompt: text("system_prompt"),
    excludeTools: text("exclude_tools", { mode: "json" }).$type<string[]>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("last_message_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdateFn(() => new Date())
  },
  (table) => {
    return {
      userIdIdx: index("idx_conversations_user_id").on(table.userId)
    }
  }
)

export const newConversationSchema = createInsertSchema(conversationsTable, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  excludeTools: z.array(z.string()).nullable()
})
export type NewConversation = z.infer<typeof newConversationSchema>

export const conversationSchema = createSelectSchema(conversationsTable, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  excludeTools: z.array(z.string()).nullable(),
  mode: z.string().refine((mode): mode is ConversationMode => true)
})
export type Conversation = z.infer<typeof conversationSchema>

export const messagesTable = sqliteTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationsTable.id),
    role: text("role").notNull(),
    content: text("content").notNull(),
    data: text("data", { mode: "json" }),
    model: text("model"),
    provider: text("provider"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("last_message_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdateFn(() => new Date())
  },
  (table) => {
    return {
      conversationIdIdx: index("idx_messages_conversation_id").on(
        table.conversationId
      )
    }
  }
)

export type NewConversationMessage = typeof messagesTable.$inferInsert
export const newConversationMessageSchema = createInsertSchema(messagesTable, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})
export type ConversationMessage = typeof messagesTable.$inferSelect
export const conversationMessageSchema = createSelectSchema(messagesTable, {
  data: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const imagesTable = sqliteTable(
  "images",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    generationId: text("generation_id").notNull(),
    uri: text("uri").notNull(),
    prompt: text("prompt").notNull(),
    modelSlug: text("model_slug").notNull(),
    model: text("model"),
    provider: text("provider"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdateFn(() => new Date())
  },
  (table) => {
    return {
      userIdIdx: index("idx_images_user_id").on(table.userId)
    }
  }
)

// Maybe rename this to UserImage
export type NewUserImage = typeof imagesTable.$inferInsert
export const newImageSchema = createInsertSchema(imagesTable, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export type UserImage = typeof imagesTable.$inferSelect
export const imageSchema = createSelectSchema(imagesTable, {
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})
