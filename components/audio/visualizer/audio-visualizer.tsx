import { useEffect } from "react"

import { AudioModeState } from "../audio-mode-constants"
import { VisualizerLoadingView } from "./visualizer-loading"
import { NetworkingVisualizer } from "./visualizer-networking"
import { PlayingVisualizer } from "./visualizer-playing"
import { RecordingVisualizer } from "./visualizer-recording"

type VisualizerProps = {
  audioModeState: AudioModeState
  sampleData: number[]
  volume: number
  setInfoMessage: (message: string) => void
}

export function AudioModeVisualizer({
  audioModeState,
  sampleData,
  volume,
  setInfoMessage
}: VisualizerProps) {
  useEffect(() => {
    if (audioModeState === AudioModeState.LOADING) {
      setInfoMessage("Preparing voice")
    } else if (
      audioModeState === AudioModeState.PROMPTING ||
      audioModeState === AudioModeState.TRANSCRIBING ||
      audioModeState === AudioModeState.PLAYING
    ) {
      setInfoMessage("Touch to cancel")
    }
  }, [audioModeState, setInfoMessage])

  return (
    <>
      {audioModeState === AudioModeState.LOADING && <VisualizerLoadingView />}
      {(audioModeState === AudioModeState.IDLE ||
        audioModeState === AudioModeState.RECORDING ||
        audioModeState === AudioModeState.STOPRECORDING) && (
        <RecordingVisualizer
          audioModeState={audioModeState}
          volume={volume}
          setInfoMessage={setInfoMessage}
        />
      )}
      {(audioModeState === AudioModeState.TRANSCRIBING ||
        audioModeState === AudioModeState.PROMPTING) && (
        <NetworkingVisualizer />
      )}
      {audioModeState === AudioModeState.PLAYING && (
        <PlayingVisualizer sampleData={sampleData} />
      )}
    </>
  )
}
