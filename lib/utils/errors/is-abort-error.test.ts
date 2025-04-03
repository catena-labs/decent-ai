import { APIUserAbortError } from "openai"
import { describe, expect, it } from "vitest"

import { isAbortError } from "./is-abort-error"

describe("isAbortError", () => {
  it("returns true for AbortError instances", () => {
    const abortError = new DOMException("Aborted", "AbortError")
    expect(isAbortError(abortError)).toBe(true)
  })

  it("returns false for non-AbortError instances", () => {
    const error = new Error("Some other error")
    expect(isAbortError(error)).toBe(false)
  })

  it("returns false for non-error objects", () => {
    const notAnError = { message: "Not an error" }
    expect(isAbortError(notAnError)).toBe(false)
  })

  it("returns true for openAI abort errors", () => {
    const error = new APIUserAbortError()
    expect(isAbortError(error)).toBe(true)
  })
})
