import React, { useEffect, useRef, useState } from "react"
import { View } from "react-native"
import Svg, { Circle } from "react-native-svg"

import { useColors } from "@/hooks/use-colors"

import { AudioModeState } from "../audio-mode-constants"

type Dot = {
  x: number
  y: number
  size: number
}

type RadialTransitionAnimationProps = {
  audioModeState: AudioModeState
  onAnimationComplete?: () => void
}

export function RadialTransitionAnimation({
  audioModeState,
  onAnimationComplete
}: RadialTransitionAnimationProps) {
  const colors = useColors()
  const initialNumDots = 8
  const finalNumDots = 16
  const initialDotSize = 12
  const finalDotSize = 3.3
  const startRadius = 90
  const endRadius = 33
  const svgSize = 250

  const phase1Duration = 120 // time to move to center
  const phase2Duration = 10 // pause at center
  const phase3Duration = 90 // time to move back out

  const createCircleDots = (
    numDots: number,
    radius: number,
    dotSize: number
  ): Dot[] => {
    return Array(numDots)
      .fill(null)
      .map((_, index) => {
        const angle = (index / numDots) * 2 * Math.PI
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          size: dotSize
        }
      })
  }

  const [dots, setDots] = useState<Dot[]>(() =>
    createCircleDots(initialNumDots, startRadius, initialDotSize)
  )

  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (audioModeState === AudioModeState.LOADING) {
      return
    }
    startTimeRef.current = null // reset start time on each mount
    const totalDuration = phase1Duration + phase2Duration + phase3Duration

    const animate = (time: number) => {
      if (startTimeRef.current === null) startTimeRef.current = time
      const elapsedTime = time - startTimeRef.current

      if (elapsedTime >= totalDuration) {
        if (onAnimationComplete) onAnimationComplete()
        return
      }

      let newDots: Dot[] = []

      if (elapsedTime < phase1Duration) {
        // Phase 1: Move from start radius to center
        const phase1Progress = elapsedTime / phase1Duration
        const radius = startRadius * (1 - phase1Progress)
        newDots = createCircleDots(initialNumDots, radius, initialDotSize)
      } else if (elapsedTime < phase1Duration + phase2Duration) {
        // Phase 2: At center
        newDots = createCircleDots(finalNumDots, 0, finalDotSize)
      } else {
        // Phase 3: Move from center back out to end radius
        const phase3Progress =
          (elapsedTime - phase1Duration - phase2Duration) / phase3Duration
        const radius = endRadius * phase3Progress
        newDots = createCircleDots(finalNumDots, radius, finalDotSize)
      }

      setDots(newDots)

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    onAnimationComplete,
    initialNumDots,
    finalNumDots,
    initialDotSize,
    finalDotSize,
    startRadius,
    endRadius,
    audioModeState
  ])

  return (
    <View>
      <Svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
      >
        {dots.map((dot, index) => {
          const x = svgSize / 2 + dot.x
          const y = svgSize / 2 + dot.y
          const key = `dot-${index}`
          return (
            <Circle
              key={key}
              cx={x}
              cy={y}
              r={dot.size / 2}
              fill={colors.foreground}
            />
          )
        })}
      </Svg>
    </View>
  )
}
