import { TestTube2 } from "lucide-react-native"
import { APIError } from "openai"
import { useCallback, useState } from "react"

import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useOpenAI } from "@/hooks/openai/use-openai"
import { useColors } from "@/hooks/use-colors"
import { createLogger } from "@/lib/logger"
import { cn } from "@/lib/utils/cn"

const logger = createLogger(
  "components:models:custom-model:custom-model-test-button"
)

type Props = {
  baseURL?: string
  modelSlug?: string
  apiKey?: string
  onTestResult: (isSuccess: boolean) => void
}

export function CustomModelTestButton({
  baseURL,
  modelSlug,
  apiKey,
  onTestResult
}: Props) {
  const colors = useColors()

  const isDisabled = !baseURL || !modelSlug
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [statusMessage, setStatusMessage] = useState("Testing your model...")

  const { openai } = useOpenAI("external", {
    apiKey,
    baseURL
  })

  const onTest = useCallback(async () => {
    if (!modelSlug) {
      return
    }
    setIsSubmitted(true)
    setStatusMessage("Testing your model...")

    logger.debug("testing against model", modelSlug)

    try {
      await openai.chat.completions
        .create({
          stream: false,
          model: modelSlug,
          messages: [
            {
              role: "system",
              content:
                "You are responding as part of an integration test. For any input, respond with the string 'pong'  without any punctuation"
            },
            {
              role: "user",
              content: "ping"
            }
          ]
        })
        .withResponse()

      setStatusMessage("Success. Your model is working as expected.")
      onTestResult(true)
    } catch (e) {
      if (e instanceof APIError) {
        if (e.status === 404) {
          setStatusMessage(`Unable to access model "${modelSlug}"`)
        } else if (e.status === 401) {
          setStatusMessage(
            "Unable to authenticate. Check your Api Key and try again"
          )
        } else {
          setStatusMessage("An error occurred while testing your model")
        }

        onTestResult(false)
        return
      }

      logger.error(e)
      setStatusMessage("An error occurred while testing your model")
      onTestResult(false)
    }
  }, [modelSlug, onTestResult, openai])

  return (
    <View className="flex flex-col gap-4">
      <Pressable
        className={cn(
          "flex h-12 flex-row items-center justify-center gap-2 rounded-md border border-input py-4",
          isDisabled ? "opacity-50" : ""
        )}
        disabled={isDisabled}
        onPress={onTest}
      >
        <TestTube2 size={16} color={colors.primary} />
        <Text
          variant="medium"
          className="h-[18px] text-[17px] leading-[19px] text-primary"
        >
          Test
        </Text>
      </Pressable>

      {isSubmitted ? (
        <View
          className="rounded-xl p-3"
          style={{
            borderRadius: 10,
            backgroundColor: colors["card-foreground"]
          }}
        >
          <Text
            className="font-mono"
            style={{
              color: colors.card
            }}
          >
            {statusMessage}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
