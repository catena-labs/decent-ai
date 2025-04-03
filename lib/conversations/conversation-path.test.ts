import { describe, expect, it } from "vitest"

import { conversationPath, conversationsPath } from "./conversation-path"

describe("conversationsPath", () => {
  it("throws if userId is not provided", () => {
    expect(() => conversationsPath("")).toThrow("userId is required")
  })

  it("returns the correct directory name", () => {
    const result = conversationsPath("userId")
    expect(result).toEqual("userId/conversations")
  })
})

describe("conversationPath", () => {
  it("throws if userId is not provided", () => {
    expect(() => conversationPath("", "conversationId")).toThrow(
      "userId and conversationId are required"
    )
  })

  it("throws if conversationId is not provided", () => {
    expect(() => conversationPath("userId", "")).toThrow(
      "userId and conversationId are required"
    )
  })

  it("returns the correct directory name", () => {
    const result = conversationPath("userId", "conversationId")
    expect(result).toEqual("userId/conversations/conversationId")
  })
})
