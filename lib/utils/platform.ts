// eslint-disable-next-line import/no-named-as-default -- Constants is exported as a type
import Constants, { ExecutionEnvironment } from "expo-constants"
import * as Device from "expo-device"
import { Platform } from "react-native"

/**
 * If the app is currently running on a device (vs simulator)
 */
export const isDevice = Device.isDevice

/**
 * Variable set to true if the client is running in Expo Go
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient

/**
 * Variable set to true if the client is running on Android
 */
export const isAndroid = Platform.OS === "android"

/**
 * Variable set to true if the client is running on iOS
 */
export const isIOS = Platform.OS === "ios"

/**
 * Variable set to true if the client is running on web
 */
export const isWeb = Platform.OS === "web"
