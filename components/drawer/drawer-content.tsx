import { FlashList } from "@shopify/flash-list"
import { useMemo } from "react"

import { type Conversation } from "@/drizzle/schema"
import { useConversations } from "@/hooks/conversations/use-conversations"
import { useLatestImages } from "@/hooks/images/use-latest-images"
import { isConversation } from "@/lib/conversations/is-conversation"

import { ConversationRow } from "./conversation-row"
import { DrawerFooter } from "./drawer-footer"
import { ImageGalleryRow } from "./image-gallery-row"
import { QuickActions } from "./quick-actions"
import { SectionTitle } from "./section-title"
import { Separator } from "../elements/separator"
import { View } from "../elements/view"

type DrawerSection =
  | "section-new"
  | "section-quick-actions"
  | "section-history"
  | "section-image-gallery"

type DrawerItem = DrawerSection | Conversation

export function DrawerContent() {
  const { data: conversations } = useConversations()

  const { data: latestImages } = useLatestImages()

  const sections = useMemo(() => {
    const list: DrawerItem[] = ["section-new", "section-quick-actions"]

    if ((conversations?.length ?? 0) || latestImages?.length) {
      list.push("section-history")
    }

    if (latestImages?.length) {
      list.push("section-image-gallery")
    }

    if (conversations?.length) {
      list.push(...conversations)
    }

    return list
  }, [conversations, latestImages?.length])

  return (
    <View className="flex-1 justify-between gap-4 bg-background" safeArea>
      <View className="grow">
        <View className="flex-1">
          <FlashList
            contentContainerStyle={{
              paddingHorizontal: 16
            }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            data={sections}
            getItemType={(item) => {
              if (typeof item === "string") {
                if (item.startsWith("section-")) {
                  return "section-title"
                }

                return item
              }

              return "conversation"
            }}
            keyExtractor={(item) => {
              if (typeof item === "string") {
                return item
              } else if (isConversation(item)) {
                return `conversation-${item.id}`
              }
              const unhandledItem: never = item
              throw new Error(
                `Unhandled item type: ${JSON.stringify(unhandledItem)}`
              )
            }}
            estimatedItemSize={128}
            renderItem={({ item }) => {
              if (typeof item === "string") {
                switch (item) {
                  case "section-quick-actions":
                    return <QuickActions />
                  case "section-new":
                    return <SectionTitle title="New" />
                  case "section-history":
                    return <SectionTitle title="History" />
                  case "section-image-gallery":
                    return <ImageGalleryRow latestImages={latestImages ?? []} />
                  default:
                    throw new Error(
                      `Unhandled item type in renderItem: ${JSON.stringify(item)}`
                    )
                }
              }
              return <ConversationRow conversation={item} />
            }}
          />
        </View>
      </View>

      {/* Footer (user account) */}
      <Separator className="bg-border" />
      <DrawerFooter />
    </View>
  )
}
