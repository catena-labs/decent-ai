import { useCallback } from "react"

import { type Conversation } from "@/drizzle/schema"

import { useUpdateConversation } from "./use-update-conversation"

type ToolType = "image_gen" | "search_web"

const toolTypeToTools: Record<ToolType, string[]> = {
  image_gen: ["create_image"],
  // Web search actually corresponds to various tools under the hood
  search_web: ["get_weather", "search_news", "search_web"]
}

export function useConversationTools(conversation?: Conversation) {
  const { mutate: updateConversation } = useUpdateConversation(conversation?.id)

  const isToolEnabled = useCallback(
    (toolType: ToolType) => {
      if (!conversation?.excludeTools) {
        return true
      }

      const tools = toolTypeToTools[toolType]
      return !conversation.excludeTools.some((t) => tools.includes(t))
    },
    [conversation?.excludeTools]
  )

  const toggleTool = useCallback(
    (toolType: ToolType) => {
      if (!conversation) {
        return
      }

      const isEnabled = isToolEnabled(toolType)
      const tools = toolTypeToTools[toolType]

      // Exclude the tools if they're currently enabled, otherwise remove the excluded tools we are toggling
      updateConversation({
        excludeTools: isEnabled
          ? [...(conversation.excludeTools ?? []), ...tools]
          : conversation.excludeTools?.filter((t) => !tools.includes(t))
      })
    },
    [conversation, isToolEnabled, updateConversation]
  )

  return {
    isToolEnabled,
    toggleTool
  }
}
