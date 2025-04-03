// A fallback cost to use if we have not configured a cost for a model,
// or are missing model metadata for the model.
const DEFAULT_CREDIT_COST = 10

export function calculateCallsRemaining(
  userCredits: number,
  creditCost?: number
) {
  const resolvedCost = creditCost ?? DEFAULT_CREDIT_COST
  return Math.floor(userCredits / resolvedCost)
}
