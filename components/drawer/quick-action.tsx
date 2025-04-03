import { type ReactNode } from "react"

import { Pressable, type PressableProps } from "../elements/pressable"
import { Text } from "../elements/text"

export type QuickActionProps = PressableProps & {
  title: string
  icon: ReactNode
}

export function QuickAction({ title, icon, ...props }: QuickActionProps) {
  return (
    <Pressable
      className="my-2 flex flex-row items-center gap-2 py-[6px]"
      {...props}
    >
      {icon}
      <Text variant="medium">{title}</Text>
    </Pressable>
  )
}
