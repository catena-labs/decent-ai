package expo.modules.nativeaudiomodule

import android.content.Context
import android.content.Intent
import android.content.BroadcastReceiver
import android.content.IntentFilter
import android.media.*
import android.media.audiofx.AcousticEchoCanceler
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.LinkedBlockingQueue
import kotlin.concurrent.thread
import java.io.File
import java.io.IOException

class NativeAudioModule : Module() {
  private var mediaPlayer: MediaPlayer? = null
  private var audioTrack: AudioTrack? = null
  private var audioDataStream: ByteArrayOutputStream? = null
  private val audioQueue = LinkedBlockingQueue<ByteArray>()
  private var isPlaying = false
  private var playbackThread: Thread? = null
  private var echoCanceler: AcousticEchoCanceler? = null

  private var channelConfig = AudioFormat.CHANNEL_OUT_MONO
  private var audioFormat: Int = AudioFormat.ENCODING_PCM_16BIT
    get() = if (isUsing16BitFormat) AudioFormat.ENCODING_PCM_16BIT else AudioFormat.ENCODING_PCM_FLOAT
  private var sampleRate: Int = 16000
    get() = if (isUsing16BitFormat) 16000 else 22050

  private val audioSampleBufferSize = 1024
  private val audioSampleFloatArrayBuffer = FloatArray(audioSampleBufferSize)
  private val audioSampleShortArrayBuffer = ShortArray(audioSampleBufferSize)
  private var audioSampleBufferIndex = 0

  private var isAppReady = false
  private var isHeadsetInUse: Boolean = false
  private var isUsing16BitFormat: Boolean = false

  override fun definition() = ModuleDefinition {
    Name("NativeAudioModule")

    Events("onLog", "onAudioSampleReceived")

    Function("setAppReady") { using16BitFormat: Boolean ->
      isUsing16BitFormat = using16BitFormat
      isHeadsetInUse = isHeadphoneConnected()
      registerAudioRoutingReceiver()
      isAppReady = true
      "App ready"
    }

    Function("cleanupNativeAudio") {
        cleanup()
        "Audio module cleaned up"
    }

    OnDestroy {
        cleanup()
        unregisterAudioRoutingReceiver()
    }

    AsyncFunction("playAudioFromBase64") { base64String: String ->
      try {
        val audioData = Base64.decode(base64String, Base64.DEFAULT)
        audioQueue.put(audioData)
        if (!isPlaying) {
          startPlayback()
        }
        "Audio data queued for playback"
      } catch (e: Exception) {
        val errMsg = "Error queuing audio: ${e.localizedMessage}"
        e.printStackTrace()
        sendLog(errMsg)
        errMsg
      }
    }

    AsyncFunction("prepareAudioPlayback") { size: Int ->
      audioDataStream = ByteArrayOutputStream(size)
      "Prepared for audio playback"
    }

    AsyncFunction("appendAudioChunk") { chunk: List<Int> ->
      audioDataStream?.write(chunk.map { it.toByte() }.toByteArray())
      "Chunk appended"
    }

    AsyncFunction("startAudioPlayback") {
      try {
        val audioData = audioDataStream?.toByteArray() ?: throw IllegalStateException("No audio data available")
        audioQueue.put(audioData)
        if (!isPlaying) {
          startPlayback()
        }
        val msg = "Playing audio"
        sendLog(msg)
        msg
      } catch (e: Exception) {
        val errMsg = "Error playing audio: ${e.localizedMessage}"
        e.printStackTrace()
        sendLog(errMsg)
        errMsg
      } finally {
        audioDataStream?.close()
        audioDataStream = null
      }
    }

    AsyncFunction("startAudioPlaybackWithPlayer") {
      try {
        val audioData = audioDataStream?.toByteArray() ?: throw IllegalStateException("No audio data available")

        cleanupMediaPlayer()
        mediaPlayer = MediaPlayer().apply {
          setDataSource(ByteArrayMediaDataSource(audioData))
          prepare()
          start()
        }

        "Playing audio"
      } catch (e: Exception) {
        val errMsg = "Error playing audio: ${e.localizedMessage}"
        e.printStackTrace()
        sendLog(errMsg)
        errMsg
      } finally {
        audioDataStream?.close()
        audioDataStream = null
      }
    }

    AsyncFunction("stopAudio") {
      stopPlayback()
      cleanupMediaPlayer()
      "Audio playback stopped"
    }

    AsyncFunction("trimAudio") { inputPath: String, outputPath: String, startMs: Int, durationMs: Int ->
      trimAudio(inputPath, outputPath, startMs.toLong(), durationMs.toLong())
    }

    Function("isHeadphonesConnected") {
      isHeadsetInUse
    }
  }

  private fun sendLog(message: String) {
    println("Android NativeAudioModule: $message")
    if (isAppReady) {
      sendEvent("onLog", mapOf("message" to message))
    }
  }

  private fun isHeadphoneConnected(): Boolean {
    val context = requireNotNull(appContext.reactContext) {
        "React context is not available"
    }
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    val devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
    return devices.any { device ->
      device.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
      device.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
      device.type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
      device.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
    }
  }

  private val audioRoutingReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        when (intent?.action) {
          AudioManager.ACTION_AUDIO_BECOMING_NOISY,
          Intent.ACTION_HEADSET_PLUG,
          BluetoothDevice.ACTION_ACL_CONNECTED,
          BluetoothDevice.ACTION_ACL_DISCONNECTED,
          BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED -> {
              isHeadsetInUse = isHeadphoneConnected()
          }
      }
    }
  }

  private fun registerAudioRoutingReceiver() {
      val context = requireNotNull(appContext.reactContext) {
          "React context is not available"
      }
      val filter = IntentFilter().apply {
        addAction(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
        addAction(Intent.ACTION_HEADSET_PLUG)
        addAction(BluetoothDevice.ACTION_ACL_CONNECTED)
        addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED)
        addAction(BluetoothAdapter.ACTION_CONNECTION_STATE_CHANGED)
    }
      context.registerReceiver(audioRoutingReceiver, filter)
  }

  private fun unregisterAudioRoutingReceiver() {
      try {
          val context = requireNotNull(appContext.reactContext) {
              "React context is not available"
          }
          context.unregisterReceiver(audioRoutingReceiver)
      } catch (e: IllegalArgumentException) {
          sendLog("Receiver already unregistered: ${e.localizedMessage}")
      }
  }

  private fun startPlayback() {
    if (isPlaying) return
    isPlaying = true

    playbackThread = thread(start = true) {
      val bufferSize = AudioTrack.getMinBufferSize(sampleRate, channelConfig, audioFormat)
      val optimalBufferSize = bufferSize * 2

      try {
        audioTrack = AudioTrack.Builder()
          .setAudioAttributes(AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION_SIGNALLING)
              .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
              .build())
          .setAudioFormat(AudioFormat.Builder()
              .setEncoding(audioFormat)
              .setSampleRate(sampleRate)
              .setChannelMask(channelConfig)
              .build())
          .setBufferSizeInBytes(optimalBufferSize)
          .setTransferMode(AudioTrack.MODE_STREAM)
          .build()

        audioTrack?.play()

        // add echo cancelation if it is available
        if (AcousticEchoCanceler.isAvailable()) {
          echoCanceler = AcousticEchoCanceler.create(audioTrack?.audioSessionId ?: 0)
          echoCanceler?.enabled = true
        }

        /* 32BIT VERSION */
        if (audioFormat == AudioFormat.ENCODING_PCM_FLOAT) {
          while (isPlaying) {
            val audioData = audioQueue.take() // this will block until data is available
            val floatBuffer = ByteBuffer.wrap(audioData).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer()
            val floatArray = FloatArray(floatBuffer.remaining())
            floatBuffer.get(floatArray)
            audioTrack?.write(floatArray, 0, floatArray.size, AudioTrack.WRITE_BLOCKING)

            // process audio samples and emit events
            process32bitSamples(floatArray)
          }
        }
        /* 16BIT VERSION */
        else {
          while (isPlaying) {
            val audioData = audioQueue.take() // this will block until data is available
            val shortBuffer = ByteBuffer.wrap(audioData).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer()
            val shortArray = ShortArray(shortBuffer.remaining())
            shortBuffer.get(shortArray)
            audioTrack?.write(shortArray, 0, shortArray.size, AudioTrack.WRITE_BLOCKING)

            // process audio samples and emit events
            process16bitSamples(shortArray)
          }
        }
      } finally {
        echoCanceler?.release()
        echoCanceler = null
        audioTrack?.stop()
        audioTrack?.release()
        audioTrack = null
      }
    }
  }

  private fun process16bitSamples(samples: ShortArray) {
    if (!isAppReady) return

    for (sample in samples) {
      audioSampleShortArrayBuffer[audioSampleBufferIndex] = sample
      audioSampleBufferIndex++

      if (audioSampleBufferIndex >= audioSampleBufferSize) {
        val sampleList = audioSampleShortArrayBuffer.map { it.toDouble() / Short.MAX_VALUE } // normalize to [-1.0, 1.0]
        sendEvent("onAudioSampleReceived", mapOf("sampleData" to sampleList))
        audioSampleBufferIndex = 0
      }
    }
  }

  private fun process32bitSamples(samples: FloatArray) {
    if (!isAppReady) return

    for (sample in samples) {
      audioSampleFloatArrayBuffer[audioSampleBufferIndex] = sample
      audioSampleBufferIndex++

      if (audioSampleBufferIndex >= audioSampleBufferSize) {
        // convert FloatArray to List<Double> for JSON serialization
        val sampleList = audioSampleFloatArrayBuffer.map { it.toDouble() }
        sendEvent("onAudioSampleReceived", mapOf("sampleData" to sampleList))
        audioSampleBufferIndex = 0
      }
    }
  }

  private fun stopPlayback() {
    isPlaying = false
    try {
      audioQueue.put(ByteArray(0)) // unblock the queue
    } catch (e: InterruptedException) {
      Thread.currentThread().interrupt()
    }
    playbackThread?.join()
    audioQueue.clear()
  }

  private fun cleanup() {
      stopPlayback()
      cleanupMediaPlayer()
      audioDataStream?.close()
      audioDataStream = null
      audioQueue.clear()
      isAppReady = false
      echoCanceler?.release()
      echoCanceler = null
  }

  private fun cleanupMediaPlayer() {
    mediaPlayer?.apply {
      if (isPlaying) {
        stop()
      }
      release()
    }
    mediaPlayer = null
  }

  private inner class ByteArrayMediaDataSource(private val data: ByteArray) : MediaDataSource() {
    override fun readAt(position: Long, buffer: ByteArray, offset: Int, size: Int): Int {
      if (position >= data.size) return -1
      val remainingSize = data.size - position.toInt()
      val readSize = minOf(size, remainingSize)
      System.arraycopy(data, position.toInt(), buffer, offset, readSize)
      return readSize
    }

    override fun getSize(): Long = data.size.toLong()

    override fun close() {}
  }

  private fun trimAudio(inputPath: String, outputPath: String, startMs: Long, durationMs: Long) {
      val extractor = MediaExtractor()
      try {
          extractor.setDataSource(inputPath)

          val trackIndex = selectAudioTrack(extractor)
          if (trackIndex < 0) {
              throw IOException("No audio track found in file.")
          }
          extractor.selectTrack(trackIndex)

          val format = extractor.getTrackFormat(trackIndex)
          val mime = format.getString(MediaFormat.KEY_MIME) ?: ""
          val maxInputSize = format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE)

          val buffer = ByteBuffer.allocate(maxInputSize)
          val outputFile = File(outputPath)

          val mediaMuxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
          val audioTrackIndex = mediaMuxer.addTrack(format)
          mediaMuxer.start()

          val startUs = startMs * 1000L
          val endUs = (startMs + durationMs) * 1000L
          extractor.seekTo(startUs, MediaExtractor.SEEK_TO_CLOSEST_SYNC)

          while (true) {
              val sampleTime = extractor.sampleTime
              if (sampleTime == -1L || sampleTime > endUs) {
                  break
              }

              val sampleSize = extractor.readSampleData(buffer, 0)
              if (sampleSize < 0) {
                  break
              }

              val bufferInfo = android.media.MediaCodec.BufferInfo()
              bufferInfo.presentationTimeUs = sampleTime - startUs
              bufferInfo.size = sampleSize
              bufferInfo.offset = 0
              bufferInfo.flags = extractor.sampleFlags

              mediaMuxer.writeSampleData(audioTrackIndex, buffer, bufferInfo)
              extractor.advance()
          }

          mediaMuxer.stop()
          mediaMuxer.release()
      } catch (e: IOException) {
          throw IOException("Error trimming audio: ${e.localizedMessage}", e)
      } finally {
          extractor.release()
      }
  }

  private fun selectAudioTrack(extractor: MediaExtractor): Int {
      for (i in 0 until extractor.trackCount) {
          val format = extractor.getTrackFormat(i)
          val mime = format.getString(MediaFormat.KEY_MIME)
          if (mime != null && mime.startsWith("audio/")) {
              return i
          }
      }
      return -1
  }


}
