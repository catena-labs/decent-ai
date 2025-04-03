import { describe, expect, it } from "vitest"

import { calculateCallsRemaining } from "./calculate-calls-remaining"

describe("calculateCallsRemaining", () => {
  it("returns zero calls for zero credits", () => {
    expect(calculateCallsRemaining(0, 100)).toBe(0)
  })

  it("uses default cost if none is provided", () => {
    expect(calculateCallsRemaining(100)).toBe(10)
  })

  it("uses provided cost if it is provided", () => {
    expect(calculateCallsRemaining(100, 20)).toBe(5)
  })

  it("rounds down to the nearest integer", () => {
    expect(calculateCallsRemaining(100, 33)).toBe(3)
  })
})
