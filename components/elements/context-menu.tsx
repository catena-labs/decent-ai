import { type PropsWithChildren } from "react"
import { type SFSymbol } from "sf-symbols-typescript"
import * as ContextMenuDefault from "zeego/context-menu"

type ContextMenuIcon =
  | "bookmark"
  | "bookmarkFill"
  | "copy"
  | "delete"
  | "edit"
  | "refresh"
  | "thumbsDown"
  | "thumbsUp"

/**
 * @see {@link https://hotpot.ai/free-icons}
 */
const ICON_NAME_TO_IOS_SYMBOL: Record<ContextMenuIcon, SFSymbol> = {
  bookmark: "bookmark",
  bookmarkFill: "bookmark.fill",
  copy: "doc.on.doc",
  delete: "trash",
  edit: "pencil",
  refresh: "arrow.clockwise",
  thumbsDown: "hand.thumbsdown",
  thumbsUp: "hand.thumbsup"
}

export type ContextMenuItem = {
  id: string
  label: string
  onPress: () => void
  icon?: ContextMenuIcon
}

export type ContextMenuProps = PropsWithChildren<{
  items: ContextMenuItem[]
}>

/**
 * Utility component for limiting some of the boilerplate involved in using the
 * underlying context menu library.
 */
export function ContextMenu({ children, items }: ContextMenuProps) {
  return (
    <ContextMenuDefault.Root>
      <ContextMenuDefault.Trigger>
        <>{children}</>
      </ContextMenuDefault.Trigger>

      <ContextMenuDefault.Content>
        {items.map((item) => (
          <ContextMenuDefault.Item key={item.id} onSelect={item.onPress}>
            <ContextMenuDefault.ItemTitle>
              {item.label}
            </ContextMenuDefault.ItemTitle>
            {item.icon ? (
              <ContextMenuDefault.ItemIcon
                // @ts-expect-error -- need to figure out why the type isn't right here.
                ios={{ name: ICON_NAME_TO_IOS_SYMBOL[item.icon] }}
              />
            ) : null}
          </ContextMenuDefault.Item>
        ))}
      </ContextMenuDefault.Content>
    </ContextMenuDefault.Root>
  )
}
