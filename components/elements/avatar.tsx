import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"

import { cn } from "@/lib/utils/cn"

import { Text } from "./text"
import { View, type ViewProps } from "./view"

export type AvatarProps = ViewProps & {
  url?: string | null
  /**
   * A readonly array of colors that represent stops in the gradient. At least two colors are required
   */
  colors: string[]
  fallbackText?: string
}

export function Avatar({
  url,
  colors,
  fallbackText,
  className,
  ...props
}: AvatarProps) {
  return (
    <View
      className={cn(
        "relative aspect-square size-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {url ? (
        <Image
          contentFit="cover"
          source={{
            uri: url
          }}
          style={{
            width: "100%",
            height: "100%"
          }}
        />
      ) : (
        <LinearGradient
          colors={colors}
          end={[1, 1]}
          start={[0, 0]}
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {fallbackText ? (
            <Text className="text-sm text-primary-foreground">
              {fallbackText}
            </Text>
          ) : null}
        </LinearGradient>
      )}
    </View>
  )
}
