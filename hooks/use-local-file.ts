import * as FileSystem from "expo-file-system"
import { useState } from "react"
import Toast from "react-native-toast-message"

import { createLogger } from "@/lib/logger"

const logger = createLogger("useLocalFile")

/**
 * Hook to download a file from an external URL and save it to a temporary
 * location on the device. Does nothing if the uri is already a local file.
 */
export function useLocalFile(imageUri: string) {
  const [isLoading, setIsLoading] = useState(false)

  const withLocalFile = async (
    handler: (localUri: string) => Promise<void>
  ) => {
    let localUri

    const isLocalFile = imageUri.startsWith(`${FileSystem.documentDirectory}`)
    const isDataUrl = imageUri.startsWith("data:")

    try {
      if (isLocalFile) {
        // We are already referencing an image that is persisted locally
        localUri = imageUri
      } else if (isDataUrl) {
        // Image uploads are provided as base64 encoded data URLs.
        // This is very simplistic parsing. On image uploads, we create a data
        // URL of the form `data:<mime-type>;base64,<data>`. Just extract the
        // data part.
        const imageData = imageUri.split("base64,")[1] ?? ""

        localUri = `${FileSystem.documentDirectory}image.jpg`

        setIsLoading(true)
        await FileSystem.writeAsStringAsync(localUri, imageData, {
          encoding: FileSystem.EncodingType.Base64
        })
        setIsLoading(false)
      } else {
        // We are handling a remote URL
        setIsLoading(true)
        localUri = `${FileSystem.documentDirectory}image.jpg`
        await FileSystem.downloadAsync(imageUri, localUri)
        logger.debug("Downloaded file", localUri)
        setIsLoading(false)
      }

      await handler(localUri)
    } catch (e) {
      setIsLoading(false)
      logger.error("Error downloading and sharing image", e)
      Toast.show({
        text1: "Error handling image",
        type: "error"
      })
    } finally {
      if (!isLocalFile && localUri) {
        logger.debug("Deleting tmp file", localUri)
        await FileSystem.deleteAsync(localUri)
      }
    }
  }

  return {
    isLoading,
    withLocalFile
  }
}
