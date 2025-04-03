import React, { memo, useEffect, useMemo, useRef, useState } from "react"
import { Animated, Easing, View } from "react-native"
import Svg, { Circle, Rect, Text as SvgText } from "react-native-svg"

import { useColors } from "@/hooks/use-colors"
import { useUserSettings } from "@/hooks/use-user-settings"

import { AudioModeState } from "../audio-mode-constants"
import { RadialTransitionAnimation } from "./radial-transition"

type RecordingVisualizerProps = {
  audioModeState: AudioModeState
  volume: number
  setInfoMessage: (message: string) => void
}

// Memoized Dot Components
const DotAnimator = memo(
  ({
    x,
    y,
    rowIndex,
    colIndex,
    animatedValue,
    calculateDotSize,
    baseDotSize,
    color
  }: {
    x: number
    y: number
    rowIndex: number
    colIndex: number
    animatedValue: Animated.Value
    calculateDotSize: (
      row: number,
      col: number,
      volume: number,
      idle: number
    ) => number
    baseDotSize: number
    color: string
  }) => {
    const baseSize = baseDotSize / 2
    const maxSize = calculateDotSize(rowIndex, colIndex, 1, 0) / 2

    return (
      <AnimatedCircle
        cx={x}
        cy={y}
        r={animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [baseSize, maxSize]
        })}
        fill={color}
      />
    )
  }
)
DotAnimator.displayName = "DotAnimator"

const IdleAnimator = memo(
  ({
    x,
    y,
    rowIndex,
    colIndex,
    idleAnimation,
    calculateDotSize,
    baseDotSize,
    color
  }: {
    x: number
    y: number
    rowIndex: number
    colIndex: number
    idleAnimation: Animated.Value
    calculateDotSize: (
      row: number,
      col: number,
      volume: number,
      idle: number
    ) => number
    baseDotSize: number
    color: string
  }) => {
    const baseSize = baseDotSize / 2
    const maxIdleSize = calculateDotSize(rowIndex, colIndex, 0, 1) / 2

    return (
      <AnimatedCircle
        cx={x}
        cy={y}
        r={Animated.add(
          baseSize,
          idleAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, maxIdleSize - baseSize]
          })
        )}
        fill={color}
      />
    )
  }
)
IdleAnimator.displayName = "IdleAnimator"

export function RecordingVisualizer({
  audioModeState,
  volume,
  setInfoMessage
}: RecordingVisualizerProps) {
  const colors = useColors()
  const [showGrid, setShowGrid] = useState(false)

  const gridSize = 20 // 20x20 grid
  const baseDotSize = 3.3 // base size of each dot
  const maxDotSize = 22 // maximum size for dots
  const center = gridSize / 2 - 0.5 // center of the grid (adjusted for 0-based index)
  const gridGap = 10 // gap between dots in the grid

  const [maxVolume, setMaxVolume] = useState(-10)
  const animatedVolume = useRef(new Animated.Value(0)).current
  const idleAnimation = useRef(new Animated.Value(0)).current

  const isHandsFreeRecording = useUserSettings(
    (state) => state.voiceChatHandsFree
  )

  // circle pattern for the dots
  const circlePattern = [
    [7, 12], // Row 1
    [5, 14], // Row 2
    [3, 16], // Row 3
    [2, 18], // Row 4
    [2, 18], // Row 5
    [1, 19], // Row 6
    [1, 19], // Row 7
    [0, 20], // Row 8
    [0, 20], // Row 9
    [0, 20] // Row 10
  ]

  const handleInitialAnimationComplete = () => {
    setShowGrid(true)
  }

  // normalize volume to a 0-1 range
  const normalizeVolume = (vol: number) => {
    const minVolume = -50
    return Math.max(0, Math.min(1, (vol - minVolume) / (maxVolume - minVolume)))
  }

  const calculateDotSize = useMemo(
    () =>
      (
        row: number,
        col: number,
        normalizedVolume: number,
        idleValue: number
      ) => {
        if (audioModeState === AudioModeState.IDLE) {
          const diamondWidth = 10
          const diamondHeight = 8

          // calculate Manhattan distance to create diamond shape
          const dx = Math.abs(col - center)
          const dy = Math.abs(row - center)
          const manhattanDistance = dx / diamondWidth + dy / diamondHeight

          // normalize the distance to a 0-1 range
          const normalizedDistance = Math.min(1, manhattanDistance)

          // invert the distance so that center is 1 and edges are 0
          const distanceFactor = 1 - normalizedDistance

          const idleScalingThreshold = 0.1 // lower threshold to include more dots
          if (distanceFactor > idleScalingThreshold) {
            const idleScalingFactor = Math.pow(
              (distanceFactor - idleScalingThreshold) /
                (1 - idleScalingThreshold),
              1.5
            )
            const amplificationFactor = isHandsFreeRecording ? 12 : 33
            return Math.max(
              baseDotSize + idleValue * amplificationFactor * idleScalingFactor,
              baseDotSize * 2
            )
          }
          return baseDotSize + idleValue * 3.3
        }

        // RECORDING and STOPRECORDING state
        const dx = col - center
        const dy = row - center
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = Math.sqrt(center * center + center * center)
        const distanceFactor = 1 - distanceFromCenter / maxDistance

        // scaling factor that heavily favors central dots
        const baseScalingFactor = Math.max(
          0,
          distanceFactor - (1 - normalizedVolume)
        )
        const centralEmphasis = Math.pow(distanceFactor, 3)
        const scalingFactor = baseScalingFactor * (1 + 2 * centralEmphasis)

        const amplifiedVolume = Math.pow(normalizedVolume, 0.7)

        // calculate size increase with more emphasis on central dots
        const maxIncrease = maxDotSize - baseDotSize
        const sizeIncrease = maxIncrease * scalingFactor * amplifiedVolume * 1.8

        return Math.min(
          maxDotSize,
          Math.max(baseDotSize, baseDotSize + sizeIncrease)
        )
      },
    [audioModeState, center, isHandsFreeRecording]
  )

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null

    if (audioModeState !== AudioModeState.IDLE && volume !== 0) {
      if (volume > maxVolume) {
        setMaxVolume(volume)
      }

      animation = Animated.timing(animatedVolume, {
        toValue: normalizeVolume(volume),
        duration: 20,
        easing: Easing.linear,
        useNativeDriver: true
      })

      animation.start()
    }

    return () => {
      if (animation) {
        animation.stop()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ignore unnecessary deps
  }, [volume, maxVolume, audioModeState, animatedVolume])

  // Optimized idle animation effect
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null

    if (audioModeState === AudioModeState.IDLE) {
      setInfoMessage(isHandsFreeRecording ? "Speak" : "")

      const idleConfig = {
        duration: 1500,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true
      }

      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(idleAnimation, {
            ...idleConfig,
            toValue: 1
          }),
          Animated.timing(idleAnimation, {
            ...idleConfig,
            toValue: 0
          })
        ])
      )

      animation.start()
    } else if (audioModeState === AudioModeState.STOPRECORDING) {
      animatedVolume.setValue(0)
    } else if (audioModeState === AudioModeState.RECORDING) {
      setInfoMessage(isHandsFreeRecording ? "Listening" : "Release to stop")
      idleAnimation.setValue(0)
    }

    return () => {
      if (animation) {
        animation.stop()
        idleAnimation.setValue(0)
      }
    }
  }, [
    audioModeState,
    idleAnimation,
    isHandsFreeRecording,
    setInfoMessage,
    animatedVolume
  ])

  // determine if a dot should be rendered based on the row and column
  const shouldRenderDot = (row: number, col: number) => {
    const rowPattern = circlePattern[Math.min(row, gridSize - row - 1)]
    const start = rowPattern?.[0] ?? 0
    const end = rowPattern?.[1] ?? 0
    return col >= start && col < end
  }

  // calculate the container size with extra padding to prevent cutoff
  const dotSpacing = baseDotSize + gridGap
  const baseContainerSize = gridSize * dotSpacing - gridGap
  const padding = maxDotSize - baseDotSize // Extra padding to prevent cutoff
  const containerSize = baseContainerSize + padding * 2

  // Optimized dots array with memoization
  const dots = useMemo(() => {
    const dotComponents = []

    for (let rowIndex = 0; rowIndex < gridSize; rowIndex++) {
      for (let colIndex = 0; colIndex < gridSize; colIndex++) {
        if (!shouldRenderDot(rowIndex, colIndex)) continue

        const x = colIndex * dotSpacing + padding + baseDotSize / 2
        const y = rowIndex * dotSpacing + padding + baseDotSize / 2
        const key = `dot-${rowIndex}-${colIndex}`

        dotComponents.push(
          audioModeState === AudioModeState.IDLE ? (
            <IdleAnimator
              key={key}
              x={x}
              y={y}
              rowIndex={rowIndex}
              colIndex={colIndex}
              idleAnimation={idleAnimation}
              calculateDotSize={calculateDotSize}
              baseDotSize={baseDotSize}
              color={colors.foreground}
            />
          ) : (
            <DotAnimator
              key={key}
              x={x}
              y={y}
              rowIndex={rowIndex}
              colIndex={colIndex}
              animatedValue={animatedVolume}
              calculateDotSize={calculateDotSize}
              baseDotSize={baseDotSize}
              color={colors.foreground}
            />
          )
        )
      }
    }
    return dotComponents
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ignore unnecessary deps
  }, [
    audioModeState,
    colors.foreground,
    dotSpacing,
    padding,
    calculateDotSize,
    idleAnimation,
    animatedVolume
  ])

  // calculate center position for text
  const rectWidth = 110
  const rectHeight = 33
  const rectX = (containerSize - rectWidth) / 2
  const rectY = (containerSize - rectHeight) / 2

  if (!showGrid && audioModeState !== AudioModeState.RECORDING) {
    return (
      <RadialTransitionAnimation
        audioModeState={audioModeState}
        onAnimationComplete={handleInitialAnimationComplete}
      />
    )
  }

  return (
    <View className="items-center justify-center">
      <Svg
        height={containerSize}
        width={containerSize}
        viewBox={`0 0 ${containerSize} ${containerSize}`}
      >
        {dots}
        {audioModeState === AudioModeState.IDLE && !isHandsFreeRecording ? (
          <>
            <Rect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectHeight}
              rx={10}
              ry={10}
              fill={colors.foreground}
            />
            <SvgText
              x={containerSize / 2}
              y={containerSize / 2}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize="14"
              fill={colors.background}
            >
              Press and hold
            </SvgText>
          </>
        ) : null}
      </Svg>
    </View>
  )
}

// custom AnimatedCircle component to allow animation of the 'r' prop
const AnimatedCircle = Animated.createAnimatedComponent(Circle)
