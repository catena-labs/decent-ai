import { type VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"

import { View, type ViewProps } from "../elements/view"

const variants = cva(
  "size-0 border-x-[10px] border-b-[10px] border-solid border-x-transparent border-b-foreground",
  {
    variants: {
      position: {
        "top-left": "ml-2 self-start",
        "top-center": "self-center",
        "top-center-right": "ml-[50%] self-center",
        "top-right": "mr-2 self-end",
        "bottom-left": "ml-2 rotate-180 self-start",
        "bottom-center": "rotate-180 self-center",
        "bottom-right": "mr-2 rotate-180 self-end"
      }
    },
    defaultVariants: {
      position: "top-center"
    }
  }
)

type TooltipArrowProps = ViewProps & VariantProps<typeof variants>

export function TooltipArrow({
  position,
  className,
  ...props
}: TooltipArrowProps) {
  return <View className={cn(variants({ className, position }))} {...props} />
}
