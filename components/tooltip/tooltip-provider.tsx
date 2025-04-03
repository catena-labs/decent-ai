import { type PropsWithChildren, useMemo } from "react"

import { useTooltipStore } from "@/hooks/tooltips/use-tooltip-store"
import { TOOLTIPS } from "@/lib/tooltips/tooltips"
import { isAndroid } from "@/lib/utils/platform"

import { Tooltip } from "./tooltip"

export function TooltipProvider({ children }: Readonly<PropsWithChildren>) {
  const { activeTooltip, closeTooltip } = useTooltipStore()

  const tooltip = useMemo(() => {
    if (isAndroid) {
      return undefined
    }

    return TOOLTIPS.find((t) => t.id === activeTooltip)
  }, [activeTooltip])

  return (
    <>
      {children}

      {tooltip ? (
        <Tooltip
          title={tooltip.title}
          description={tooltip.description}
          arrowPosition={tooltip.arrowPosition}
          style={tooltip.position}
          onClose={() => {
            closeTooltip(tooltip.id)
          }}
        />
      ) : null}
    </>
  )
}
