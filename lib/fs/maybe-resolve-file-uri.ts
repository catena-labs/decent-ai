import { RELATIVE_PATH_PREFIX } from "./constants"
import { getFileUri } from "./get-file-uri"
import { isAndroid } from "../utils/platform"

/**
 * Handles resolving file URIs as a workaround to the issue described in
 * {@link https://github.com/expo/expo/issues/4261}. If the URI does not
 * correspond to a file path, it is returned as is.
 */
export function maybeResolveFileUri(uri: string) {
  if (!uri.startsWith("file:///")) {
    return uri
  }

  if (uri.startsWith(RELATIVE_PATH_PREFIX)) {
    // Replace the relative path prefix indicator with the current
    // document directory value.
    const path = uri.replace(RELATIVE_PATH_PREFIX, "")
    return getFileUri(path)
  }

  // Potentially heal files stored as full file URIs before moving
  // to relative path persistence.
  return resolveResolveAbsoluteExpoUrl(uri)
}

/**
 * Prior to moving to relative path persistence, we stored reference to full file URIs.
 * The document directory path returned by `FileSystem.documentDirectory` consistently ends
 * with `/Documents/` on iOS and `/files/` on Android. We split on these to extract the
 * relative path and resolve it to the current document directory, otherwise we return
 * the URI as is.
 */
function resolveResolveAbsoluteExpoUrl(uri: string) {
  const searchString = isAndroid ? "/files/" : "/Documents/"
  const [_, path] = uri.split(searchString)

  if (!path) {
    return uri
  }

  return getFileUri(path)
}
