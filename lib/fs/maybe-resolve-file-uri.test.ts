import { describe, expect, it, vi } from "vitest"

import { RELATIVE_PATH_PREFIX } from "./constants"
import { maybeResolveFileUri } from "./maybe-resolve-file-uri"

const DOCUMENT_DIRECTORY = "file:///documents/"

vi.mock("./get-file-uri", () => ({
  getFileUri: vi
    .fn()
    .mockImplementation((path: string) => `${DOCUMENT_DIRECTORY}${path}`)
}))

vi.mock("../utils/platform", () => ({
  isAndroid: false
}))

describe("maybeResolveFileUri", () => {
  it("returns original uri if it is not a file uri", () => {
    const uri = "https://example.com/image.png"
    const resolvedUri = maybeResolveFileUri(uri)
    expect(resolvedUri).toBe(uri)
  })

  it("returns original uri if relative path prefix or '/Documents/' not present", () => {
    const uri = "file:///Users/john/test/fold/test.png"
    const resolvedUri = maybeResolveFileUri(uri)
    expect(resolvedUri).toBe(uri)
  })

  it("returns resolved uri if '/Documents/' is present", () => {
    const uri = "file:///Users/john/Documents/the/rest/of/the/path/test.png"
    const resolvedUri = maybeResolveFileUri(uri)
    expect(resolvedUri).toBe(
      `${DOCUMENT_DIRECTORY}the/rest/of/the/path/test.png`
    )
  })

  it("returns resolved uri if relative path prefix is present", () => {
    const uri = `${RELATIVE_PATH_PREFIX}the/rest/of/the/path/test.png`
    const resolvedUri = maybeResolveFileUri(uri)
    expect(resolvedUri).toBe(
      `${DOCUMENT_DIRECTORY}the/rest/of/the/path/test.png`
    )
  })
})
