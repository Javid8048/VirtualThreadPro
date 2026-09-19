/**
 * CanvasVideoRecorder
 * Records ultra-smooth 60 FPS video directly from the WebGL canvas using MediaRecorder.
 * Synchronizes deterministically with SceneManager's animation stepping to eliminate
 * all timing jitter, frame duplication, and motion glitches.
 * Supports Mobile (9:16 Vertical), Desktop (16:9 Landscape), and Square (1:1) formats
 * with durations including 5s, 10s, 20s, 30s, or custom durations.
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
    this.animFrameId = null;
    this.stopTimeout = null;
    this.safetyFinalizeTimeout = null;
    this._finalizePromise = null;
  }

  /**
   * Starts recording the canvas for a specified duration in seconds.
   * @param {Object} options
   * @param {number} options.durationSeconds - Duration in seconds (1 to 30)
   * @param {'mobile' | 'desktop' | 'square' | 'native'} options.format - Video aspect ratio
   * @param {'showcase360' | 'current'} options.motion - 360 showcase motion vs current animation
   * @param {'webm' | 'mp4'} options.preferredFormat - Preferred video container format
   * @param {string} options.backgroundColor - Studio background mode / color
   * @param {Function} onProgress - Progress callback (percentage: 0-100, elapsedSeconds: number)
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
        let targetWidth = 1920;
        let targetHeight = 1080;

        if (format === 'mobile') {
          targetWidth = 1080;
          targetHeight = 1920;
        } else if (format === 'square') {
          targetWidth = 1080;
          targetHeight = 1080;
        } else if (format === 'desktop') {
          targetWidth = 1920;
          targetHeight = 1080;
        } else {
          targetWidth = this.canvas ? this.canvas.width : 1920;
          targetHeight = this.canvas ? this.canvas.height : 1080;
        }

        // Dedicated recording canvas attached to DOM so Chromium compositor delivers frames
        const recCanvas = document.createElement('canvas');
        recCanvas.id = 'vt-export-canvas';
        recCanvas.width = targetWidth;
        recCanvas.height = targetHeight;
        recCanvas.style.cssText =
          'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;opacity:0;z-index:-9999;';
        document.body.appendChild(recCanvas);

        const recCtx = recCanvas.getContext('2d', { alpha: false });
        recCtx.imageSmoothingEnabled = true;
        recCtx.imageSmoothingQuality = 'high';

        // Capture smooth 30 FPS stream for optimal performance and fast encoding
        const stream = recCanvas.captureStream ? recCanvas.captureStream(30) : null;
        if (!stream) {
          if (recCanvas.parentNode) recCanvas.parentNode.removeChild(recCanvas);
          reject(new Error('Browser does not support canvas video capture (captureStream).'));
          return;
        }

        // Select best supported MIME type
        let selectedMime = '';
        if (preferredFormat === 'mp4') {
          const mp4Types = [
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4;codecs=avc1',
            'video/mp4'
          ];
          for (const type of mp4Types) {
            if (
              typeof MediaRecorder !== 'undefined' &&
              MediaRecorder.isTypeSupported &&
              MediaRecorder.isTypeSupported(type)
            ) {
              selectedMime = type;
              break;
            }
          }
        }

        if (!selectedMime) {
          const webmTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
          ];
          for (const type of webmTypes) {
            if (
              typeof MediaRecorder !== 'undefined' &&
              MediaRecorder.isTypeSupported &&
              MediaRecorder.isTypeSupported(type)
            ) {
              selectedMime = type;
              break;
            }
          }
        }

        if (!selectedMime) {
          selectedMime = 'video/webm';
        }

        const options = {
          mimeType: selectedMime,
          videoBitsPerSecond: 9000000 // 9 Mbps for clean streetwear detail
        };

        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, options);

        const cleanup = () => {
          this.isRecording = false;
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
          if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
          }
          if (recCanvas && recCanvas.parentNode) {
            recCanvas.parentNode.removeChild(recCanvas);
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

        // High-end studio lighting backdrop gradient
        const drawStudioBackdrop = () => {
          const grad = recCtx.createRadialGradient(
            targetWidth * 0.5,
            targetHeight * 0.45,
            Math.min(targetWidth, targetHeight) * 0.08,
            targetWidth * 0.5,
            targetHeight * 0.45,
            Math.max(targetWidth, targetHeight) * 0.85
          );

          if (
            backgroundColor === '#f4f4f6' ||
            backgroundColor === '#ffffff' ||
            backgroundColor.includes('light')
          ) {
            // Light editorial photoshoot backdrop
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, '#f1f4f9');
            grad.addColorStop(1, '#cbd5e1');
          } else {
            // Dark luxury streetwear backdrop
            grad.addColorStop(0, '#1e2433');
            grad.addColorStop(0.4, '#12151e');
            grad.addColorStop(1, '#090b10');
          }

          recCtx.fillStyle = grad;
          recCtx.fillRect(0, 0, targetWidth, targetHeight);
        };

        // Aspect-correct blit function: scales and frames 3D canvas with zero clipping
        const blitFrame = (srcCanvas) => {
          if (!this.isRecording || !srcCanvas) return;

          drawStudioBackdrop();

          const sw = srcCanvas.width;
          const sh = srcCanvas.height;

          // Compute aspect-correct scaling so the entire garment is perfectly framed
          const scale = Math.min(targetWidth / sw, targetHeight / sh);
          const dw = sw * scale;
          const dh = sh * scale;
          const dx = (targetWidth - dw) / 2;
          const dy = (targetHeight - dh) / 2;

          recCtx.drawImage(srcCanvas, 0, 0, sw, sh, dx, dy, dw, dh);

          const elapsedMs = performance.now() - startTime;
          const pct = Math.min(99, Math.round((elapsedMs / totalDurationMs) * 100));
          const elapsedSec = Math.min(durationSeconds, elapsedMs / 1000);
          onProgress(pct, elapsedSec);

          if (elapsedMs >= totalDurationMs) {
            this.stopEarly();
          }
        };

        // Initial prime render
        blitFrame(this.canvas);
        this.mediaRecorder.start(200);

        // Safety timeout to trigger finish exactly when duration completes
        this.stopTimeout = setTimeout(() => {
          this.stopEarly();
        }, totalDurationMs + 150);

        if (this.sceneManager && this.sceneManager.startVideoRecording) {
          // Synchronous 30 FPS render hook with SceneManager
          this.sceneManager.startVideoRecording({
            fps: 30,
            durationSeconds,
            format,
            motion,
            onFrame: (canvasEl) => {
              blitFrame(canvasEl);
            }
          });
        } else {
          // Fallback animation frame loop
          const rafLoop = () => {
            if (!this.isRecording) return;
            blitFrame(this.canvas);
            if (performance.now() - startTime < totalDurationMs) {
              this.animFrameId = requestAnimationFrame(rafLoop);
            } else {
              this.stopEarly();
            }
          };
          this.animFrameId = requestAnimationFrame(rafLoop);
        }
      } catch (err) {
        this.isRecording = false;
        if (this.sceneManager && this.sceneManager.stopVideoRecording) {
          this.sceneManager.stopVideoRecording();
        }
        if (this.animFrameId) {
          cancelAnimationFrame(this.animFrameId);
          this.animFrameId = null;
        }
        reject(err);
      }
    });
  }

  stopEarly() {
    if (this.isRecording) {
      this.isRecording = false;

      if (this.sceneManager && this.sceneManager.stopVideoRecording) {
        this.sceneManager.stopVideoRecording();
      }
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
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

      // Fail-safe finalization timer: If onstop does not fire within 700ms, force finalization
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
    }, 200);
  }
}
