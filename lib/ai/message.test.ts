import { describe, expect, test } from "vitest"

import {
  type Message,
  convertMessageToChatCompletionMessageParam,
  messageSchema
} from "./message"

function buildMessage(params: Partial<Message>): Message {
  return messageSchema.parse(params)
}

describe("convertMessageToChatCompletionMessageParam()", () => {
  test("converts user message with text content correctly", () => {
    const message = buildMessage({
      role: "user",
      content: "Hello, how are you?"
    })

    const result = convertMessageToChatCompletionMessageParam(message)

    expect(result).toEqual({
      role: "user",
      content: "Hello, how are you?"
    })
  })

  test("converts assistant message with text content correctly", () => {
    const message = buildMessage({
      role: "assistant",
      content: "I am doing well, thank you for asking."
    })

    const result = convertMessageToChatCompletionMessageParam(message)

    expect(result).toEqual({
      role: "assistant",
      content: "I am doing well, thank you for asking."
    })
  })

  test("converts user message with image URLs correctly", () => {
    const message = buildMessage({
      role: "user",
      content: "Here is an image",
      imageUrls: ["https://example.com/image.jpg"]
    })

    const result = convertMessageToChatCompletionMessageParam(message)

    expect(result).toEqual({
      role: "user",
      content: [
        {
          type: "text",
          text: "Here is an image"
        },
        {
          type: "image_url",
          image_url: {
            url: "https://example.com/image.jpg"
          }
        }
      ]
    })
  })
})
