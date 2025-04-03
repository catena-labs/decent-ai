import { describe, expect, it } from "vitest"

import { joinPath } from "./join-path"

describe("joinPath", () => {
  it("returns an empty string if no arguments are provided", () => {
    expect(joinPath()).toBe("")
  })

  it("returns the original string if only one argument is provided", () => {
    expect(joinPath("file:///this/is/a/test/file")).toBe(
      "file:///this/is/a/test/file"
    )
  })

  it("should join paths", () => {
    expect(joinPath("a", "b", "c")).toBe("a/b/c")
  })

  it("does not remove slashes from a single part", () => {
    expect(joinPath("/a/")).toBe("/a/")
  })

  it("does not remove leading slashes from the first part", () => {
    expect(joinPath("/a", "b", "c")).toBe("/a/b/c")
  })

  it("does not remove trailing slashes from the last part", () => {
    expect(joinPath("a", "b", "c/")).toBe("a/b/c/")
  })

  it("removes all other leading and trailing slashes", () => {
    expect(joinPath("a/", "/b/", "/c")).toBe("a/b/c")
  })
})
