import React, { useState } from "react"
import { type LayoutChangeEvent, View } from "react-native"

import { useColors } from "@/hooks/use-colors"

type DotPatternBackgroundProps = {
  dotSize?: number // Size of each dot
  spacing?: number // Space between dots
  dotColor?: string
}

export function DotPatternBackground({
  dotSize = 2,
  spacing = 20,
  dotColor
}: DotPatternBackgroundProps) {
  const { primary } = useColors()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setDimensions({ width, height })
  }

  const rows = Math.floor(dimensions.height / (dotSize + spacing))
  const columns = Math.floor(dimensions.width / (dotSize + spacing))

  return (
    <View
      className="absolute left-0 top-0 flex size-full flex-row flex-wrap"
      onLayout={onLayout}
    >
      {Array.from({ length: rows * columns }).map((_, index) => (
        <View
          // eslint-disable-next-line react/no-array-index-key -- this is fine
          key={index}
          className="rounded-full"
          style={{
            backgroundColor: dotColor ?? primary,
            width: dotSize,
            height: dotSize,
            margin: spacing / 2,
            opacity: 0.3
          }}
        />
      ))}
    </View>
  )
}
