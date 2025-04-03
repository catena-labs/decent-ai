import * as FileSystem from "expo-file-system"

import { RELATIVE_PATH_PREFIX } from "./constants"
import { getFileUri } from "./get-file-uri"
import { createLogger } from "../logger"

const logger = createLogger("fs:downloadFile")

/**
 * Downloads a file from the given URI to the given path relative to the document
 * directory.
 *
 * @param uri - The URI of the file to download.
 * @param filePath - The path relative to the document directory of the file to
 * download.
 * @returns The path relative to the document directory of the downloaded file,
 * prefixed with a prefix indicating that it is a relative path. If the file download
 * fails, the original URI is returned.
 */
export async function downloadFile(
  uri: string,
  filePath: string
): Promise<string> {
  const fileUri = getFileUri(filePath)
  const downloadResumable = FileSystem.createDownloadResumable(uri, fileUri)

  try {
    const result = await downloadResumable.downloadAsync()
    logger.debug(`Finished downloading ${uri} to ${result?.uri}`)

    return `${RELATIVE_PATH_PREFIX}${filePath}`
  } catch (error) {
    logger.error("Error downloading file", error)
    return uri
  }
}
