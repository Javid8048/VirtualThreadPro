/**
 * CanvasVideoRecorder
 * High-performance hardware video recorder for VirtualThreads 3D Studio.
 *
 * Captures silky-smooth video directly from the WebGL canvas using MediaRecorder
 * with hardware-accelerated GPU stream encoding into universal MP4 video,
 * preserving the exact camera zoom, background, lighting, and animation speeds.
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
  }

  /**
   * Selects the highest quality supported MIME type for video recording.
   * Universal MP4 container with H.264/AVC hardware acceleration is prioritized.
   */
  static getSupportedMimeType(preferredFormat = 'mp4') {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return 'video/mp4';
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

    return 'video/mp4';
  }

  /**
   * Starts recording the 3D studio canvas directly with hardware acceleration.
   * Preserves the active zoom, camera angle, animation speed, and studio background.
   * @param {Object} options
   * @param {number} options.fps - Frame rate (24, 30, or 60)
   * @param {number} options.durationSeconds - Duration in seconds (1 to 30)
   * @param {'mobile' | 'desktop' | 'square'} options.format - Video aspect ratio
   * @param {'current' | 'showcase360'} options.motion - Motion mode
   * @param {'mp4'} options.preferredFormat - Preferred video format
   * @param {string} options.backgroundColor - Studio background color
   * @param {Function} onProgress - Callback (pct: number, elapsedSec: number)
   */
  startRecording(
    {
      fps = 30,
      durationSeconds = 5,
      format = 'desktop',
      motion = 'current',
      preferredFormat = 'mp4',
      backgroundColor = null
    } = {},
    onProgress = () => {}
  ) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.canvas) {
          reject(new Error('Canvas element is not available for video recording.'));
          return;
        }

        const targetFps = Number(fps) || 30;

        // Instruct SceneManager to initialize video recording session and setup target canvas
        if (this.sceneManager && this.sceneManager.startVideoRecording) {
          this.sceneManager.startVideoRecording({
            fps: targetFps,
            durationSeconds,
            format,
            motion,
            backgroundColor
          });
        }

        // Direct hardware-accelerated video stream from formatted recording canvas
        const captureCanvas = (this.sceneManager && this.sceneManager.recordingCanvas)
          ? this.sceneManager.recordingCanvas
          : this.canvas;

        const stream = captureCanvas.captureStream ? captureCanvas.captureStream(targetFps) : null;

        if (!stream) {
          if (this.sceneManager && this.sceneManager.stopVideoRecording) {
            this.sceneManager.stopVideoRecording();
          }
          reject(new Error('Browser does not support canvas video capture (captureStream).'));
          return;
        }

        const selectedMime = CanvasVideoRecorder.getSupportedMimeType(preferredFormat);
        const options = {
          mimeType: selectedMime,
          videoBitsPerSecond: 6000000 // 6 Mbps: pristine 1080p clarity with smooth hardware encoding
        };

        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, options);

        // Keep display active during recording to prevent throttling
        let screenWakeLock = null;
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          navigator.wakeLock.request('screen')
            .then((lock) => { screenWakeLock = lock; })
            .catch(() => {});
        }

        const cleanup = () => {
          this.isRecording = false;
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

          const blob = new Blob(this.recordedChunks, { type: selectedMime });
          const isMp4 = !selectedMime.includes('webm');
          resolve({ blob, mimeType: selectedMime, isMp4, format, durationSeconds });
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

        // High-precision smooth progress updater synchronized with real wall-clock time
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

        // Stop timer matching requested duration
        this.stopTimeout = setTimeout(() => {
          this.stopEarly();
        }, totalDurationMs);
      } catch (err) {
        this.isRecording = false;
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

      // Safety finalization fallback if onstop is delayed
      this.safetyFinalizeTimeout = setTimeout(() => {
        if (typeof this._finalizePromise === 'function') {
          this._finalizePromise();
        }
      }, 500);
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
