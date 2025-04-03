// Learn more https://docs.expo.io/guides/customizing-metro
const { getSentryExpoConfig } = require("@sentry/react-native/metro")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro: `isCSSEnabled: true`
})

// Add SQL file support for migrations
config.resolver.sourceExts.push("sql")

// Add modules directory to node_modules paths
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths,
  path.resolve(__dirname, "modules")
]

// Custom resolver for absolute paths
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => path.join(__dirname, `node_modules/${name}`)
  }
)

// Add custom watch folder for the modules directory
config.watchFolders = [
  ...config.watchFolders,
  path.resolve(__dirname, "modules")
]

module.exports = withNativeWind(config, {
  input: "./assets/globals.css",
  inlineRem: 16
})
