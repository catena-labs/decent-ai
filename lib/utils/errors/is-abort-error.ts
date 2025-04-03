import { APIUserAbortError } from "openai"

/**
 * Returns true if the given error is an AbortError (e.g. if a user
 * aborted the request).
 */
export function isAbortError(e: unknown) {
  return (
    (e instanceof Error && e.name === "AbortError") ||
    e instanceof APIUserAbortError
  )
}
