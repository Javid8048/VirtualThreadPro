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
  Palette,
  Minus,
  Plus,
  RotateCw
} from 'lucide-react';
import { CanvasVideoRecorder } from '../utils/videoRecorder';

export function ExportPanel({
  isOpen = true,
  onClose,
  onSwitchToDesign,
  defaultTab = 'video',
  sceneManager,
  backdropMode = 'dark'
}) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'video' | 'image'
  const [imageRes, setImageRes] = useState('4k');
  const [imageFormat, setImageFormat] = useState('png'); // 'png' | 'jpg'

  // Video recording state
  const [videoFormat, setVideoFormat] = useState('desktop'); // 'mobile' | 'desktop' | 'square'
  const [videoMotion, setVideoMotion] = useState('showcase360'); // 'showcase360' | 'current'
  const [preferredFormat, setPreferredFormat] = useState('webm'); // 'webm' | 'mp4'
  const [videoDuration, setVideoDuration] = useState(5); // in seconds: 1 to 30
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
          motion: videoMotion,
          preferredFormat: preferredFormat,
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

  const handleDurationChange = (val) => {
    const num = Math.max(1, Math.min(30, Number(val) || 1));
    setVideoDuration(num);
  };

  return (
    <aside
      data-export-panel="true"
      className="absolute right-3 sm:right-6 top-16 sm:top-20 bottom-3 sm:bottom-6 w-[440px] sm:w-[480px] max-w-[calc(100vw-24px)] bg-white dark:bg-studio-900 rounded-3xl shadow-2xl border border-gray-200/90 dark:border-studio-700/80 flex flex-col overflow-hidden select-none z-30 transition-all animate-fadeIn"
      style={{ maxHeight: 'calc(100vh - 84px)' }}
    >
      {/* Top Header: Export Studio Branding */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 bg-gray-50/90 dark:bg-studio-850/90 border-b border-gray-200/80 dark:border-studio-700/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/25">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">Export Studio</h3>
            <p className="text-[10px] text-gray-500 dark:text-studio-400">Ultra-smooth 60 FPS video & 4K snapshots</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isRecording}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-gray-200/60 dark:hover:bg-studio-800 disabled:opacity-40"
          title="Close Export Panel"
        >
          <X className="size-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Subtabs: Video Recording vs 4K Snapshot */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-studio-900 border-b border-gray-100 dark:border-studio-800 shrink-0">
        <button
          disabled={isRecording}
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'video'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
              : 'bg-gray-100 dark:bg-studio-800 text-gray-600 dark:text-studio-300 hover:bg-gray-200/70 dark:hover:bg-studio-750'
          }`}
        >
          <Video className="size-3.5" />
          <span>Video Render</span>
        </button>

        <button
          disabled={isRecording}
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'image'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
              : 'bg-gray-100 dark:bg-studio-800 text-gray-600 dark:text-studio-300 hover:bg-gray-200/70 dark:hover:bg-studio-750'
          }`}
        >
          <Camera className="size-3.5" />
          <span>4K Snapshot</span>
        </button>
      </div>

      {/* Main Body Content with scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 text-gray-900 dark:text-studio-100">
        {/* ========================================================================= */}
        {/* TAB 1: VIDEO RECORDING */}
        {/* ========================================================================= */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 dark:text-studio-200 flex items-center gap-1.5">
                  <Film className="size-3.5 text-brand-500" />
                  <span>Video Format & Aspect Ratio</span>
                </label>
                <span className="text-[10px] text-gray-500 dark:text-studio-400 font-mono">60 FPS Render</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Mobile (9:16) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('mobile')}
                  className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'mobile'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${videoFormat === 'mobile' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-studio-800 text-gray-600 dark:text-studio-400'}`}>
                      <Smartphone className="size-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">9:16</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white">Mobile</div>
                    <div className="text-[10px] text-gray-500 dark:text-studio-400">1080×1920</div>
                  </div>
                </button>

                {/* Desktop (16:9) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('desktop')}
                  className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'desktop'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${videoFormat === 'desktop' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-studio-800 text-gray-600 dark:text-studio-400'}`}>
                      <Monitor className="size-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">16:9</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white">Desktop</div>
                    <div className="text-[10px] text-gray-500 dark:text-studio-400">1920×1080</div>
                  </div>
                </button>

                {/* Square (1:1) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('square')}
                  className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'square'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${videoFormat === 'square' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-studio-800 text-gray-600 dark:text-studio-400'}`}>
                      <Square className="size-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">1:1</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white">Square</div>
                    <div className="text-[10px] text-gray-500 dark:text-studio-400">1080×1080</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Showcase Motion Mode */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-studio-200 mb-2 flex items-center gap-1.5">
                <RotateCw className="size-3.5 text-brand-500" />
                <span>Showcase Motion</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setVideoMotion('showcase360')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    videoMotion === 'showcase360'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <RotateCw className="size-3.5 text-brand-500" />
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">360° Showcase</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-studio-400">
                    Smooth full loop revealing front, sleeves & back
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setVideoMotion('current')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    videoMotion === 'current'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Film className="size-3.5 text-indigo-500" />
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">Current Pose</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-studio-400">
                    Captures active garment pose or animation
                  </div>
                </button>
              </div>
            </div>

            {/* Video File Container Format */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-studio-200 mb-2 flex items-center gap-1.5">
                <Video className="size-3.5 text-brand-500" />
                <span>Video File Format</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setPreferredFormat('webm')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    preferredFormat === 'webm'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center justify-between">
                    <span>WebM Video</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-bold">Recommended</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-studio-400 mt-0.5">
                    Ultra-smooth 60 FPS, fast browser encoding
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setPreferredFormat('mp4')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    preferredFormat === 'mp4'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center justify-between">
                    <span>MP4 Video</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-studio-800 text-gray-600 dark:text-studio-400 font-bold">Standard</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-studio-400 mt-0.5">
                    Universal format for mobile sharing & socials
                  </div>
                </button>
              </div>
            </div>

            {/* Configurable Video Recording Duration (Bar + Counter + Chips) */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-studio-850/70 border border-gray-200 dark:border-studio-750 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-studio-200 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-brand-500" />
                  <span>Recording Duration</span>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/20 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-500/30">
                    {videoDuration} seconds
                  </span>
                </div>
              </div>

              {/* Duration Slider Bar */}
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={videoDuration}
                    disabled={isRecording}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full h-2 bg-gray-200 dark:bg-studio-700 rounded-lg appearance-none cursor-pointer accent-brand-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-studio-400 font-medium">
                  <span>1s (Short)</span>
                  <span>15s (Standard)</span>
                  <span>30s (Max)</span>
                </div>
              </div>

              {/* Counter / Stepper Controls */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-studio-750">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-studio-400">
                  Exact Duration:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isRecording || videoDuration <= 1}
                    onClick={() => handleDurationChange(videoDuration - 1)}
                    className="p-1 rounded-lg bg-white dark:bg-studio-800 border border-gray-300 dark:border-studio-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-studio-700 disabled:opacity-40 transition-colors"
                    title="Decrease duration by 1 second"
                  >
                    <Minus className="size-3" />
                  </button>

                  <div className="flex items-center bg-white dark:bg-studio-800 border border-gray-300 dark:border-studio-700 rounded-lg px-2 py-0.5 shadow-2xs">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      disabled={isRecording}
                      value={videoDuration}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      className="w-8 text-center text-xs font-black text-gray-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400 dark:text-studio-400 font-bold ml-0.5">s</span>
                  </div>

                  <button
                    type="button"
                    disabled={isRecording || videoDuration >= 30}
                    onClick={() => handleDurationChange(videoDuration + 1)}
                    className="p-1 rounded-lg bg-white dark:bg-studio-800 border border-gray-300 dark:border-studio-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-studio-700 disabled:opacity-40 transition-colors"
                    title="Increase duration by 1 second"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>

              {/* Quick Preset Pills */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 dark:text-studio-500 uppercase tracking-wider font-bold shrink-0">Presets:</span>
                {[3, 5, 10, 15, 30].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={isRecording}
                    onClick={() => setVideoDuration(sec)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      videoDuration === sec
                        ? 'bg-brand-500 text-white shadow-2xs'
                        : 'bg-white dark:bg-studio-800 border border-gray-200 dark:border-studio-700 text-gray-600 dark:text-studio-300 hover:bg-gray-100 dark:hover:bg-studio-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Recording Progress Status Box */}
            {isRecording && (
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-brand-700 dark:text-brand-300">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" />
                    Rendering Frame-by-Frame ({recordingProgress}%)
                  </span>
                  <span>{elapsedSeconds.toFixed(1)}s / {videoDuration}s</span>
                </div>

                <div className="w-full h-2 rounded-full bg-brand-200 dark:bg-brand-900/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-150"
                    style={{ width: `${recordingProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-brand-600 dark:text-brand-400">
                    Capturing smooth WebGL buffer...
                  </span>
                  <button
                    onClick={handleStopEarly}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 flex items-center gap-1 transition-colors"
                  >
                    <StopCircle className="size-3" />
                    <span>Stop Early</span>
                  </button>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {recordedSuccess && lastRecordedFile && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-3 animate-fadeIn">
                <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Video Downloaded</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">{lastRecordedFile}</div>
                </div>
              </div>
            )}

            {/* Start Recording Action Button */}
            <button
              disabled={isRecording}
              onClick={handleStartRecording}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-600 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isRecording ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Recording {videoDuration}s Video...</span>
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  <span>Start Video Recording ({videoDuration}s)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 4K HIGH-RES IMAGE SNAPSHOT */}
        {/* ========================================================================= */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            {/* Resolution Selector */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-studio-200 mb-2 block">
                Output Resolution
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '4k', name: '4K Ultra HD', desc: '3840×2160 • Max Detail' },
                  { id: '1080p', name: '1080p Full HD', desc: '1920×1080 • Standard' },
                  { id: 'mobile', name: 'Mobile Vertical', desc: '1080×1920 • Story' },
                  { id: '2k_square', name: '2K Square', desc: '2048×2048 • Catalog' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setImageRes(item.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      imageRes === item.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                        : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-studio-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selector: PNG (Transparent) vs JPG */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-studio-200 mb-2 block">
                File Format & Background
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setImageFormat('png')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    imageFormat === 'png'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="text-xs font-extrabold text-gray-900 dark:text-white">PNG (Transparent)</div>
                  <div className="text-[10px] text-gray-500 dark:text-studio-400 mt-0.5">Clear background for product mockups</div>
                </button>

                <button
                  onClick={() => setImageFormat('jpg')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    imageFormat === 'jpg'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="text-xs font-extrabold text-gray-900 dark:text-white">JPG (Backdrop)</div>
                  <div className="text-[10px] text-gray-500 dark:text-studio-400 mt-0.5">Includes current studio lighting</div>
                </button>
              </div>
            </div>

            {/* Download Snapshot Button */}
            <button
              onClick={handleDownloadSnapshot}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-600 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
            >
              <Download className="size-4" />
              <span>Download {imageRes.toUpperCase()} Snapshot ({imageFormat.toUpperCase()})</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Status Indicator */}
      <div className="px-5 py-2.5 bg-gray-50 dark:bg-studio-850 border-t border-gray-100 dark:border-studio-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-studio-400 shrink-0">
        <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Ready for Studio Export</span>
        </span>
        <span className="font-mono text-[10px] text-gray-400 dark:text-studio-500">VirtualThreads Studio</span>
      </div>
    </aside>
  );
}
