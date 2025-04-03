import { default as dayjs } from "dayjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { formatTimeFromToday } from "./time-from-today"

describe("formatTimeFromToday", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs("2024-01-01").toDate())
  })

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers()
  })

  it("today", () => {
    const result = formatTimeFromToday("2024-01-01")
    expect(result).toBe("just now")
  })

  it("yesterday", () => {
    const result = formatTimeFromToday("2023-12-31")
    expect(result).toBe("yesterday")
  })

  it("returns yesterday when less than a full day ago", () => {
    vi.setSystemTime(dayjs("2024-01-16T06:00:00.000Z").toDate())
    const result = formatTimeFromToday("2024-01-15T23:59:59.000Z")
    expect(result).toBe("yesterday")
  })

  it("returns number of days if less than a week", () => {
    const result = formatTimeFromToday("2023-12-27")
    expect(result).toBe("5 days ago")
  })

  it("returns 2 days if between 1 and 2 days ago", () => {
    vi.setSystemTime(dayjs("2024-01-16T14:00:00.000Z").toDate())
    const result = formatTimeFromToday("2024-01-14T15:00:00.000Z")
    expect(result).toBe("2 days ago")
  })

  it("returns number of weeks ago if less than a month", () => {
    const result = formatTimeFromToday("2023-12-10")
    expect(result).toBe("3 weeks ago")
  })

  it("returns number of months ago if less than a year", () => {
    const result = formatTimeFromToday("2023-12-01")
    expect(result).toBe("1 month ago")
  })

  it("returns number of years ago if more than a year", () => {
    const result = formatTimeFromToday("2021-12-31")
    expect(result).toBe("2 years ago")
  })

  it("allows passing a Date object", () => {
    const result = formatTimeFromToday(new Date("2023-12-01"))
    expect(result).toBe("1 month ago")
  })

  it("allows passing a number", () => {
    const result = formatTimeFromToday(new Date("2023-12-01").getTime())
    expect(result).toBe("1 month ago")
  })
})
