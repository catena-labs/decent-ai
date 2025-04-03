export type ModelAndProvider = {
  model: string
  provider?: string
}

export function getModelAndProviderFromCompositeSlug(
  compositeSlug: string
): ModelAndProvider {
  // If provided a router slug, return the full slug as the model slug.
  if (compositeSlug.startsWith("router:")) {
    return {
      model: compositeSlug
    }
  }

  const parts = compositeSlug.split(":", 2)

  // If we have both parts, then we have a provider and a model
  // NOTE: We have to check for parts[1] because checking length does not
  // satisfy the typescript compiler.
  if (parts[1]) {
    return {
      provider: parts[0],
      model: parts[1]
    }
  }

  return {
    model: compositeSlug
  }
}

export function getCompositeSlug(model: string, provider: string) {
  return `${provider}:${model}`
}

/**
 * Helper method to extract model and provider from the response header.
 *
 * The responser header will either specify the specific model executed
 * in the format `provider:model` or it will specify a router slug for the
 * router executed. Which is returned depends on whether we ultimately want
 * to display to the user which model was used, or the overall router that
 * was executed.
 */
export function getModelAndProviderFromResponse(
  response?: Response
): ModelAndProvider | undefined {
  const compositeSlug = response?.headers.get("X-Decent-Model")

  if (compositeSlug) {
    return getModelAndProviderFromCompositeSlug(compositeSlug)
  }
}
