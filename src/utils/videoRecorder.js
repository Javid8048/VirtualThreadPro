/**
 * CanvasVideoRecorder
 * High-performance hardware video and screen recorder for VirtualThreads 3D Studio.
 *
 * Supports both ultra-smooth 60 FPS browser tab screen recording via getDisplayMedia
 * and direct hardware-accelerated WebGL canvas stream capture into universal MP4 video.
 */
export class CanvasVideoRecorder {
  constructor(canvasOrSceneManager) {
    if (canvasOrSceneManager && canvasOrSceneManager.renderer) {
      this.sceneManager = canvasOrSceneManager;
      this.canvas = canvasOrSceneManager.renderer.domElement;
    } else {
      this.sceneManager = null;
      this.canvas = canvasOrSceneManager;
    }

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.progressTimer = null;
    this.stopTimeout = null;
    this.safetyFinalizeTimeout = null;
    this._finalizePromise = null;
    this.activeStream = null;
    this.isScreenCapture = false;
  }

  /**
   * Selects the highest quality supported MIME type for video recording.
   * Universal MP4 container with H.264/AVC hardware acceleration is prioritized.
   */
  static getSupportedMimeType(preferredFormat = 'mp4') {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return '';
    }

    const mp4Candidates = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1.640028,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4;codecs=h264',
      'video/mp4'
    ];
    for (const mime of mp4Candidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    }

    const fallbackCandidates = [
      'video/webm;codecs=h264',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    for (const mime of fallbackCandidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    }

    return '';
  }

  /**
   * Starts recording the 3D studio with silky-smooth 60 FPS motion.
   * Prioritizes native browser screen recording (getDisplayMedia) for 100% smooth capture.
   * @param {Object} options
   * @param {number} options.fps - Frame rate (30 or 60)
   * @param {number} options.durationSeconds - Duration in seconds (1 to 30)
   * @param {'mobile' | 'desktop' | 'square'} options.format - Video aspect ratio
   * @param {'current' | 'showcase360'} options.motion - Motion mode
   * @param {'screen' | 'canvas'} options.source - 'screen' for ultra-smooth screen capture, 'canvas' for direct WebGL
   * @param {'mp4'} options.preferredFormat - Preferred video format
   * @param {string} options.backgroundColor - Studio background color
   * @param {HTMLElement} options.cropElement - Element to crop screen recording to (Region Capture)
   * @param {Function} onProgress - Callback (pct: number, elapsedSec: number)
   */
  async startRecording(
    {
      fps = 60,
      durationSeconds = 5,
      format = 'desktop',
      motion = 'current',
      source = 'screen',
      preferredFormat = 'mp4',
      backgroundColor = null,
      cropElement = null
    } = {},
    onProgress = () => {}
  ) {
    if (!this.canvas && !this.sceneManager) {
      throw new Error('Canvas or 3D scene is not available for video recording.');
    }

    const targetFps = Number(fps) || 60;
    let stream = null;
    let isScreen = false;

    // 1. Screen Recording via getDisplayMedia for silky-smooth 60 FPS capture
    if (source === 'screen' && typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser',
            frameRate: { ideal: targetFps, max: 60 },
            cursor: 'never'
          },
          audio: false,
          preferCurrentTab: true,
          selfBrowserSurface: 'include'
        });
        isScreen = true;

        // If Region Capture is supported (Chrome 104+), crop screen capture directly to 3D studio viewport
        const [videoTrack] = stream.getVideoTracks();
        const targetCropEl = cropElement || (this.sceneManager && this.sceneManager.container) || this.canvas;
        if (window.CropTarget && typeof CropTarget.fromElement === 'function' && videoTrack && typeof videoTrack.cropTo === 'function' && targetCropEl) {
          try {
            const cropTarget = await CropTarget.fromElement(targetCropEl);
            await videoTrack.cropTo(cropTarget);
          } catch (cropErr) {
            // Region crop fallback - continues with full tab stream smoothly
          }
        }
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
          throw new Error('Screen recording permission was cancelled. You can grant permission or switch to Direct Canvas mode.');
        }
        console.warn('Screen recording displayMedia failed, attempting direct canvas stream:', err);
      }
    }

    // 2. Direct Canvas stream fallback
    if (!stream) {
      const captureCanvas = (this.sceneManager && this.sceneManager.recordingCanvas)
        ? this.sceneManager.recordingCanvas
        : this.canvas;

      if (captureCanvas && captureCanvas.captureStream) {
        stream = captureCanvas.captureStream(targetFps);
      }
    }

    if (!stream) {
      throw new Error('Browser does not support canvas or screen video capture.');
    }

    this.activeStream = stream;
    this.isScreenCapture = isScreen;

    // Listen to native "Stop sharing" event from browser banner to stop cleanly
    const [streamTrack] = stream.getVideoTracks();
    if (streamTrack) {
      streamTrack.addEventListener('ended', () => {
        this.stopEarly();
      });
    }

    // Initialize SceneManager video session (avoiding heavy canvas resize stalls during screen recording)
    if (this.sceneManager && this.sceneManager.startVideoRecording) {
      this.sceneManager.startVideoRecording({
        fps: targetFps,
        durationSeconds,
        format,
        motion,
        backgroundColor,
        isScreenSource: isScreen
      });
    }

    return new Promise((resolve, reject) => {
      try {
        const selectedMime = CanvasVideoRecorder.getSupportedMimeType(preferredFormat);
        const options = selectedMime
          ? { mimeType: selectedMime, videoBitsPerSecond: 8000000 }
          : { videoBitsPerSecond: 8000000 };

        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, options);

        // Keep display awake during recording
        let screenWakeLock = null;
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          navigator.wakeLock.request('screen')
            .then((lock) => { screenWakeLock = lock; })
            .catch(() => {});
        }

        const cleanup = () => {
          this.isRecording = false;
          if (this.activeStream) {
            try {
              this.activeStream.getTracks().forEach((t) => t.stop());
            } catch (e) {}
            this.activeStream = null;
          }
          if (this.sceneManager) {
            this.sceneManager.onRecordingFrame = null;
          }
          if (screenWakeLock) {
            screenWakeLock.release().catch(() => {});
            screenWakeLock = null;
          }
          if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
          }
          if (this.stopTimeout) {
            clearTimeout(this.stopTimeout);
            this.stopTimeout = null;
          }
          if (this.safetyFinalizeTimeout) {
            clearTimeout(this.safetyFinalizeTimeout);
            this.safetyFinalizeTimeout = null;
          }
          if (this.sceneManager && this.sceneManager.stopVideoRecording) {
            this.sceneManager.stopVideoRecording();
          }
        };

        let isFinalized = false;
        const finalize = () => {
          if (isFinalized) return;
          isFinalized = true;
          cleanup();
          onProgress(100, durationSeconds);

          if (this.recordedChunks.length === 0) {
            reject(new Error('No video frames were captured. Please try again.'));
            return;
          }

          const mimeResult = selectedMime || this.mediaRecorder.mimeType || 'video/mp4';
          const blob = new Blob(this.recordedChunks, { type: mimeResult });
          const isMp4 = !mimeResult.includes('webm');
          resolve({ blob, mimeType: mimeResult, isMp4, format, durationSeconds, isScreenCapture: isScreen });
        };

        this._finalizePromise = finalize;

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          finalize();
        };

        this.mediaRecorder.onerror = (err) => {
          cleanup();
          reject(err);
        };

        this.isRecording = true;
        const totalDurationMs = Math.max(1000, durationSeconds * 1000);
        const startTime = performance.now();

        // High-precision smooth progress updates
        this.progressTimer = setInterval(() => {
          if (!this.isRecording) {
            clearInterval(this.progressTimer);
            return;
          }
          const elapsedMs = performance.now() - startTime;
          const pct = Math.min(99, Math.round((elapsedMs / totalDurationMs) * 100));
          const sec = Math.min(durationSeconds, +(elapsedMs / 1000).toFixed(1));
          onProgress(pct, sec);
        }, 50);

        // Start continuous recording
        this.mediaRecorder.start(100);

        // Conclude recording after specified duration
        this.stopTimeout = setTimeout(() => {
          this.stopEarly();
        }, totalDurationMs);
      } catch (err) {
        this.isRecording = false;
        if (this.activeStream) {
          try {
            this.activeStream.getTracks().forEach((t) => t.stop());
          } catch (e) {}
          this.activeStream = null;
        }
        if (this.sceneManager && this.sceneManager.stopVideoRecording) {
          this.sceneManager.stopVideoRecording();
        }
        reject(err);
      }
    });
  }

  stopEarly() {
    if (this.isRecording) {
      this.isRecording = false;

      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
      if (this.stopTimeout) {
        clearTimeout(this.stopTimeout);
        this.stopTimeout = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.requestData();
        } catch (err) {}
        try {
          this.mediaRecorder.stop();
        } catch (err) {}
      }

      // Safety finalization fallback if onstop event is delayed
      this.safetyFinalizeTimeout = setTimeout(() => {
        if (typeof this._finalizePromise === 'function') {
          this._finalizePromise();
        }
      }, 400);
    }
  }

  downloadBlob(blob, filename = 'virtualthreads-animation.mp4') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 250);
  }
}
