import React, { useCallback, useEffect, useMemo, useRef } from "react"
import { Animated, Easing, View } from "react-native"
import Svg, { Circle } from "react-native-svg"

import { useColors } from "@/hooks/use-colors"

const AnimatedSvg = Animated.createAnimatedComponent(Svg)
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const ELASTIC_EASING = Easing.bezier(0.37, 0, 0.63, 1)
const LINEAR_EASING = Easing.linear

const getRandomInRange = (center: number, variance: number) => {
  const min = Math.max(0, center - variance)
  const max = center + variance
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const makeEven = (num: number) => Math.floor(num / 2) * 2

// precompute circle points for better performance
const CIRCLE_POINTS = Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * Math.PI * 2
  return [Math.cos(angle), Math.sin(angle)] as [number, number]
})

let dotId = 0
const generateUniqueId = () => `dot-${dotId++}`

export function NetworkingVisualizer() {
  const colors = useColors()

  // memoize animation parameters
  const animationParams = useMemo(
    () => ({
      initialNumDots: makeEven(getRandomInRange(12, 2)),
      finalNumDots: makeEven(getRandomInRange(6, 2)),
      size: getRandomInRange(250, 25),
      initialDotSize: getRandomInRange(6, 1),
      targetDotSize: getRandomInRange(16, 4),
      rotationDuration: getRandomInRange(6000, 600),
      startingRadius: getRandomInRange(60, 10),
      staggerDelay: getRandomInRange(100, 20),
      outwardMovementDuration: getRandomInRange(500, 200),
      initialDelay: getRandomInRange(500, 100)
    }),
    []
  )

  const {
    initialNumDots,
    finalNumDots,
    size,
    initialDotSize,
    targetDotSize,
    rotationDuration,
    startingRadius,
    staggerDelay,
    outwardMovementDuration,
    initialDelay
  } = animationParams

  const endingRadius = size / 2 - targetDotSize / 2

  // Use refs for animated values
  const rotation = useRef(new Animated.Value(0)).current
  const transition = useRef(new Animated.Value(0)).current

  // Optimize dot animations creation
  const dotAnimations = useMemo(
    () =>
      Array.from({ length: Math.max(initialNumDots, finalNumDots) }, () => ({
        id: generateUniqueId(),
        radius: new Animated.Value(startingRadius),
        scale: new Animated.Value(initialDotSize)
      })),
    [initialNumDots, finalNumDots, startingRadius, initialDotSize]
  )

  // Memoize animation creation
  const createAnimations = useCallback(() => {
    const staggeredAnimations = dotAnimations
      .slice(0, finalNumDots)
      .map(({ radius, scale }, index) => {
        const delay = index * staggerDelay
        return Animated.parallel([
          Animated.timing(radius, {
            toValue: endingRadius,
            duration: outwardMovementDuration,
            delay,
            easing: ELASTIC_EASING,
            useNativeDriver: true,
            isInteraction: false // Reduce interaction tracking
          }),
          Animated.timing(scale, {
            toValue: targetDotSize,
            duration: outwardMovementDuration,
            delay,
            easing: ELASTIC_EASING,
            useNativeDriver: true,
            isInteraction: false
          })
        ])
      })

    return Animated.sequence([
      Animated.delay(initialDelay),
      Animated.timing(transition, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        isInteraction: false
      }),
      Animated.stagger(staggerDelay, staggeredAnimations)
    ])
  }, [
    dotAnimations,
    finalNumDots,
    endingRadius,
    outwardMovementDuration,
    staggerDelay,
    targetDotSize,
    transition,
    initialDelay
  ])

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: rotationDuration,
        easing: LINEAR_EASING,
        useNativeDriver: true,
        isInteraction: false
      })
    )

    const mainAnimation = createAnimations()

    mainAnimation.start()
    rotateAnimation.start()

    return () => {
      rotateAnimation.stop()
      mainAnimation.stop()
    }
  }, [rotation, rotationDuration, createAnimations])

  const rotateInterpolate = useMemo(
    () =>
      rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"]
      }),
    [rotation]
  )

  // Memoize dot rendering calculations
  const renderDots = useCallback(() => {
    return dotAnimations.map(({ id, radius, scale }, index) => {
      const initialAngle = (index / initialNumDots) * 360
      const finalAngle = ((index % finalNumDots) / finalNumDots) * 360

      const angleInterpolation = transition.interpolate({
        inputRange: [0, 1],
        outputRange: [initialAngle, finalAngle]
      })

      const opacity = transition.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [
          index < initialNumDots ? 1 : 0,
          0,
          index < finalNumDots ? 1 : 0
        ]
      })

      return (
        <AnimatedCircle
          key={id}
          cx={Animated.add(
            size / 2,
            Animated.multiply(
              radius,
              angleInterpolation.interpolate({
                inputRange: CIRCLE_POINTS.map(
                  (_, i) => (i / CIRCLE_POINTS.length) * 360
                ),
                outputRange: CIRCLE_POINTS.map((point) => point[0]),
                extrapolate: "clamp"
              })
            )
          )}
          cy={Animated.add(
            size / 2,
            Animated.multiply(
              radius,
              angleInterpolation.interpolate({
                inputRange: CIRCLE_POINTS.map(
                  (_, i) => (i / CIRCLE_POINTS.length) * 360
                ),
                outputRange: CIRCLE_POINTS.map((point) => point[1]),
                extrapolate: "clamp"
              })
            )
          )}
          r={Animated.divide(scale, 2)}
          fill={colors.foreground}
          opacity={opacity}
        />
      )
    })
  }, [
    dotAnimations,
    initialNumDots,
    finalNumDots,
    transition,
    size,
    colors.foreground
  ])

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}
    >
      <AnimatedSvg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: [{ rotate: rotateInterpolate }]
        }}
      >
        {renderDots()}
      </AnimatedSvg>
    </View>
  )
}
