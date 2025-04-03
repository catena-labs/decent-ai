import * as FileSystem from "expo-file-system"
import { EventEmitter, Platform, type Subscription } from "expo-modules-core"

// Import the native module. On web, it will be resolved to NativeAudioModule.web.ts
// and on native platforms to NativeAudioModule.ts
import { NativeAudioModule } from "./src/native-audio-module"
import {
  type AudioSampleEventPayload,
  type NativeAudioModuleLogPayload
} from "./src/native-audio-module.types"

const CHUNK_SIZE = 1024 * 64 // 64KB chunks

export function initializeNativeAudioModule(isUsing16BitFormat: boolean) {
  NativeAudioModule.setAppReady(isUsing16BitFormat)
}

export function cleanupNativeAudioModule() {
  NativeAudioModule.cleanupNativeAudio()
}

export async function playAudioFromData(audioData: unknown): Promise<string> {
  //return await NativeAudioModule.playAudioFromData(audioData)
  // For iOS, we can pass the dictionary directly
  if (Platform.OS === "ios") {
    const dataDict = audioData as Record<string, number>
    return await NativeAudioModule.playAudioFromData(dataDict)
  }

  // For Android, we need to convert the dictionary to an array
  // Android expects a string of comma-separated values
  const audioArr = audioData as Uint8Array
  await NativeAudioModule.prepareAudioPlayback(audioArr.length)

  for (let i = 0; i < audioArr.length; i += CHUNK_SIZE) {
    const chunk = audioArr.slice(i, i + CHUNK_SIZE)
    await NativeAudioModule.appendAudioChunk(Array.from(chunk))
  }

  //return await NativeAudioModule.startAudioPlayback()

  // URL version:
  return await NativeAudioModule.startAudioPlaybackWithPlayer()
}

export async function nativePlayAudioFromBase64(
  base64String: string
): Promise<string> {
  return await NativeAudioModule.playAudioFromBase64(base64String)
}

export async function nativeStopAudio(): Promise<string> {
  return await NativeAudioModule.stopAudio()
}

const emitter = new EventEmitter(NativeAudioModule)

export function addLogListener(
  listener: (event: NativeAudioModuleLogPayload) => void
): Subscription {
  return emitter.addListener<NativeAudioModuleLogPayload>("onLog", listener)
}

export function addAudioSampleListener(
  listener: (event: AudioSampleEventPayload) => void
): Subscription {
  return emitter.addListener<AudioSampleEventPayload>(
    "onAudioSampleReceived",
    listener
  )
}

export async function trimAudioFile(
  inputPath: string,
  startMs: number,
  durationMs: number
): Promise<string> {
  const cleanInputPath = inputPath.replace("file://", "")
  const outputPath = cleanInputPath.replace(".m4a", "_trimmed.m4a")

  try {
    await NativeAudioModule.trimAudio(
      cleanInputPath,
      outputPath,
      startMs,
      durationMs
    )

    // ensure the output file exists
    const reactFileCheckPath = `file://${outputPath}`
    const outputFileInfo = await FileSystem.getInfoAsync(reactFileCheckPath)
    if (outputFileInfo.exists) {
      return reactFileCheckPath
    }
    return inputPath
  } catch (error) {
    console.error("Error trimming audio:", error)
    return inputPath
  }
}

export function isHeadphonesConnected() {
  return NativeAudioModule.isHeadphonesConnected()
}

export { type AudioSampleEventPayload, type NativeAudioModuleLogPayload }
