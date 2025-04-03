import * as FileSystem from "expo-file-system"

import { getFileUri } from "./get-file-uri"
import { createLogger } from "../logger"

const logger = createLogger("fs:ensureDir")

/**
 * Ensures that a directory exists for the given path relative to the document
 * directory. If the directory does not exist, it is created.
 *
 * @param filePath - The path relative to the document directory of the directory
 * to create.
 */
export async function ensureDir(filePath: string) {
  const uri = getFileUri(filePath)
  const dirInfo = await FileSystem.getInfoAsync(uri)

  if (!dirInfo.exists) {
    logger.debug(`Creating directory: ${uri}`)
    await FileSystem.makeDirectoryAsync(uri, {
      intermediates: true
    })
  }
}
