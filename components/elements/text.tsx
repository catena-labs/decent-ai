import { type VariantProps, cva } from "class-variance-authority"
import { type ComponentProps } from "react"
import {
  Animated,
  Text as DefaultText,
  type TextProps as DefaultTextProps
} from "react-native"

import { cn } from "@/lib/utils/cn"

const textVariants = cva(["text-base text-foreground"], {
  variants: {
    variant: {
      default: "font-sans",
      medium: "ios:font-medium font-sans-medium",
      semibold: "ios:font-semibold font-sans-semibold",
      bold: "ios:font-bold font-sans-bold",
      extrabold: "ios:font-extrabold font-sans-extrabold",
      mono: "font-mono font-normal"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

export type TextProps = DefaultTextProps & VariantProps<typeof textVariants>
export type AnimatedTextProps = ComponentProps<typeof Animated.Text> &
  VariantProps<typeof textVariants>

/**
 * A wrapper around the <Text> component which applies our basic styles,
 * considering dark mode, etc.
 */
export function Text({ variant, className, ...props }: TextProps) {
  return (
    <DefaultText
      className={cn(textVariants({ className, variant }))}
      {...props}
    />
  )
}

export function AnimatedText({
  variant,
  className,
  ...props
}: AnimatedTextProps) {
  return (
    <Animated.Text
      className={cn(textVariants({ className, variant }))}
      {...props}
    />
  )
}
