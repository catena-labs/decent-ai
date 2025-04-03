import { Check } from "lucide-react-native"

import { cn } from "@/lib/utils/cn"

import { View } from "./view"

type RadioButtonProps = {
  className?: string
  selected: boolean
}

export function RadioButton({ className, selected }: RadioButtonProps) {
  return (
    <View
      className={cn(
        "size-5 items-center justify-center rounded-full border border-primary",
        selected ? "bg-primary" : "bg-background",
        className
      )}
    >
      {selected ? (
        <Check className="text-primary-foreground" size={14} />
      ) : null}
    </View>
  )
}
