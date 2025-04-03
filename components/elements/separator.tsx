import { cn } from "@/lib/utils/cn"

import { View, type ViewProps } from "./view"

type SeparatorProps = ViewProps

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <View
      className={cn("h-px bg-background-highlight", className)}
      {...props}
    />
  )
}
