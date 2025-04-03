import { Image } from "expo-image"
import { ScrollView, StyleSheet } from "react-native"
import { isAddress } from "viem"

import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { ModalHeader } from "@/components/layout/modal-header"
import { useAuthentication } from "@/hooks/use-authentication"

export default function AccessInfoScreen() {
  const { user } = useAuthentication()

  return (
    <View className="size-full bg-background">
      <ModalHeader backIcon="back" />

      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{
          flexDirection: "column",
          alignItems: "center",
          height: "100%",
          gap: 40
        }}
      >
        <View className="size-[200px] overflow-hidden rounded-xl">
          <Image
            contentFit="cover"
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- image import is untyped
            source={require("@/assets/images/icon.png")}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View className="gap-4">
          <Text>
            DecentPass grants you full access to all the benefits of DecentAI.
          </Text>

          <Text>
            <Text variant="bold">Expanded access: </Text>
            <Text>
              With a DecentPass, you can enjoy higher usage limits and a wider
              array of AI models.
            </Text>
          </Text>

          {user && isAddress(user.name) ? (
            <Text>
              <Text variant="bold">Transferable: </Text>
              <Text>
                A DecentPass is a Non-Fungible Token that you can hold or
                transfer to a wallet of your choice. By transferring your
                DecentPass to another wallet, you are also transferring access
                to DecentAI.
              </Text>
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  )
}
