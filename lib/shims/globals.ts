import { Buffer } from "buffer"

// Should be handled by "@walletconnect/react-native-compat"
if (typeof Buffer === "undefined") {
  global.Buffer = Buffer
}
