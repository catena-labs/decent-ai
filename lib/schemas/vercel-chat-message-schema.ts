import { z } from "zod"

import { jsonSchema } from "./json-schema"

export const vercelChatMessageSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date().optional(),
  content: z.string(),
  data: jsonSchema.optional(),
  role: z.enum(["system", "user", "assistant", "function", "data", "tool"])
})
