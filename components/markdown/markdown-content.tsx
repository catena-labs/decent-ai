import { CopyIcon } from "lucide-react-native"
import { useColorScheme } from "nativewind"
import { type ReactNode } from "react"
import { type ImageStyle, type TextStyle, type ViewStyle } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { Renderer, type RendererInterface } from "react-native-marked"
import { useMarkdown } from "react-native-marked"

import { Pressable } from "@/components/elements/pressable"
import { ShareableImage } from "@/components/elements/shareable-image"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { useColors } from "@/hooks/use-colors"

class CustomRenderer extends Renderer implements RendererInterface {
  code(
    text: string,
    _language?: string | undefined,
    _containerStyle?: ViewStyle | undefined,
    _textStyle?: TextStyle | undefined
  ): ReactNode {
    return (
      <View
        className="w-full gap-4 rounded-[10px] bg-codeblock p-3"
        key={this.getKey()}
      >
        <Pressable
          className="flex-row items-center gap-2 self-start rounded-md border border-codeblock-foreground px-2 py-1 active:opacity-50"
          copyOnPress={text}
          haptics
        >
          <CopyIcon className="text-codeblock-foreground" size={16} />
          <Text className="text-xs text-codeblock-foreground">Copy Code</Text>
        </Pressable>
        <ScrollView>
          <Text
            className="text-wrap text-xs text-codeblock-foreground"
            variant="mono"
            selectable
          >
            {text}
          </Text>
        </ScrollView>
      </View>
    )
  }

  // inline code
  codespan(text: string, _styles?: TextStyle): ReactNode {
    return (
      <Text
        className="bg-foreground px-1 text-background"
        key={this.getKey()}
        variant="mono"
      >
        {text}
      </Text>
    )
  }

  // Images
  image(uri: string, alt?: string, style?: ImageStyle): ReactNode {
    const key = this.getKey()
    if (uri.endsWith(".svg")) {
      super.image(uri, alt, style)
    }
    return <ShareableImage alt={alt} key={key} style={style} uri={uri} />
  }

  text(text: string | ReactNode[], styles?: TextStyle | undefined): ReactNode {
    return (
      <Text key={this.getKey()} style={styles}>
        {text}
      </Text>
    )
  }
}

export type MarkdownContentProps = {
  value: string
}

export function MarkdownContent({ value }: MarkdownContentProps) {
  const { colorScheme } = useColorScheme()
  const colors = useColors()

  const elements = useMarkdown(value, {
    colorScheme,
    renderer: new CustomRenderer(),
    styles: {
      paragraph: {
        paddingTop: 4,
        paddingBottom: 4
      },
      text: {
        color: colors.foreground,
        fontSize: 16,
        lineHeight: 25
      },
      image: {
        borderRadius: 10,
        marginBottom: 10
      },
      link: {
        fontStyle: "normal",
        fontWeight: "bold",
        color: colors.primary
      }
    }
  })

  return (
    <View className="max-w-full flex-col flex-wrap items-start">
      {elements}
    </View>
  )
}
