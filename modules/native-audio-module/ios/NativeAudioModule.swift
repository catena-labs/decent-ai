import ExpoModulesCore
import AVFoundation

public class NativeAudioModule: Module {
    private var audioPlayer: AVAudioPlayer?
    private var audioEngine: AVAudioEngine?
    private var audioPlayerNode: AVAudioPlayerNode?
    private var audioFormat: AVAudioFormat?
    private var audioDataBuffer = Data()
    private let minBufferSize = 1024 * 4 // jitter buffer

    private var channels: AVAudioChannelCount = 1
    private var isUsing16BitFormat = true
    private var audioSampleBuffer = [Float]()
    private let audioSampleBufferSize = 1024

    private var isPlaying = false
    private var isAppReady = false
    private var isEngineStarting = false
    private var isObservingRouteChange = false
    private var isHeadsetInUse = false

    private var converter: AVAudioConverter?
    private var inputFormat: AVAudioFormat?

    public func definition() -> ModuleDefinition {
        Name("NativeAudioModule")

        Events("onAudioSampleReceived", "onLog")

        Function("setAppReady") { (isUsing16BitFormat: Bool) in
            self.isUsing16BitFormat = isUsing16BitFormat
            self.setupAudioSession()
            self.setupAudioEngine()
            self.setupNotifications()
            self.isAppReady = true
        }

        AsyncFunction("playAudioFromBase64") { (base64String: String) -> String in
            do {
                guard let audioData = Data(base64Encoded: base64String) else {
                    throw NSError(domain: "NativeAudioModule", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 string"])
                }
                // this method plays data as it arrives, which reduces latency but may cause network jitter
                //self.playAudio(data: audioData, sampleRate: sampleRate, channels: channels)
                // this approach adds a jitter buffer to smooth playback, but adds a tiny amount of initial latency
                if (audioData.count > 0) {
                    self.bufferAudioData(audioData)
                }
                return "Audio data queued for playback"
            } catch {
                self.sendLog("Error processing audio: \(error.localizedDescription)")
                return "Error processing audio: \(error.localizedDescription)"
            }
        }

        Function("stopAudio") { () -> String in
            self.stopPlayback()
            return "Audio stopped"
        }

        Function("cleanupNativeAudio") { () -> String in
            self.stopPlayback()
            self.stopEngine()
            self.removeAudioTap()
            self.deactivateAudioSession()
            self.removeNotifications()
            self.resetState()
            return "Audio module cleaned up"
        }

        AsyncFunction("trimAudio") { (inputPath: String, outputPath: String, startMs: Int, durationMs: Int) in
            try await trimAudio(inputPath: inputPath, outputPath: outputPath, startMs: Double(startMs), durationMs: Double(durationMs))
        }

        Function("isHeadphonesConnected") { () -> Bool in
            return isHeadsetInUse
        }
    }

    private var sampleRate: Double {
       return isUsing16BitFormat ? 16000 : 22050
    }

    private func sendLog(_ message: String) {
        print("iOS NativeAudioModule: \(message)")
        super.sendEvent("onLog", ["message": message])
    }

    private func setupNotifications() {
        if (!self.isObservingRouteChange) {
            self.sendLog("Setting up audio route change notifications")
            self.isObservingRouteChange = true
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(handleRouteChange),
                name: AVAudioSession.routeChangeNotification,
                object: nil
            )
        } else {
            self.sendLog("Already observing route change notifications")
        }
    }

    private func removeNotifications() {
        self.sendLog("Removing audio route change notifications")
        self.isObservingRouteChange = false
        NotificationCenter.default.removeObserver(self, name: AVAudioSession.routeChangeNotification, object: nil)
    }

    @objc private func handleRouteChange(notification: Notification) {
        updateAudioRouting()
    }

    func updateAudioRouting() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            if isHeadphoneConnected() {
                self.sendLog("Headphones connected")
                try audioSession.overrideOutputAudioPort(.none)
            } else {
                self.sendLog("Routing to speaker")
                try audioSession.overrideOutputAudioPort(.speaker)
            }
        } catch {
            print("Failed to update audio routing: \(error.localizedDescription)")
        }
    }

    private func isHeadphoneConnected() -> Bool {
        let audioSession = AVAudioSession.sharedInstance()
        let headphonePortTypes: [AVAudioSession.Port] = [.headphones, .bluetoothA2DP, .bluetoothLE, .bluetoothHFP, .carAudio]
        isHeadsetInUse = audioSession.currentRoute.outputs.contains(where: { headphonePortTypes.contains($0.portType) })
        return isHeadsetInUse
    }

    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .mixWithOthers])
            try audioSession.setActive(true)
        } catch {
            sendLog("Failed to set audio session category: \(error.localizedDescription)")
        }
    }

    private func setupAudioEngine() {
        if let engine = audioEngine, engine.isRunning {
            return
        }

        audioEngine = AVAudioEngine()
        audioPlayerNode = AVAudioPlayerNode()

        // 32bit float seems to be required on devices, 16bit not supported here
        audioFormat = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: channels)
        guard let audioFormat = audioFormat else {
            self.sendLog("Failed to create audio format")
            return
        }

        if isUsing16BitFormat {
            let inputFormat = AVAudioFormat(commonFormat: .pcmFormatInt16,
                                        sampleRate: sampleRate,
                                        channels: channels,
                                        interleaved: true)
            guard let inputFormat = inputFormat else {
                self.sendLog("Failed to create input audio format")
                return
            }

            converter = AVAudioConverter(from: inputFormat, to: audioFormat)
        }

        guard let engine = audioEngine, let player = audioPlayerNode else {
            self.sendLog("Failed to initialize audio engine or player node")
            return
        }

        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: audioFormat)

        engine.mainMixerNode.installTap(onBus: 0, bufferSize: AVAudioFrameCount(audioSampleBufferSize), format: audioFormat) { (buffer, when) in
            self.processTapBuffer(buffer)
        }

        do {
            try engine.start()
        } catch {
            sendLog("Error starting audio engine: \(error.localizedDescription)")
        }
    }

    private func ensureEngineRunning() {
        guard let engine = audioEngine, !engine.isRunning, !isEngineStarting else {
            return
        }

        isEngineStarting = true
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setActive(true)
            updateAudioRouting()
            try engine.start()
        } catch {
            sendLog("Error starting audio engine: \(error.localizedDescription)")
        }
        isEngineStarting = false
    }

    private func bufferAudioData(_ data: Data) {
        audioDataBuffer.append(data)
        if audioDataBuffer.count >= minBufferSize {
            if isUsing16BitFormat {
                playBufferedAudioWithConverter()
            } else {
                playBufferedAudio()
            }
            audioDataBuffer = Data() // clear buffer after processing
        }
    }

    private func playBufferedAudio() {
        ensureEngineRunning()
        guard let audioFormat = self.audioFormat, let audioPlayerNode = self.audioPlayerNode else {
            sendLog("Audio format or player node not set")
            return
        }

        let frameCapacity = AVAudioFrameCount(audioDataBuffer.count) / audioFormat.streamDescription.pointee.mBytesPerFrame
        guard let buffer = AVAudioPCMBuffer(pcmFormat: audioFormat, frameCapacity: frameCapacity) else {
            sendLog("Failed to create AVAudioPCMBuffer")
            return
        }
        buffer.frameLength = frameCapacity

        let audioBufferPointer = buffer.audioBufferList.pointee.mBuffers
        audioDataBuffer.copyBytes(to: audioBufferPointer.mData!.assumingMemoryBound(to: UInt8.self), count: Int(audioBufferPointer.mDataByteSize))

        audioPlayerNode.scheduleBuffer(buffer)

        if !audioPlayerNode.isPlaying {
            audioPlayerNode.play()
            isPlaying = true
        }
    }

    private func playBufferedAudioWithConverter() {
        ensureEngineRunning()
        guard let audioFormat = self.audioFormat,
            let converter = self.converter,
            let audioPlayerNode = self.audioPlayerNode else {
            sendLog("Audio format, converter, or player node not set")
            return
        }

        // create input format (16-bit)
        let inputFormat = AVAudioFormat(commonFormat: .pcmFormatInt16,
                                        sampleRate: sampleRate,
                                        channels: channels,
                                        interleaved: true)!

        let frameCapacity = AVAudioFrameCount(audioDataBuffer.count) / inputFormat.streamDescription.pointee.mBytesPerFrame
        guard let inputBuffer = AVAudioPCMBuffer(pcmFormat: inputFormat, frameCapacity: frameCapacity) else {
            sendLog("Failed to create input AVAudioPCMBuffer")
            return
        }
        inputBuffer.frameLength = frameCapacity

        // copy audio data to input buffer
        let audioBufferPointer = inputBuffer.audioBufferList.pointee.mBuffers
        audioDataBuffer.copyBytes(to: audioBufferPointer.mData!.assumingMemoryBound(to: UInt8.self), count: Int(audioBufferPointer.mDataByteSize))

        // create output buffer (32-bit float)
        guard let outputBuffer = AVAudioPCMBuffer(pcmFormat: audioFormat, frameCapacity: frameCapacity) else {
            sendLog("Failed to create output AVAudioPCMBuffer")
            return
        }

        // convert buffer from 16-bit to 32-bit float
        var error: NSError?
        let status = converter.convert(to: outputBuffer, error: &error) { inNumPackets, outStatus in
            outStatus.pointee = .haveData
            return inputBuffer
        }

        if let error = error {
            sendLog("Error converting audio: \(error.localizedDescription)")
            return
        }

        if status == .error {
            sendLog("Conversion failed")
            return
        }

        // schedule the converted buffer
        audioPlayerNode.scheduleBuffer(outputBuffer)

        if !audioPlayerNode.isPlaying {
            audioPlayerNode.play()
            isPlaying = true
        }

        // clear the buffer after processing
        audioDataBuffer.removeAll()
    }

    private func processTapBuffer(_ buffer: AVAudioPCMBuffer) {
        if !isAppReady || !isPlaying { return }

        guard let channelData = buffer.floatChannelData?[0] else { return }
        let frameCount = Int(buffer.frameLength)

        for i in 0..<frameCount {
            let sample = channelData[i]
            let normalizedSample = isUsing16BitFormat ? Float(Int16(sample * Float(Int16.max))) / Float(Int16.max) : sample
            audioSampleBuffer.append(normalizedSample)
            if audioSampleBuffer.count >= audioSampleBufferSize {
                super.sendEvent("onAudioSampleReceived", [
                    "sampleData": audioSampleBuffer
                ])
                audioSampleBuffer.removeAll(keepingCapacity: true)
            }
        }
    }

    private func stopPlayback() {
        isPlaying = false
        if let playerNode = audioPlayerNode, playerNode.isPlaying {
            playerNode.stop()
        }
    }

    private func stopEngine() {
        if let engine = audioEngine, engine.isRunning {
            engine.stop()
        }
    }

    private func removeAudioTap() {
        audioEngine?.mainMixerNode.removeTap(onBus: 0)
    }

    private func deactivateAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            sendLog("Error deactivating audio session: \(error.localizedDescription)")
        }
    }

    private func resetState() {
        audioEngine = nil
        audioPlayerNode = nil
        audioFormat = nil
        audioDataBuffer.removeAll()
        audioSampleBuffer.removeAll()
        isPlaying = false
        isAppReady = false
    }

    private func trimAudio(inputPath: String, outputPath: String, startMs: Double, durationMs: Double) async throws {
        let inputURL = URL(fileURLWithPath: inputPath)
        let outputURL = URL(fileURLWithPath: outputPath)
        let asset = AVAsset(url: inputURL)

        let startTime = CMTime(value: Int64(startMs), timescale: 1000)
        let duration = CMTime(value: Int64(durationMs), timescale: 1000)
        let timeRange = CMTimeRange(start: startTime, duration: duration)

        guard let exportSession = AVAssetExportSession(
            asset: asset,
            presetName: AVAssetExportPresetAppleM4A
        ) else {
            throw NSError(domain: "AudioTrimmerError", code: 5, userInfo: [NSLocalizedDescriptionKey: "Failed to create export session"])
        }

        exportSession.outputURL = outputURL
        exportSession.outputFileType = .m4a
        exportSession.timeRange = timeRange
        exportSession.metadata = asset.metadata

        await exportSession.export()

        if let error = exportSession.error {
            self.sendLog("Export failed: \(error.localizedDescription)")
            throw NSError(domain: "AudioTrimmerError", code: 6, userInfo: [NSLocalizedDescriptionKey: "Export failed: \(error.localizedDescription)"])
        }
    }

    /*AsyncFunction("playAudioFromData") { (audioData: [String: Int]) -> String in
        do {
            let sortedData = audioData.sorted { Int($0.key)! < Int($1.key)! }
            let byteArray = sortedData.map { UInt8($0.value) }

            let data = Data(byteArray)
            self.audioPlayer = try AVAudioPlayer(data: data)
            self.audioPlayer?.play()

            return "Playing audio"
        } catch {
            return "Error playing audio: \(error.localizedDescription)"
        }
    }*/

    /*private func playAudio(data: Data, sampleRate: Int, channels: Int) {
        guard let audioFormat = self.audioFormat, let audioPlayerNode = self.audioPlayerNode else {
            sendLog("Audio format or player node not set")
            return
        }

        let buffer = AVAudioPCMBuffer(pcmFormat: audioFormat, frameCapacity: AVAudioFrameCount(data.count) / audioFormat.streamDescription.pointee.mBytesPerFrame)!
        buffer.frameLength = buffer.frameCapacity
        let audioBufferPointer = buffer.audioBufferList.pointee.mBuffers
        data.copyBytes(to: audioBufferPointer.mData!.assumingMemoryBound(to: UInt8.self), count: Int(audioBufferPointer.mDataByteSize))

        audioPlayerNode.scheduleBuffer(buffer)

        audioPlayerNode.play()
    }*/
}
