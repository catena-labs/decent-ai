const pkg = require("./package.json")

const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT ?? "development"
const includeSentry = appVariant !== "development"

/**
 * App Build number
 *
 * NOTE: As of package.json version 3.0.2, this number should follow the following rules:
 *
 * - EVEN build number = Used for App Store releases. Requires Subscriptions
 * - ODD build number = Used for Betas. Does not require Subscriptions
 */
const buildNumber = 136

/** @type {import('expo/config').ExpoConfig} */
export default {
  expo: {
    name: appName(),
    slug: "decent-gpt",
    owner: "catena",
    version: pkg.version,
    orientation: "portrait",
    scheme: appScheme(),
    backgroundColor: "#FFFFFF",
    userInterfaceStyle: "automatic",
    icon: appIcon(),
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
      dark: {
        image: "./assets/images/splash-dark.png",
        resizeMode: "contain",
        backgroundColor: "#000000"
      }
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      buildNumber: buildNumber.toString(),
      supportsTablet: true,
      usesAppleSignIn: true,
      bundleIdentifier: bundleIdentifier("ios"),
      associatedDomains: [
        "applinks:mobile.decentai.app",
        "applinks:decentai.app"
      ],
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        backgroundColor: "#FFFFFF",
        dark: {
          image: "./assets/images/splash-dark.png",
          resizeMode: "contain",
          backgroundColor: "#000000"
        }
      },
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
        LSApplicationQueriesSchemes: [
          "metamask",
          "trust",
          "safe",
          "rainbow",
          "uniswap",
          "cbwallet"
        ],
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [appScheme(), googleAppId()]
          }
        ],
        NSMicrophoneUsageDescription:
          "DecentAI needs access to your microphone to translate voice to text."
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      versionCode: buildNumber,
      package: bundleIdentifier("android"),
      allowBackup: false,
      icon: appIcon(),
      adaptiveIcon: {
        foregroundImage: adaptiveIcon(),
        backgroundColor: adaptiveIconColor()
      },
      googleServicesFile: googleServicesFile(),
      permissions: ["RECORD_AUDIO", "BLUETOOTH", "MODIFY_AUDIO_SETTINGS"],
      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO"
      ]
    },
    androidNavigationBar: {
      backgroundColor: "#00082D00"
    },
    plugins: [
      "expo-font",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 25,
            manifestQueries: {
              package: ["org.toshi"]
            }
          }
        }
      ],
      "expo-router",
      [
        "expo-notifications", // https://docs.expo.dev/versions/latest/sdk/notifications/#app-config
        {
          icon: "./assets/images/notification-icon.png",
          color: "#FFFFFF"
        }
      ],
      "expo-apple-authentication",
      "@react-native-google-signin/google-signin",
      "expo-localization",
      [
        "expo-image-picker",
        {
          microphonePermission:
            "DecentAI needs access to your microphone to translate voice to text.",
          cameraPermission:
            "You can take photos to include in your conversations with DecentAI"
        }
      ],
      [
        "expo-media-library",
        {
          savePhotosPermission:
            "Allow DecentAI to save generated pictures to your photo album."
        }
      ],
      ...(includeSentry
        ? [
            [
              "@sentry/react-native/expo",
              {
                project: "decent-mobile",
                organization: "catena-labs"
              }
            ]
          ]
        : [])
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "" // EAS_PROJECT_ID
      }
    }
  }
}

function appName() {
  if (appVariant === "development") {
    return "DecentAI (Dev)"
  }

  if (appVariant === "staging") {
    return "DecentAI (Stg)"
  }

  return "DecentAI"
}

function appIcon() {
  if (appVariant === "staging") {
    return "./assets/images/icon-dark.png"
  }

  return "./assets/images/icon.png"
}

function adaptiveIcon() {
  if (appVariant === "staging") {
    return "./assets/images/adaptive-icon-dark.png"
  }

  return "./assets/images/adaptive-icon.png"
}

function adaptiveIconColor() {
  if (appVariant === "staging") {
    return "#000000"
  }

  return "#FFFFFF"
}

function appScheme() {
  if (appVariant === "development") {
    return "decentai-dev"
  }

  if (appVariant === "staging") {
    return "decentai-stg"
  }

  return "decentai"
}

function bundleIdentifier(platform) {
  if (appVariant === "development") {
    return `xyz.catena.decent.${platform}.dev`
  }

  if (appVariant === "staging") {
    return `xyz.catena.decent.${platform}.stg`
  }

  return `xyz.catena.decent.${platform}`
}

function googleAppId() {
  if (appVariant === "development") {
    // Should be the development Google App ID
    return ""
  }

  if (appVariant === "staging") {
    // Should be the staging Google App ID
    return ""
  }

  // Should be the production Google App ID
  return ""
}

function googleServicesFile() {
  if (appVariant === "development") {
    return "./google-services-dev.json"
  }

  if (appVariant === "staging") {
    return "./google-services-stg.json"
  }

  return "./google-services.json"
}
