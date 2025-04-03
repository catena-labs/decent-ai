import { z } from "zod"

import type { jsonSchema } from "./json-schema"

/**
 * This schema parses a JSON string and returns the parsed JSON.
 * If the string is not valid JSON, a zod error is thrown.
 *
 * From: https://github.com/colinhacks/zod/discussions/2215#discussioncomment-5356286
 *
 * @example
 * ```
 * const json = stringToJSONSchema.parse(`{"foo": "bar"}`)
 *  => { foo: "bar" }
 * ```
 */
export const stringToJSONSchema = z
  .string()
  .transform((str, ctx): z.infer<typeof jsonSchema> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- this is supposed to be unknown
      return JSON.parse(str)
    } catch (e) {
      ctx.addIssue({ code: "custom", message: "Invalid JSON" })
      return z.NEVER
    }
  })
