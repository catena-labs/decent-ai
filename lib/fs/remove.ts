import * as FileSystem from "expo-file-system"

import { getFileUri } from "./get-file-uri"
import { maybeResolveFileUri } from "./maybe-resolve-file-uri"
import { createLogger } from "../logger"

const logger = createLogger("fs:remove")

/**
 * Removes a file or directory from the local file system, silently doing
 * nothing if the file or directory does not exist.
 *
 * @param filePath - The path to the file - either provided as a relative path
 * to the document directory or as a full file URI.
 */
export async function remove(filePath: string) {
  const uri = filePath.startsWith("file:///")
    ? maybeResolveFileUri(filePath)
    : getFileUri(filePath)

  logger.debug(`Removing: ${uri}`)
  try {
    await FileSystem.deleteAsync(uri, { idempotent: false })
  } catch (error) {
    logger.info(`No file or directory found at ${uri}`)
  }
}
