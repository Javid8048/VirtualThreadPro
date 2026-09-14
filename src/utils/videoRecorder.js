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
  }

  /**
   * Starts recording the canvas for a specified duration in seconds.
   * @param {Object} options
   * @param {number} options.durationSeconds - Duration in seconds (e.g. 5, 10, 20, 30)
   * @param {'mobile' | 'desktop' | 'square' | 'native'} options.format - Video aspect ratio / format
   * @param {string} options.backgroundColor - Background fill color
   * @param {Function} onProgress - Progress callback (percentage: 0-100, elapsedSeconds: number)
   */
  startRecording(
    {
      durationSeconds = 10,
      format = 'desktop',
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
          targetWidth = this.canvas.width;
          targetHeight = this.canvas.height;
        }

        // Dedicated recording canvas for exact resolution and framing
        const recCanvas = document.createElement('canvas');
        recCanvas.width = targetWidth;
        recCanvas.height = targetHeight;
        const recCtx = recCanvas.getContext('2d', { alpha: false });
        recCtx.imageSmoothingEnabled = true;
        recCtx.imageSmoothingQuality = 'high';

        // Capture 60 FPS stream
        const stream = recCanvas.captureStream ? recCanvas.captureStream(60) : null;
        const videoTrack = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;

        // Pick best supported mime type
        const mimeTypes = [
          'video/mp4;codecs=avc1,mp4a.40.2',
          'video/mp4;codecs=avc1',
          'video/mp4',
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm'
        ];

        let selectedMime = '';
        for (const type of mimeTypes) {
          if (
            typeof MediaRecorder !== 'undefined' &&
            MediaRecorder.isTypeSupported &&
            MediaRecorder.isTypeSupported(type)
          ) {
            selectedMime = type;
            break;
          }
        }

        if (!selectedMime) {
          selectedMime = 'video/webm';
        }

        const options = {
          mimeType: selectedMime,
          videoBitsPerSecond: 16000000 // 16 Mbps for crisp streetwear detail
        };

        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, options);

        const cleanup = () => {
          this.isRecording = false;
          if (this.sceneManager && this.sceneManager.stopVideoRecording) {
            this.sceneManager.stopVideoRecording();
          }
          if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
          }
        };

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          cleanup();
          const blob = new Blob(this.recordedChunks, { type: selectedMime });
          const isMp4 = selectedMime.includes('mp4');
          resolve({ blob, mimeType: selectedMime, isMp4, format, durationSeconds });
        };

        this.mediaRecorder.onerror = (err) => {
          cleanup();
          reject(err);
        };

        this.isRecording = true;
        const totalFrames = Math.max(1, Math.round(durationSeconds * 60));
        let frameCount = 0;
        const targetAspect = targetWidth / targetHeight;

        // Blit frame function: accurately scales and center-crops the WebGL canvas
        const blitFrame = (srcCanvas) => {
          if (!this.isRecording || !srcCanvas) return;

          const sw = srcCanvas.width;
          const sh = srcCanvas.height;
          const srcAspect = sw / sh;

          // Fill solid background
          recCtx.fillStyle = backgroundColor;
          recCtx.fillRect(0, 0, targetWidth, targetHeight);

          if (format === 'mobile') {
            // Mobile (9:16 Vertical, e.g. 1080x1920)
            const cropH = sh;
            const cropW = cropH * targetAspect;
            const cropX = (sw - cropW) / 2;
            if (cropW <= sw) {
              recCtx.drawImage(srcCanvas, cropX, 0, cropW, cropH, 0, 0, targetWidth, targetHeight);
            } else {
              const fitW = sw;
              const fitH = sw / targetAspect;
              const fitY = (sh - fitH) / 2;
              recCtx.drawImage(srcCanvas, 0, fitY, fitW, fitH, 0, 0, targetWidth, targetHeight);
            }
          } else if (format === 'desktop') {
            // Desktop (16:9 Landscape, e.g. 1920x1080)
            if (srcAspect >= targetAspect) {
              const cropH = sh;
              const cropW = cropH * targetAspect;
              const cropX = (sw - cropW) / 2;
              recCtx.drawImage(srcCanvas, cropX, 0, cropW, cropH, 0, 0, targetWidth, targetHeight);
            } else {
              const cropW = sw;
              const cropH = cropW / targetAspect;
              const cropY = (sh - cropH) / 2;
              recCtx.drawImage(srcCanvas, 0, cropY, cropW, cropH, 0, 0, targetWidth, targetHeight);
            }
          } else if (format === 'square') {
            // Square (1:1, e.g. 1080x1080)
            const size = Math.min(sw, sh);
            const cropX = (sw - size) / 2;
            const cropY = (sh - size) / 2;
            recCtx.drawImage(srcCanvas, cropX, cropY, size, size, 0, 0, targetWidth, targetHeight);
          } else {
            recCtx.drawImage(srcCanvas, 0, 0, sw, sh, 0, 0, targetWidth, targetHeight);
          }

          if (videoTrack && typeof videoTrack.requestFrame === 'function') {
            videoTrack.requestFrame();
          }

          frameCount++;
          const pct = Math.min(100, Math.round((frameCount / totalFrames) * 100));
          const elapsedSec = Math.min(durationSeconds, Math.floor(frameCount / 60));
          onProgress(pct, elapsedSec);

          if (frameCount >= totalFrames) {
            this.stopEarly();
          }
        };

        // Render initial frame to prime stream
        blitFrame(this.canvas);
        this.mediaRecorder.start(250);

        if (this.sceneManager && this.sceneManager.startVideoRecording) {
          // Direct synchronous 60.0 FPS hook with SceneManager
          this.sceneManager.startVideoRecording({
            fps: 60,
            onFrame: (canvasEl) => {
              blitFrame(canvasEl);
            }
          });
        } else {
          // Fallback RAF loop if standalone canvas
          const rafLoop = () => {
            if (!this.isRecording) return;
            blitFrame(this.canvas);
            if (frameCount < totalFrames) {
              this.animFrameId = requestAnimationFrame(rafLoop);
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
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
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
    }, 150);
  }
}
