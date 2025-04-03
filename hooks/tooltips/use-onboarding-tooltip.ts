import { useEffect } from "react"

import { type TooltipId } from "@/lib/tooltips/tooltips"

import { useTooltipStore } from "./use-tooltip-store"

export const useOnboardingTooltip = (id: TooltipId, condition = true) => {
  const showTooltip = useTooltipStore((s) => s.showTooltip)
  const closedTooltips = useTooltipStore((s) => s.closedTooltips)

  useEffect(() => {
    if (closedTooltips.includes(id)) {
      return
    }

    if (condition) {
      showTooltip(id)
    }
  }, [closedTooltips, condition, id, showTooltip])
}
