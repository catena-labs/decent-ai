import React, { useEffect, useMemo, useRef, useState } from "react"
import { Animated, View } from "react-native"

import { useColors } from "@/hooks/use-colors"

type PlayingVisualizerProps = {
  sampleData: number[]
}

type Position = {
  x: number
  y: number
}

function TransitionDots({ onComplete }: { onComplete: () => void }) {
  const colors = useColors()
  const dotSize = 36
  const circleRadius = 120
  const DOT_COUNT = 4

  const positions = useRef<
    { x: Animated.Value; y: Animated.Value; scale: Animated.Value }[]
  >(
    Array(DOT_COUNT)
      .fill(0)
      .map((_, i) => ({
        x: new Animated.Value(circleRadius * Math.cos((i * Math.PI) / 2)),
        y: new Animated.Value(circleRadius * Math.sin((i * Math.PI) / 2)),
        scale: new Animated.Value(1)
      }))
  )

  const finalPositions: Position[] = useMemo(() => {
    const gap = 12
    const totalWidth = DOT_COUNT * dotSize + (DOT_COUNT - 1) * gap
    const startX = -totalWidth / 2 + dotSize / 2

    return Array(DOT_COUNT)
      .fill(0)
      .map((_, i) => ({
        x: startX + i * (dotSize + gap),
        y: 0
      }))
  }, [])

  useEffect(() => {
    // Create paired animations only when we have matching positions
    const animations = positions.current
      .map((pos, i) => {
        const finalPos = finalPositions[i]
        if (!finalPos) return [] // Skip if no matching final position

        return [
          Animated.spring(pos.x, {
            toValue: finalPos.x,
            tension: 50,
            friction: 16,
            useNativeDriver: true
          }),
          Animated.spring(pos.y, {
            toValue: finalPos.y,
            tension: 50,
            friction: 16,
            useNativeDriver: true
          })
        ]
      })
      .flat()

    Animated.parallel([
      ...animations,
      Animated.sequence([
        Animated.delay(400),
        ...positions.current.map((pos) =>
          Animated.timing(pos.scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        )
      ])
    ]).start(() => {
      onComplete()
    })
  }, [finalPositions, onComplete])

  return (
    <View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {positions.current.map((pos, index) => (
        <Animated.View
          // eslint-disable-next-line react/no-array-index-key -- index is fine
          key={`transition-dot-${index}`}
          style={{
            position: "absolute",
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: colors.foreground,
            transform: [
              { translateX: pos.x },
              { translateY: pos.y },
              { scale: pos.scale }
            ]
          }}
        />
      ))}
    </View>
  )
}

export function PlayingVisualizer({ sampleData }: PlayingVisualizerProps) {
  const colors = useColors()
  const [showTransition, setShowTransition] = useState(true)

  const minPlaybackHeight = 42
  const maxPlaybackHeight = 180
  const divHeights = useRef<Animated.Value[]>(
    Array(4)
      .fill(minPlaybackHeight)
      .map(() => new Animated.Value(minPlaybackHeight))
  )

  const getVolumesFromSampleData = useMemo(
    () => (): number[] => {
      const chunkSize = Math.floor(sampleData.length / 4)
      const volumes: number[] = []
      for (let i = 0; i < 4; i++) {
        const startIndex = i * chunkSize
        const endIndex = startIndex + chunkSize
        const chunk = sampleData.slice(startIndex, endIndex)
        let sum = 0
        for (const value of chunk) {
          sum += value ** 2
        }
        const rms = Math.sqrt(sum / chunk.length)
        volumes.push(rms)
      }
      return volumes
    },
    [sampleData]
  )

  const getPlaybackHeightsFromVolumes = useMemo(
    () =>
      (vol: number, heightMultiplier: number): number => {
        const baseHeight = vol * heightMultiplier
        return Math.max(
          Math.min(baseHeight, maxPlaybackHeight),
          minPlaybackHeight
        )
      },
    [maxPlaybackHeight, minPlaybackHeight]
  )

  useEffect(() => {
    if (sampleData.length > 0) {
      const volumes = getVolumesFromSampleData()
      volumes.forEach((vol, index) => {
        const heightMultiplier = index === 0 || index === 3 ? 1600 : 3200
        const height = getPlaybackHeightsFromVolumes(vol, heightMultiplier)

        const animatedValue = divHeights.current[index]
        if (animatedValue) {
          Animated.spring(animatedValue, {
            toValue: height,
            tension: 80,
            friction: 8,
            useNativeDriver: false
          }).start()
        }
      })
    }
  }, [sampleData, getPlaybackHeightsFromVolumes, getVolumesFromSampleData])

  const handleTransitionComplete = () => {
    setShowTransition(false)
  }

  return (
    <View
      style={{
        marginTop: 6,
        height: maxPlaybackHeight,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          opacity: showTransition ? 0 : 1
        }}
      >
        {divHeights.current.map((height, index) => (
          <Animated.View
            // eslint-disable-next-line react/no-array-index-key -- index is fine
            key={`circle-${index}`}
            style={{
              borderRadius: 128,
              backgroundColor: colors.foreground,
              width: 42,
              height
            }}
          />
        ))}
      </View>

      {showTransition ? (
        <TransitionDots onComplete={handleTransitionComplete} />
      ) : null}
    </View>
  )
}
