import React, { useCallback, useEffect, useRef, useState } from "react"
import { Animated, Text, useWindowDimensions } from "react-native"

import { type Message } from "@/lib/ai/message"

import { AudioModeState } from "./audio-mode-constants"

type CaptionsProps = {
  audioModeState: AudioModeState
  cancelCaptions: boolean
  messages: Message[]
  maxCharacters?: number
  fadeDuration?: number
}

type CaptionChunk = {
  text: string
  displayInterval: number
}

export function Captions({
  audioModeState,
  cancelCaptions,
  messages,
  maxCharacters: defaultMaxCharacters = 160,
  fadeDuration = 200
}: CaptionsProps) {
  const { width } = useWindowDimensions()
  const fontSize = 18 // text-lg is roughly 18px
  const numLines = 4
  const avgCharWidth = fontSize * 0.6 // approximate character width
  const horizontalPadding = 32

  // Calculate characters that fit per line based on screen width
  const charsPerLine = Math.floor((width - horizontalPadding) / avgCharWidth)
  const maxCharacters = Math.min(defaultMaxCharacters, charsPerLine * numLines)

  const [textChunks, setTextChunks] = useState<CaptionChunk[]>([])
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const lastProcessedMessageRef = useRef<string>("")
  const diplayTimePerCharacter = 60
  const minDisplayInterval = 2200
  const maxDisplayInterval = 10000

  const fadeIn = useCallback(() => {
    if (cancelCaptions) return
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: fadeDuration,
      useNativeDriver: true
    }).start()
  }, [cancelCaptions, fadeAnim, fadeDuration])

  const fadeOut = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: fadeDuration,
      useNativeDriver: true
    }).start(() => {
      if (currentChunkIndex + 1 < textChunks.length) {
        setCurrentChunkIndex((prevIndex) => prevIndex + 1)
        setTimeout(fadeIn, 0)
      }
    })
  }, [fadeAnim, fadeDuration, currentChunkIndex, textChunks.length, fadeIn])

  const getDisplayTimeForChunk = useCallback(
    (chunk: string) => {
      // enforce a minimum and a maximum value
      const calculatedInterval = chunk.length * diplayTimePerCharacter
      return Math.max(
        minDisplayInterval,
        Math.min(calculatedInterval, maxDisplayInterval)
      )
    },
    [diplayTimePerCharacter, minDisplayInterval, maxDisplayInterval]
  )

  const chunkText = useCallback(
    (text: string) => {
      const cleanedText = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim()
      if (cleanedText.length <= maxCharacters) {
        return [
          {
            text: cleanedText,
            displayInterval: getDisplayTimeForChunk(cleanedText)
          }
        ]
      }

      const sentences = cleanedText.match(/[^.!?]+[.!?\s]*/g) ?? [cleanedText]
      const chunks: CaptionChunk[] = []
      let currentChunk = ""

      sentences.forEach((sentence) => {
        if ((currentChunk + sentence).length <= maxCharacters) {
          currentChunk += sentence
        } else {
          if (currentChunk) {
            const captionText = currentChunk.trim()
            const displayInterval = getDisplayTimeForChunk(captionText)
            chunks.push({ text: captionText, displayInterval })
          }
          currentChunk = sentence
        }
      })

      if (currentChunk) {
        const captionText = currentChunk.trim()
        const displayInterval = getDisplayTimeForChunk(captionText)
        chunks.push({ text: captionText, displayInterval })
      }

      return chunks
    },
    [getDisplayTimeForChunk, maxCharacters]
  )

  useEffect(() => {
    if (audioModeState === AudioModeState.PLAYING) {
      const lastMsg = messages[messages.length - 1]
      if (
        lastMsg?.role === "assistant" &&
        lastMsg.content !== lastProcessedMessageRef.current
      ) {
        const newTextChunks = chunkText(lastMsg.content)
        setTextChunks(newTextChunks)
        setCurrentChunkIndex(0)
        lastProcessedMessageRef.current = lastMsg.content
        setTimeout(fadeIn, 0)
      }
    } else if (
      audioModeState === AudioModeState.LOADING ||
      audioModeState === AudioModeState.RECORDING
    ) {
      setTextChunks([])
      setCurrentChunkIndex(0)
      lastProcessedMessageRef.current = ""
    }
  }, [audioModeState, messages, chunkText, fadeIn])

  useEffect(() => {
    if (textChunks.length > 0 && currentChunkIndex < textChunks.length) {
      const timer = setTimeout(
        fadeOut,
        textChunks[currentChunkIndex]?.displayInterval ?? minDisplayInterval
      )
      return () => {
        clearTimeout(timer)
      }
    }
  }, [textChunks, currentChunkIndex, fadeOut])

  if (textChunks.length === 0) {
    return null
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        alignSelf: "center"
      }}
    >
      <Text className="text-center text-lg text-foreground">
        {textChunks[currentChunkIndex]?.text ?? ""}
      </Text>
    </Animated.View>
  )
}
