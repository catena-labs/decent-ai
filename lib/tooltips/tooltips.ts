export type ArrowPosition =
  | "top-left"
  | "top-center"
  | "top-center-right"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export type TooltipId =
  | "explore-models"
  | "add-custom-model"
  | "add-custom-instructions"

type TooltipInfo = {
  id: TooltipId
  position: { top: number } | { bottom: number }
  arrowPosition: ArrowPosition
  title: string
  description: string
}

export const TOOLTIPS: TooltipInfo[] = [
  {
    id: "explore-models",
    position: { top: 100 },
    arrowPosition: "top-center",
    title: "Explore models",
    description:
      "Pick a model mix or select from the latest open source AI models in Decent."
  },
  {
    id: "add-custom-model",
    position: { bottom: 220 },
    arrowPosition: "top-center-right",
    title: "Add your own custom model",
    description:
      "Connect to any LLM from any provider and have full control over your AI chat experience."
  },
  {
    id: "add-custom-instructions",
    position: { top: 100 },
    arrowPosition: "top-right",
    title: "Add custom instructions",
    description:
      "Customize Decent’s behavior, personality, and tone with custom instructions."
  }
]
