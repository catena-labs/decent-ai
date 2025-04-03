import {
  type Availability,
  type InputModality,
  type Model,
  type OutputModality,
  type Router
} from "./models"
import {
  type ConversationMode,
  isImageGenMode,
  isVisionMode
} from "../conversations/conversation-modes"

export type ModelAttributeFilters = {
  availability?: Availability
  inputModality?: InputModality
  outputModality?: OutputModality
}

export function isModelMatch<T extends Model | Router>(
  model: T,
  { availability, inputModality, outputModality }: ModelAttributeFilters
): boolean {
  if (availability && model.availability !== availability) {
    return false
  }

  if (inputModality && !model.inputModality?.includes(inputModality)) {
    return false
  }

  // Temporary: assume models with no outputModality support text output
  const outputModalities = model.outputModality ?? ["text"]
  if (outputModality && !outputModalities.includes(outputModality)) {
    return false
  }

  return true
}

export function filterModelList<T extends Model | Router>(
  list: T[],
  filters: ModelAttributeFilters = {}
): T[] {
  return list.filter((model) => isModelMatch(model, filters))
}

export function filterModelsForMode<T extends Model | Router>(
  list: T[],
  mode?: ConversationMode | null
): T[] {
  return filterModelList(list, {
    // For vision, we want to restrict to models that accept images
    inputModality: isVisionMode(mode) ? "image" : undefined,
    // Image output models should not be used in chat mode
    outputModality: isImageGenMode(mode) ? "image" : "text"
  })
}
