import * as FileSystem from "expo-file-system"

import { joinPath } from "./join-path"

/**
 * Returns the full file URI for a given file path. This utility is used to account
 * for the fact that the value of `FileSystem.documentDirectory` changes after app
 * upgrades. See the below github issue, which concludes that users of expo file system
 * should store relative URLs and append them to `FileSystem.documentDirectory` to
 * get the absolute path.
 *
 * @see https://github.com/expo/expo/issues/4261
 *
 * @param filePath - The path to the file relative to the user's document directory.
 * @returns The full file URI.
 */
export function getFileUri(filePath: string) {
  const baseDir = FileSystem.documentDirectory ?? ""
  return joinPath(baseDir, filePath)
}
