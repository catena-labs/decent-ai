import { z } from "zod"

const inputModalitySchema = z.enum(["text", "image", "audio", "video"])
export type InputModality = z.infer<typeof inputModalitySchema>
const outputModalitySchema = z.enum(["text", "image", "audio", "video"])
export type OutputModality = z.infer<typeof outputModalitySchema>
const availabilitySchema = z.enum(["free", "subscription"])
export type Availability = z.infer<typeof availabilitySchema>

/**
 * Model types
 */
export const modelSlugSchema = z.string()
export type ModelSlug = z.infer<typeof modelSlugSchema>
export const modelSchema = z.object({
  slug: modelSlugSchema,
  name: z.string(),
  creditCost: z.number().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  inputModality: inputModalitySchema.array().optional(),
  outputModality: outputModalitySchema.array().optional(),
  availability: availabilitySchema.optional().default("subscription"),
  endpoint: z
    .object({
      baseURL: z.string().url(),
      apiKey: z.string().optional()
    })
    .optional(),
  supportsTools: z.boolean().optional()
})
export type Model = Omit<z.infer<typeof modelSchema>, "slug"> & {
  slug: ModelSlug
}

/**
 * Router types
 */
export const routerSlugSchema = z.string().startsWith("router:")
// This type is a subset of the ModelSlug type
export type RouterSlug = `router:${string}`
export const routerSchema = modelSchema.omit({ slug: true }).extend({
  slug: routerSlugSchema
})
export type Router = Omit<Model, "slug"> & { slug: RouterSlug }

export function isRouter(model: Model | Router): model is Router {
  return model.slug.startsWith("router:")
}

/**
 * The default "DecentAI" router configuration
 */
export const DEFAULT_ROUTER: Router = {
  name: "Pick for me",
  description:
    "This model mix only contains open source models with permissive licenses and published weights. Recommended mix for protecting your data and privacy.",
  slug: "router:open-source-only-chat",
  availability: "free"
}

export function isCustomModel(model: Model | Router): boolean {
  return Boolean(model.endpoint)
}
