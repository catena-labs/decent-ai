import * as ImagePicker from "expo-image-picker"
import { useCallback } from "react"
import { Alert, Linking } from "react-native"

type CameraPermissions = {
  granted: boolean
  requestPermissions: () => Promise<void>
}

export function useCameraPermissions(): CameraPermissions {
  const [status, requestPermissionDefault] = ImagePicker.useCameraPermissions()

  const requestPermissions = useCallback(async () => {
    if (!status || status.granted) {
      return
    }

    if (!status.canAskAgain) {
      Alert.alert(
        "Camera access denied",
        "Enable camera access in your device settings to continue",
        [
          {
            text: "Go to Settings",
            onPress: () => void Linking.openSettings()
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      )
      return
    }

    await requestPermissionDefault()
  }, [status, requestPermissionDefault])

  return { granted: Boolean(status?.granted), requestPermissions }
}
