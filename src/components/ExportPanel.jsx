import React, { useState, useRef, useEffect } from 'react';
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
  RotateCw,
  Box,
  Gauge
} from 'lucide-react';
import { CanvasVideoRecorder } from '../utils/videoRecorder';

let activeVideoRecorderInstance = null;

export function ExportPanel({
  isOpen = true,
  onClose,
  defaultTab = 'video',
  sceneManager,
  backdropMode = 'dark',
  asyncExportState,
  setAsyncExportState
}) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'video' | 'image' | 'gltf'
  const [imageRes, setImageRes] = useState('4k');
  const [imageFormat, setImageFormat] = useState('png'); // 'png' | 'jpg'

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  // Video recording state
  const [videoFps, setVideoFps] = useState(24); // 24 | 30 | 60 - Default is 24
  const [videoFormat, setVideoFormat] = useState('desktop'); // 'mobile' | 'desktop' | 'square'
  const [videoMotion, setVideoMotion] = useState('current'); // 'current' | 'showcase360'
  const [preferredFormat, setPreferredFormat] = useState('webm'); // 'webm' | 'mp4'
  const [videoDuration, setVideoDuration] = useState(5); // in seconds: 1 to 30
  const [isRecording, setIsRecording] = useState(() => (activeVideoRecorderInstance?.isRecording || Boolean(asyncExportState?.isRecording)));
  const [recordingProgress, setRecordingProgress] = useState(() => asyncExportState?.progress || 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => asyncExportState?.elapsedSec || 0);
  const [recordedSuccess, setRecordedSuccess] = useState(() => asyncExportState?.status === 'complete');
  const [lastRecordedFile, setLastRecordedFile] = useState(() => asyncExportState?.fileName || null);
  const [isExportingGLTF, setIsExportingGLTF] = useState(false);
  const [hasAcceptedAup, setHasAcceptedAup] = useState(true);

  const recorderRef = useRef(null);

  // Sync with global async export state if updated outside
  useEffect(() => {
    if (asyncExportState) {
      if (typeof asyncExportState.isRecording === 'boolean') {
        setIsRecording(asyncExportState.isRecording);
      }
      if (typeof asyncExportState.progress === 'number') {
        setRecordingProgress(asyncExportState.progress);
      }
      if (typeof asyncExportState.elapsedSec === 'number') {
        setElapsedSeconds(asyncExportState.elapsedSec);
      }
      if (asyncExportState.status === 'complete') {
        setRecordedSuccess(true);
        if (asyncExportState.fileName) setLastRecordedFile(asyncExportState.fileName);
      }
    }
  }, [asyncExportState]);

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

    const numDuration = Number(videoDuration);
    setIsRecording(true);
    setRecordingProgress(0);
    setElapsedSeconds(0);
    setRecordedSuccess(false);
    setLastRecordedFile(null);

    if (setAsyncExportState) {
      setAsyncExportState({
        isRecording: true,
        progress: 0,
        elapsedSec: 0,
        duration: numDuration,
        status: 'recording',
        fileName: null
      });
    }

    try {
      const recorder = new CanvasVideoRecorder(sceneManager);
      activeVideoRecorderInstance = recorder;
      recorderRef.current = recorder;

      const result = await recorder.startRecording(
        {
          fps: Number(videoFps) || 24,
          durationSeconds: numDuration,
          format: videoFormat,
          motion: videoMotion,
          preferredFormat: preferredFormat,
          backgroundColor: null
        },
        (pct, sec) => {
          setRecordingProgress(pct);
          setElapsedSeconds(sec);
          if (setAsyncExportState) {
            setAsyncExportState((prev) => ({
              ...prev,
              isRecording: true,
              progress: pct,
              elapsedSec: sec,
              duration: numDuration,
              status: 'recording'
            }));
          }
        }
      );

      const ext = result.isMp4 ? 'mp4' : 'webm';
      const filename = `virtualthreads-${videoFormat}-${numDuration}s-${Date.now()}.${ext}`;
      recorder.downloadBlob(result.blob, filename);
      setLastRecordedFile(filename);
      setRecordedSuccess(true);

      if (setAsyncExportState) {
        setAsyncExportState({
          isRecording: false,
          progress: 100,
          elapsedSec: numDuration,
          duration: numDuration,
          status: 'complete',
          fileName: filename
        });
      }
    } catch (err) {
      console.error('Recording failed:', err);
      if (setAsyncExportState) {
        setAsyncExportState({
          isRecording: false,
          progress: 0,
          elapsedSec: 0,
          duration: numDuration,
          status: 'error',
          fileName: null
        });
      }
      alert('Video recording error: ' + (err.message || err));
    } finally {
      setIsRecording(false);
      activeVideoRecorderInstance = null;
      recorderRef.current = null;
    }
  };

  const handleStopEarly = () => {
    if (activeVideoRecorderInstance) {
      activeVideoRecorderInstance.stopEarly();
    } else if (recorderRef.current) {
      recorderRef.current.stopEarly();
    }
    setIsRecording(false);
  };

  const handleDurationChange = (val) => {
    const num = Math.max(1, Math.min(30, Number(val) || 1));
    setVideoDuration(num);
  };

  const handleExportGLTF = () => {
    if (!sceneManager || !sceneManager.exportGLTF) return;
    setIsExportingGLTF(true);
    sceneManager.exportGLTF(
      () => setIsExportingGLTF(false),
      () => setIsExportingGLTF(false)
    );
  };

  return (
    <aside
      data-export-panel="true"
      className="fixed bottom-0 left-0 right-0 sm:absolute sm:right-6 sm:top-20 sm:bottom-6 sm:left-auto w-full sm:w-[350px] max-w-[calc(100vw-24px)] max-h-[82vh] sm:max-h-[calc(100vh-84px)] bg-white dark:bg-studio-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200/90 dark:border-studio-700/80 flex flex-col overflow-hidden select-none z-40 sm:z-30 transition-all animate-fadeIn"
    >
      {/* Mobile Swipe / Drag Handle Bar */}
      <div className="w-12 h-1 bg-gray-300 dark:bg-studio-600 rounded-full mx-auto my-1.5 sm:hidden shrink-0" />

      {/* Top Header: Export Studio Branding */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-2.5 bg-gray-50/90 dark:bg-studio-850/90 border-b border-gray-200/80 dark:border-studio-700/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-500/15 text-brand-500 border border-brand-500/25">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-gray-900 dark:text-white leading-tight">Export Studio</h3>
            <p className="text-[9px] text-gray-500 dark:text-studio-400">HD Video (24/30/60 FPS), 4K & 3D models</p>
          </div>
        </div>

        {/* Close Button: Always enabled for asynchronous background export */}
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-studio-800"
          title={isRecording ? "Run Export in Background (Close Panel)" : "Close Export Panel"}
        >
          <X className="size-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Subtabs: Video Recording vs 4K Snapshot vs 3D Model */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-studio-900 border-b border-gray-100 dark:border-studio-800 shrink-0">
        <button
          disabled={isRecording}
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'video'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'bg-gray-100 dark:bg-studio-800 text-gray-600 dark:text-studio-300 hover:bg-gray-200/70 dark:hover:bg-studio-750'
          }`}
        >
          <Video className="size-3" />
          <span>Video</span>
        </button>

        <button
          disabled={isRecording}
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'image'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'bg-gray-100 dark:bg-studio-800 text-gray-600 dark:text-studio-300 hover:bg-gray-200/70 dark:hover:bg-studio-750'
          }`}
        >
          <Camera className="size-3" />
          <span>4K Photo</span>
        </button>

        <button
          disabled={isRecording}
          onClick={() => setActiveTab('gltf')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'gltf'
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'bg-gray-100 dark:bg-studio-800 text-gray-600 dark:text-studio-300 hover:bg-gray-200/70 dark:hover:bg-studio-750'
          }`}
        >
          <Box className="size-3" />
          <span>3D Model</span>
        </button>
      </div>

      {/* Main Body Content with scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3.5 text-gray-900 dark:text-studio-100">
        {/* ========================================================================= */}
        {/* TAB 1: VIDEO RECORDING */}
        {/* ========================================================================= */}
        {activeTab === 'video' && (
          <div className="space-y-3.5">
            {/* Format Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-700 dark:text-studio-200 flex items-center gap-1">
                  <Film className="size-3 text-brand-500" />
                  <span>Video Format</span>
                </label>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {videoFps} FPS Video
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {/* Mobile (9:16) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('mobile')}
                  className={`p-2 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'mobile'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`p-1 rounded-md ${videoFormat === 'mobile' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-studio-800 text-gray-600 dark:text-studio-400'}`}>
                      <Smartphone className="size-3" />
                    </div>
                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">9:16</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-900 dark:text-white">Mobile</div>
                    <div className="text-[9px] text-gray-500 dark:text-studio-400">1080×1920</div>
                  </div>
                </button>

                {/* Desktop (16:9) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('desktop')}
                  className={`p-2 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'desktop'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`p-1 rounded-md ${videoFormat === 'desktop' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-studio-800 text-gray-600 dark:text-studio-400'}`}>
                      <Monitor className="size-3" />
                    </div>
                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">16:9</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-900 dark:text-white">Desktop</div>
                    <div className="text-[9px] text-gray-500 dark:text-studio-400">1920×1080</div>
                  </div>
                </button>

                {/* Square (1:1) */}
                <button
                  disabled={isRecording}
                  onClick={() => setVideoFormat('square')}
                  className={`p-2 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    videoFormat === 'square'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`p-1 rounded-md ${videoFormat === 'square' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-studio-800 text-gray-600 dark:text-studio-400'}`}>
                      <Square className="size-3" />
                    </div>
                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">1:1</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-900 dark:text-white">Square</div>
                    <div className="text-[9px] text-gray-500 dark:text-studio-400">1080×1080</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Frame Rate (FPS) Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-700 dark:text-studio-200 flex items-center gap-1">
                  <Gauge className="size-3 text-brand-500" />
                  <span>Frame Rate (FPS)</span>
                </label>
                <span className="text-[10px] text-gray-500 dark:text-studio-400 font-semibold">
                  {videoFps === 24 ? 'Cinematic (Default)' : videoFps === 30 ? 'Smooth Standard' : 'Ultra Smooth'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 24, label: '24 FPS', desc: 'Default / Cinematic' },
                  { value: 30, label: '30 FPS', desc: 'Standard Video' },
                  { value: 60, label: '60 FPS', desc: 'High Motion' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={isRecording}
                    onClick={() => setVideoFps(item.value)}
                    className={`py-2 px-2 rounded-xl border text-center transition-all ${
                      videoFps === item.value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm text-brand-600 dark:text-brand-400 font-extrabold'
                        : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300 font-medium'
                    }`}
                  >
                    <div className="text-xs font-black">{item.label}</div>
                    <div className="text-[9px] opacity-75">{item.desc}</div>
                  </button>
                ))}
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
                  onClick={() => setVideoMotion('current')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    videoMotion === 'current'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500 shadow-sm'
                      : 'border-gray-200 dark:border-studio-800 bg-gray-50/70 dark:bg-studio-850/60 hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-600 dark:text-studio-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Film className="size-3.5 text-brand-500" />
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">Active Screen View</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-studio-400">
                    Preserves current zoom, angle, animation & background
                  </div>
                </button>

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
                    <RotateCw className="size-3.5 text-indigo-500" />
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">360° Turntable</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-studio-400">
                    Smooth 360° spin loop revealing all angles
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
                    Hardware GPU capture, fast browser encoding
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
                    Recording {videoFps} FPS Video ({recordingProgress}%)
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
                    Direct hardware GPU capture active...
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

            {/* Start / Stop Recording Action Button */}
            <button
              disabled={isRecording || !hasAcceptedAup}
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
                  <span>Start {videoFps} FPS Video Recording ({videoDuration}s)</span>
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
              disabled={!hasAcceptedAup}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-600 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
            >
              <Download className="size-4" />
              <span>Download {imageRes.toUpperCase()} Snapshot ({imageFormat.toUpperCase()})</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 3D MODEL (.GLTF) EXPORT */}
        {/* ========================================================================= */}
        {activeTab === 'gltf' && (
          <div className="space-y-4">
            <div className="p-3 bg-brand-50/60 dark:bg-brand-500/10 rounded-2xl border border-brand-200 dark:border-brand-500/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Box className="size-4 text-brand-500" />
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-white">Universal 3D Garment Model</h4>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-studio-300 leading-relaxed">
                Export the customized 3D garment as an industry-standard <span className="font-semibold text-brand-600 dark:text-brand-400">.glTF</span> asset complete with materials, vertex normals, and textures.
              </p>
            </div>

            <div className="space-y-2 text-xs text-gray-600 dark:text-studio-400">
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-studio-800 border border-gray-150 dark:border-studio-700">
                <span className="font-semibold">Format</span>
                <span className="font-mono text-gray-900 dark:text-white font-bold">glTF 2.0 (.gltf JSON)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-studio-800 border border-gray-150 dark:border-studio-700">
                <span className="font-semibold">Compatibility</span>
                <span className="text-gray-900 dark:text-white font-medium">Blender, Unity, Unreal, WebGL</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-studio-800 border border-gray-150 dark:border-studio-700">
                <span className="font-semibold">Textures & Materials</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Embedded PBR</span>
              </div>
            </div>

            <button
              onClick={handleExportGLTF}
              disabled={isExportingGLTF || !hasAcceptedAup}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-600 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
            >
              {isExportingGLTF ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Packaging 3D Model...</span>
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  <span>Download .glTF 3D Model</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Intellectual Property & Acceptable Use Policy (AUP) Compliance */}
        <div className="mt-4 p-3 bg-gray-50/80 dark:bg-studio-850/80 rounded-2xl border border-gray-200/80 dark:border-studio-750 text-left space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasAcceptedAup}
              onChange={(e) => setHasAcceptedAup(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 dark:border-studio-600 text-brand-600 focus:ring-brand-500 shrink-0"
            />
            <span className="text-[11px] font-medium text-gray-700 dark:text-studio-300 leading-tight">
              I confirm that I own or hold the commercial license for all uploaded graphics, emblems, and typography.
            </span>
          </label>
          <p className="text-[10px] text-gray-400 dark:text-studio-500 leading-normal pl-6 border-t border-gray-150 dark:border-studio-800 pt-1.5 font-sans">
            Legal notice: Mockup rendered for preview purposes only. All uploaded trademarks belong to their respective owners.
          </p>
        </div>
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
