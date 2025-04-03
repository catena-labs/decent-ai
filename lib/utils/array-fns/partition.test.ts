import { describe, expect, it } from "vitest"

import { partition } from "./partition"

describe("partition", () => {
  it("returns two empty arrays when the input array is empty", () => {
    const result = partition([], () => true)
    expect(result).toEqual([[], []])
  })

  it("partitions based on a predicate", () => {
    const [evens, odds] = partition([1, 2, 3, 4, 5, 6], (n) => n % 2 === 0)
    expect(evens).toEqual([2, 4, 6])
    expect(odds).toEqual([1, 3, 5])
  })

  it("returns an empty failed array when all pass", () => {
    const [evens, odds] = partition([2, 4, 6], (n) => n % 2 === 0)
    expect(evens).toEqual([2, 4, 6])
    expect(odds).toEqual([])
  })

  it("returns an empty passed array when all fail", () => {
    const [evens, odds] = partition([1, 3, 5], (n) => n % 2 === 0)
    expect(evens).toEqual([])
    expect(odds).toEqual([1, 3, 5])
  })
})
