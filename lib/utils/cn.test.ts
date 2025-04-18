import { describe, expect, test } from "vitest"

import { cn } from "./cn"

describe("cls", () => {
  test("merges class names", () => {
    // eslint-disable-next-line tailwindcss/no-custom-classname
    const result = cn("foo", "bar")
    expect(result).toBe("foo bar")
  })

  test("removes conflicting tailwind classes", () => {
    // eslint-disable-next-line tailwindcss/no-contradicting-classname
    const result = cn("p-4", "p-6")
    expect(result).toBe("p-6")
  })
})
