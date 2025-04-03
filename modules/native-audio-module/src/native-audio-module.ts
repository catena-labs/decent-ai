import { type Subscription, requireNativeModule } from "expo-modules-core"

type NativeAudioModuleType = {
  setAppReady: (isUsing16BitFormat: boolean) => void
  playAudioFromBase64: (base64String: string) => Promise<string>
  playAudioFromData: (audioData: unknown) => Promise<string>
  stopAudio: () => Promise<string>
  prepareAudioPlayback: (size: number) => Promise<string>
  appendAudioChunk: (chunk: number[]) => Promise<string>
  startAudioPlayback: () => Promise<string>
  startAudioPlaybackWithPlayer: () => Promise<string>
  addListener: (eventName: string) => Subscription
  removeListeners: (count: number) => void
  cleanupNativeAudio: () => void
  trimAudio: (
    inputPath: string,
    outputPath: string,
    startMs: number,
    durationMs: number
  ) => Promise<string>
  isHeadphonesConnected: () => boolean
}

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
const NativeAudioModule: NativeAudioModuleType =
  requireNativeModule("NativeAudioModule")

export { NativeAudioModule }
