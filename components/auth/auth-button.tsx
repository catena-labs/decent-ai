import { type ReactNode } from "react"

import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { Pressable, type PressableProps } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { cn } from "@/lib/utils/cn"

export type AuthButtonProps = PressableProps & {
  icon?: ReactNode
  title: ReactNode
  isAuthenticating?: boolean
}
export function AuthButton({
  icon = null,
  title,
  isAuthenticating,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <Pressable
      className={cn(
        "h-[56px] w-full flex-row items-center justify-center gap-3 rounded-[15px] border border-border bg-card active:opacity-50",
        className
      )}
      {...props}
    >
      {isAuthenticating ? (
        <ActivityIndicator size={24} />
      ) : typeof icon === "string" ? (
        <Text className="text-xl">{icon}</Text>
      ) : (
        icon
      )}

      {typeof title === "string" ? (
        <Text className="text-[20px]">{title}</Text>
      ) : (
        title
      )}
    </Pressable>
  )
}
