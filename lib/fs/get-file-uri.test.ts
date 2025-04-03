import { describe, expect, it, vi } from "vitest"

import { getFileUri } from "./get-file-uri"

const DOCUMENT_DIRECTORY = "file:///documents/"

vi.mock("expo-file-system", () => ({
  documentDirectory: "file:///documents/"
}))

describe("getAbsolutePath", () => {
  it("returns path appended to documentDirectory", () => {
    const result = getFileUri("path/to/file")
    expect(result).toBe(`${DOCUMENT_DIRECTORY}path/to/file`)
  })

  it("returns document directory if path is empty", () => {
    expect(getFileUri("")).toBe(DOCUMENT_DIRECTORY)
  })

  it("handles leading slashes", () => {
    expect(getFileUri("/path/to/file")).toBe(
      `${DOCUMENT_DIRECTORY}path/to/file`
    )
  })
})
