import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Video,
  Download,
  CheckCircle,
  Loader2,
  Sparkles,
  Smartphone,
  Monitor,
  Square,
  Clock,
  Film,
  StopCircle,
  AlertCircle
} from 'lucide-react';
import { CanvasVideoRecorder } from '../utils/videoRecorder';

export function ExportModal({
  isOpen,
  onClose,
  defaultTab = 'video',
  sceneManager,
  backdropMode = 'dark'
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [imageRes, setImageRes] = useState('4k');
  const [imageFormat, setImageFormat] = useState('png'); // 'png' (transparent) | 'jpg'
  
  // Video recording state
  const [videoFormat, setVideoFormat] = useState('mobile'); // 'mobile' (9:16) | 'desktop' (16:9) | 'square' (1:1)
  const [videoDuration, setVideoDuration] = useState(5); // 3, 5, 10, 15
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedSuccess, setRecordedSuccess] = useState(false);
  const [lastRecordedFile, setLastRecordedFile] = useState(null);

  const recorderRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadSnapshot = () => {
    if (!sceneManager) return;

    let width = 3840;
    let height = 2160;

    if (imageRes === '4k') {
      width = 3840;
      height = 2160;
    } else if (imageRes === 'mobile') {
      width = 1080;
      height = 1920;
    } else if (imageRes === '2k_square') {
      width = 2048;
      height = 2048;
    } else if (imageRes === '1080p') {
      width = 1920;
      height = 1080;
    }

    const isTransparent = imageFormat === 'png';
    const dataUrl = sceneManager.captureSnapshot(width, height, isTransparent);

    // Trigger download
    const link = document.createElement('a');
    link.download = `virtualthreads-${imageRes}-${Date.now()}.${imageFormat}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartRecording = async () => {
    if (!sceneManager || !sceneManager.renderer) return;

    setIsRecording(true);
    setRecordingProgress(0);
    setElapsedSeconds(0);
    setRecordedSuccess(false);
    setLastRecordedFile(null);

    try {
      const recorder = new CanvasVideoRecorder(sceneManager);
      recorderRef.current = recorder;

      const bg = backdropMode === 'light' ? '#f4f4f6' : '#121318';
      const result = await recorder.startRecording(
        {
          durationSeconds: Number(videoDuration),
          format: videoFormat,
          backgroundColor: bg
        },
        (pct, sec) => {
          setRecordingProgress(pct);
          setElapsedSeconds(sec);
        }
      );

      const ext = result.isMp4 ? 'mp4' : 'webm';
      const filename = `virtualthreads-${videoFormat}-${videoDuration}s-${Date.now()}.${ext}`;
      recorder.downloadBlob(result.blob, filename);
      setLastRecordedFile(filename);
      setRecordedSuccess(true);
    } catch (err) {
      console.error('Recording failed:', err);
      alert('Video recording error: ' + (err.message || err));
    } finally {
      setIsRecording(false);
      recorderRef.current = null;
    }
  };

  const handleStopEarly = () => {
    if (recorderRef.current) {
      recorderRef.current.stopEarly();
    }
  };


  return (
    <div data-export-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-studio-900 border border-studio-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-studio-100">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-accent to-emerald-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isRecording}
          className="absolute top-5 right-5 text-studio-400 hover:text-white p-1.5 rounded-xl hover:bg-studio-800 transition-colors disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="size-10 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-accent/20 border border-brand-500/30 text-brand-accent flex items-center justify-center shadow-glow-brand">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Studio Export Suite</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-accent border border-brand-500/30 uppercase tracking-wider">
                FAST HD
              </span>
            </h3>
            <p className="text-xs text-studio-400">High-definition 3D video loops & ultra-res snapshots</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-studio-950 rounded-2xl mb-5 border border-studio-800">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'video'
                ? 'bg-studio-800 text-white shadow-md border border-studio-700/50'
                : 'text-studio-400 hover:text-studio-200'
            }`}
          >
            <Video className="size-4 text-brand-accent" />
            <span>Video</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'image'
                ? 'bg-studio-800 text-white shadow-md border border-studio-700/50'
                : 'text-studio-400 hover:text-studio-200'
            }`}
          >
            <Camera className="size-4 text-brand-400" />
            <span>Image</span>
          </button>
        </div>

        {/* VIDEO RECORDING TAB */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            
            {/* 1. Video View & Aspect Ratio Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-studio-200 flex items-center gap-1.5">
                  <Film className="size-3.5 text-brand-accent" />
                  <span>Video View & Aspect Ratio</span>
                </label>
                <span className="text-[10px] font-semibold text-studio-400">Centered Garment Framing</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Mobile View (9:16) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('mobile')}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'mobile'
                      ? 'border-brand-500 bg-brand-500/15 shadow-glow-brand ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850/60 hover:bg-studio-800/80 text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${videoFormat === 'mobile' ? 'bg-brand-500 text-white' : 'bg-studio-800 text-studio-400'}`}>
                      <Smartphone className="size-4" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-accent">9:16</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Mobile View</div>
                    <div className="text-[10px] text-studio-400 mt-0.5">1080×1920</div>
                    <div className="text-[9px] font-medium text-studio-500 mt-0.5">Reels • TikTok • Shorts</div>
                  </div>
                </button>

                {/* Desktop Video (16:9) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('desktop')}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'desktop'
                      ? 'border-brand-500 bg-brand-500/15 shadow-glow-brand ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850/60 hover:bg-studio-800/80 text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${videoFormat === 'desktop' ? 'bg-brand-500 text-white' : 'bg-studio-800 text-studio-400'}`}>
                      <Monitor className="size-4" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-accent">16:9</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Desktop Video</div>
                    <div className="text-[10px] text-studio-400 mt-0.5">1920×1080</div>
                    <div className="text-[9px] font-medium text-studio-500 mt-0.5">Web • Shopify • YouTube</div>
                  </div>
                </button>

                {/* Square Video (1:1) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('square')}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'square'
                      ? 'border-brand-500 bg-brand-500/15 shadow-glow-brand ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850/60 hover:bg-studio-800/80 text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${videoFormat === 'square' ? 'bg-brand-500 text-white' : 'bg-studio-800 text-studio-400'}`}>
                      <Square className="size-4" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-accent">1:1</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Square Feed</div>
                    <div className="text-[10px] text-studio-400 mt-0.5">1080×1080</div>
                    <div className="text-[9px] font-medium text-studio-500 mt-0.5">Instagram Grid • Post</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Video Duration Selector (5s, 10s, 20s, 30s) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-studio-200 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-brand-accent" />
                  <span>Loop Duration</span>
                </label>
                <span className="text-[10px] text-studio-400">Smooth Continuous Motion</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {/* 3 Seconds */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoDuration(3)}
                  className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                    videoDuration === 3
                      ? 'border-brand-500 bg-brand-500/20 text-white font-black ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850/60 hover:bg-studio-800 text-studio-400'
                  }`}
                >
                  <div className="text-xs font-extrabold">3s</div>
                  <div className="text-[9px] text-studio-400">Quick Loop</div>
                </button>

                {/* 5 Seconds (Default) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoDuration(5)}
                  className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                    videoDuration === 5
                      ? 'border-brand-500 bg-brand-500/20 text-white font-black ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850/60 hover:bg-studio-800 text-studio-400'
                  }`}
                >
                  <div className="text-xs font-extrabold">5s</div>
                  <div className="text-[9px] text-studio-400">Social Reel</div>
                </button>

                {/* 10 Seconds */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoDuration(10)}
                  className={`py-2 px-1.5 rounded-xl border text-center transition-all relative ${
                    videoDuration === 10
                      ? 'border-brand-500 bg-brand-500/20 text-white font-black ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850/60 hover:bg-studio-800 text-studio-400'
                  }`}
                >
                  <div className="text-xs font-extrabold">10s</div>
                  <div className="text-[9px] text-studio-400">Showcase</div>
                </button>

                {/* 15 Seconds */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoDuration(15)}
                  className={`py-2 px-1.5 rounded-xl border text-center transition-all relative ${
                    videoDuration === 15
                      ? 'border-brand-500 bg-brand-500/20 text-white font-black ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850/60 hover:bg-studio-800 text-studio-400'
                  }`}
                >
                  <div className="text-xs font-extrabold">15s</div>
                  <div className="text-[9px] text-studio-400">Full Orbit</div>
                </button>
              </div>
            </div>

            {/* Recording Progress Status Box */}
            {isRecording && (
              <div className="p-4 bg-studio-950 rounded-2xl border border-brand-500/40 space-y-3 shadow-lg shadow-brand-500/10 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-extrabold text-white tracking-wider">
                      REC 60 FPS • {videoFormat.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold text-brand-accent">
                    {elapsedSeconds}s / {videoDuration}s ({recordingProgress}%)
                  </div>
                </div>

                <div className="w-full h-2.5 bg-studio-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 via-brand-accent to-emerald-400 rounded-full transition-all duration-150"
                    style={{ width: `${recordingProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-studio-400 flex items-center gap-1">
                    <AlertCircle className="size-3 text-brand-accent" />
                    <span>Capturing live frames. Keep window active.</span>
                  </p>

                  <button
                    onClick={handleStopEarly}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/30 transition-colors"
                    title="Stop early and save recorded frames"
                  >
                    <StopCircle className="size-3" />
                    <span>Save Early</span>
                  </button>
                </div>
              </div>
            )}

            {/* Success Notification */}
            {recordedSuccess && !isRecording && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-400 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 shrink-0 text-emerald-400" />
                  <div>
                    <span className="font-bold">Export complete!</span>
                    <div className="text-[10px] text-emerald-500 font-mono truncate max-w-[260px]">
                      {lastRecordedFile || 'Video saved to Downloads'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 uppercase">
                  60 FPS
                </span>
              </div>
            )}

            {/* Start Recording CTA Button */}
            <button
              disabled={isRecording}
              onClick={handleStartRecording}
              className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-glow-brand ${
                isRecording
                  ? 'bg-studio-800 text-studio-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-500 via-brand-600 to-emerald-500 hover:brightness-110 text-white active:scale-98 shadow-lg'
              }`}
            >
              {isRecording ? (
                <>
                  <Loader2 className="size-4 animate-spin text-brand-accent" />
                  <span>Encoding {videoDuration}s {videoFormat.toUpperCase()} Video...</span>
                </>
              ) : (
                <>
                  <Video className="size-4" />
                  <span>
                    Record & Download {videoDuration}s {videoFormat === 'mobile' ? 'Mobile (9:16)' : videoFormat === 'desktop' ? 'Desktop (16:9)' : 'Square (1:1)'} Video
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* IMAGE SNAPSHOT TAB */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-studio-300 block mb-2">Resolution & Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setImageRes('4k')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    imageRes === '4k'
                      ? 'border-brand-500 bg-brand-500/20 text-white ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850 text-studio-400 hover:bg-studio-800'
                  }`}
                >
                  <div className="text-xs font-extrabold text-white">Ultra 4K Desktop</div>
                  <div className="text-[10px] text-studio-400">3840×2160 • 16:9 Widescreen</div>
                </button>

                <button
                  onClick={() => setImageRes('mobile')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    imageRes === 'mobile'
                      ? 'border-brand-500 bg-brand-500/20 text-white ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850 text-studio-400 hover:bg-studio-800'
                  }`}
                >
                  <div className="text-xs font-extrabold text-white">Mobile Vertical</div>
                  <div className="text-[10px] text-studio-400">1080×1920 • 9:16 Story</div>
                </button>

                <button
                  onClick={() => setImageRes('2k_square')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    imageRes === '2k_square'
                      ? 'border-brand-500 bg-brand-500/20 text-white ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850 text-studio-400 hover:bg-studio-800'
                  }`}
                >
                  <div className="text-xs font-extrabold text-white">2K Square</div>
                  <div className="text-[10px] text-studio-400">2048×2048 • 1:1 Product</div>
                </button>

                <button
                  onClick={() => setImageRes('1080p')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    imageRes === '1080p'
                      ? 'border-brand-500 bg-brand-500/20 text-white ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850 text-studio-400 hover:bg-studio-800'
                  }`}
                >
                  <div className="text-xs font-extrabold text-white">Full HD</div>
                  <div className="text-[10px] text-studio-400">1920×1080 • Standard</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-studio-300 block mb-2">Format & Alpha Transparency</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setImageFormat('png')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    imageFormat === 'png'
                      ? 'border-brand-500 bg-brand-500/20 text-white ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850 text-studio-400 hover:bg-studio-800'
                  }`}
                >
                  <div className="text-xs font-bold text-white">PNG (Transparent Cutout)</div>
                  <div className="text-[10px] text-studio-500">Includes alpha transparency</div>
                </button>

                <button
                  onClick={() => setImageFormat('jpg')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    imageFormat === 'jpg'
                      ? 'border-brand-500 bg-brand-500/20 text-white ring-1 ring-brand-500'
                      : 'border-studio-800 bg-studio-850 text-studio-400 hover:bg-studio-800'
                  }`}
                >
                  <div className="text-xs font-bold text-white">JPEG (Studio Backdrop)</div>
                  <div className="text-[10px] text-studio-500">With photorealistic studio backdrop</div>
                </button>
              </div>
            </div>

            <button
              onClick={handleDownloadSnapshot}
              className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-brand transition-all active:scale-98"
            >
              <Download className="size-4" />
              <span>Download {imageRes.toUpperCase()} Snapshot</span>
            </button>
          </div>
        )}


      </div>
    </div>
  );
}
