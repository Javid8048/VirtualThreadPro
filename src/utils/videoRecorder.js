/**
 * CanvasVideoRecorder
 * High-performance 60 FPS hardware video recorder for VirtualThreads 3D Studio.
 *
 * Captures silky-smooth 60 FPS video directly from the WebGL canvas using MediaRecorder
 * with hardware-accelerated GPU stream encoding, eliminating all 2D CPU readback stalls,
 * dropped frames, and timing jitter.
 *
 * Also provides native Live Screen Recording via navigator.mediaDevices.getDisplayMedia.
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
    this.screenStream = null;
  }

  /**
   * Selects the highest quality supported MIME type for 60 FPS recording.
   */
  static getSupportedMimeType(preferredFormat = 'webm') {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return 'video/webm';
    }

    if (preferredFormat === 'mp4') {
      const mp4Candidates = [
        'video/mp4;codecs=avc1.640028,mp4a.40.2',
        'video/mp4;codecs=avc1',
        'video/mp4'
      ];
      for (const mime of mp4Candidates) {
        if (MediaRecorder.isTypeSupported(mime)) return mime;
      }
    }

    const webmCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    for (const mime of webmCandidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    }

    return 'video/webm';
  }

  /**
   * Starts recording the 3D studio canvas directly at 60 FPS with hardware acceleration.
   * @param {Object} options
   * @param {number} options.durationSeconds - Duration in seconds (1 to 30)
   * @param {'mobile' | 'desktop' | 'square'} options.format - Video aspect ratio
   * @param {'showcase360' | 'current'} options.motion - Motion mode
   * @param {'webm' | 'mp4'} options.preferredFormat - Preferred video format
   * @param {string} options.backgroundColor - Studio background color
   * @param {Function} onProgress - Callback (pct: number, elapsedSec: number)
   */
  startRecording(
    {
      durationSeconds = 5,
      format = 'desktop',
      motion = 'showcase360',
      preferredFormat = 'webm',
      backgroundColor = '#121318'
    } = {},
    onProgress = () => {}
  ) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.canvas) {
          reject(new Error('Canvas element is not available for video recording.'));
          return;
        }

        // Direct hardware-accelerated 60 FPS stream from WebGL canvas
        // Eliminates CPU readback stalls and yields screen-recording smoothness
        const stream = this.canvas.captureStream ? this.canvas.captureStream(60) : null;
        if (!stream) {
          reject(new Error('Browser does not support canvas video capture (captureStream).'));
          return;
        }

        const selectedMime = CanvasVideoRecorder.getSupportedMimeType(preferredFormat);
        const options = {
          mimeType: selectedMime,
          videoBitsPerSecond: 16000000 // 16 Mbps for pristine 60 FPS high-motion clarity
        };

        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, options);

        // Instruct SceneManager to initialize 60 FPS fixed delta stepping and backdrop
        if (this.sceneManager && this.sceneManager.startVideoRecording) {
          this.sceneManager.startVideoRecording({
            fps: 60,
            durationSeconds,
            format,
            motion,
            backgroundColor
          });
        }

        const cleanup = () => {
          this.isRecording = false;
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
          const isMp4 = selectedMime.includes('mp4');
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
        const totalDurationMs = Math.max(1, durationSeconds * 1000);
        const startTime = performance.now();

        // High-precision smooth progress updater
        this.progressTimer = setInterval(() => {
          if (!this.isRecording) {
            clearInterval(this.progressTimer);
            return;
          }
          const elapsedMs = performance.now() - startTime;
          const pct = Math.min(99, Math.round((elapsedMs / totalDurationMs) * 100));
          const sec = Math.min(durationSeconds, elapsedMs / 1000);
          onProgress(pct, sec);
        }, 80);

        // Start continuous recording (no micro-timeslicing to allow optimal hardware B-frame compression)
        this.mediaRecorder.start();

        // Exact timer to conclude recording at requested duration
        this.stopTimeout = setTimeout(() => {
          this.stopEarly();
        }, totalDurationMs + 80);
      } catch (err) {
        this.isRecording = false;
        if (this.sceneManager && this.sceneManager.stopVideoRecording) {
          this.sceneManager.stopVideoRecording();
        }
        reject(err);
      }
    });
  }

  /**
   * Starts a live screen recording session capturing user interactions in the studio.
   * Uses navigator.mediaDevices.getDisplayMedia.
   */
  async startScreenRecording(onProgress = () => {}, onStoppedByUser = () => {}) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen recording is not supported in this browser environment.');
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 60,
        displaySurface: 'browser'
      },
      audio: false
    });

    this.screenStream = stream;
    const selectedMime = CanvasVideoRecorder.getSupportedMimeType('webm');

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 16000000
    });

    this.isRecording = true;
    const startTime = performance.now();
    this.progressTimer = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(this.progressTimer);
        return;
      }
      const elapsedSec = (performance.now() - startTime) / 1000;
      onProgress(elapsedSec);
    }, 200);

    return new Promise((resolve, reject) => {
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      const handleStop = () => {
        this.isRecording = false;
        if (this.progressTimer) {
          clearInterval(this.progressTimer);
          this.progressTimer = null;
        }
        if (this.screenStream) {
          this.screenStream.getTracks().forEach((track) => track.stop());
          this.screenStream = null;
        }
        if (this.recordedChunks.length === 0) {
          reject(new Error('No screen recording frames captured.'));
          return;
        }
        const blob = new Blob(this.recordedChunks, { type: selectedMime });
        const isMp4 = selectedMime.includes('mp4');
        resolve({ blob, mimeType: selectedMime, isMp4, isScreenRecording: true });
      };

      this.mediaRecorder.onstop = handleStop;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (this.isRecording) {
            this.stopEarly();
            onStoppedByUser();
          }
        };
      }

      this.mediaRecorder.start();
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
      if (this.sceneManager && this.sceneManager.stopVideoRecording) {
        this.sceneManager.stopVideoRecording();
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.requestData();
        } catch (err) {}
        try {
          this.mediaRecorder.stop();
        } catch (err) {}
      }

      if (this.screenStream) {
        this.screenStream.getTracks().forEach((track) => track.stop());
        this.screenStream = null;
      }

      // Safety finalization fallback if onstop is delayed
      this.safetyFinalizeTimeout = setTimeout(() => {
        if (typeof this._finalizePromise === 'function') {
          this._finalizePromise();
        }
      }, 700);
    }
  }

  downloadBlob(blob, filename = 'virtualthreads-mockup.webm') {
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
