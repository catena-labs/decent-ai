import * as NavigationBar from "expo-navigation-bar"
import { router } from "expo-router"
import { XIcon } from "lucide-react-native"
import { useEffect } from "react"
import { Dimensions, Modal, SafeAreaView } from "react-native"

import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useColors } from "@/hooks/use-colors"
import { isAndroid } from "@/lib/utils/platform"

import { VoiceChatHeader } from "./audio-mode-header"
import { VisualizerLoadingView } from "./visualizer/visualizer-loading"

type Props = {
  setIsVisible: (isVisible: boolean) => void
}

/**
 * A Loading page for AudioMode, which mimics the layout of the <AudioMode />
 * component while audio mode is loading.
 */
export function AudioModeLoading({ setIsVisible }: Props) {
  const colors = useColors()
  const screenHeight = Dimensions.get("window").height

  useEffect(() => {
    if (isAndroid) {
      try {
        void NavigationBar.setBackgroundColorAsync(colors.background)
      } catch {
        // no-op
      }
    }
  }, [colors.background])

  const onExitAudioMode = async () => {
    if (isAndroid) {
      try {
        // Reset original navigaiton bar color on android
        await NavigationBar.setBackgroundColorAsync(`${colors.background}00`)
      } catch {
        // no-op
      }
    }

    setIsVisible(false)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.navigate({
        pathname: "/(main)"
      })
    }
  }

  return (
    <Modal transparent={!isAndroid} animationType="fade">
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1">
          {/* Header */}
          <VoiceChatHeader />

          {/* Main content */}
          <View
            className="flex-1 items-center justify-center"
            style={{ position: "relative" }}
          >
            {/* Top messages */}
            <View className="absolute inset-x-4 top-20 items-center">
              <Text className="mt-2 text-lg text-foreground">
                Preparing voice
              </Text>
            </View>
          </View>

          <View
            className="absolute inset-x-0 items-center"
            style={{ top: screenHeight * 0.25 }}
          >
            <VisualizerLoadingView />
          </View>

          {/* Exit button */}
          <View className="absolute inset-x-0 bottom-4 items-center">
            <Pressable
              className="size-12 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.foreground }}
              analyticsEvent="audio_mode_exited"
              onPress={async () => {
                await onExitAudioMode()
              }}
            >
              <XIcon color={colors.background} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
