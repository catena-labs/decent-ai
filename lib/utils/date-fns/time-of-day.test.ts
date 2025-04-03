import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getTimeOfDay } from "./time-of-day"

describe("getTimeFromToday", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should return 'morning' if the time is between 6am and 12pm", () => {
    vi.setSystemTime(new Date("2024-01-01T06:00:00"))
    expect(getTimeOfDay()).toBe("morning")
  })

  it("should return 'afternoon' if the time is between 12pm and 6pm", () => {
    vi.setSystemTime(new Date("2024-01-01T12:00:00"))
    expect(getTimeOfDay()).toBe("afternoon")
  })

  it("should return 'evening' if the time is between 6pm and 12am", () => {
    vi.setSystemTime(new Date("2024-01-01T18:00:00"))
    expect(getTimeOfDay()).toBe("evening")
  })

  it("should return 'night' if the time is between 12am and 6am", () => {
    vi.setSystemTime(new Date("2024-01-01T00:00:00"))
    expect(getTimeOfDay()).toBe("night")
  })
})
