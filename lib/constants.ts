import * as Application from "expo-application"
// eslint-disable-next-line import/no-named-as-default -- `Constants` is exported as a type
import Constants from "expo-constants"

const schemes = Constants.expoConfig?.scheme ?? "decentai"

export const appScheme = Array.isArray(schemes) ? schemes[0] : schemes
export const appVersion = Application.nativeApplicationVersion ?? "0.0.0"
export const appBuildVersion = Application.nativeBuildVersion ?? "0"
export const appBuildNumber = parseInt(appBuildVersion, 10)
