import React from 'react';
import {
  RotateCw,
  Move,
  Maximize2,
  Minimize2,
  RefreshCw,
  Pause,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export function HeaderNav({
  interactionMode = 'orbit',
  onInteractionModeChange,
  currentCamera = 'chest',
  onCameraChange,
  onZoomIn,
  onZoomOut,
  animationMode = 'static',
  onAnimationModeChange,
  onToggleTurntable,
  isFullscreen = false,
  onToggleFullscreen,
  theme = 'dark',
  onToggleTheme,
  onOpenExport,
  onBackToLanding
}) {
  const isTurntable = animationMode === 'turntable';

  const cameraViews = [
    { id: 'chest', label: 'Zoom' },
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'side', label: 'Side' },
    { id: 'hero', label: 'Hero 45°' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-14 sm:h-16 px-4 sm:px-6 z-30 flex items-center justify-between border-b border-gray-200/90 dark:border-studio-700/80 bg-white/95 dark:bg-studio-900/95 backdrop-blur-xl shadow-xs text-gray-900 dark:text-white select-none transition-colors">
      
      {/* 1. Left: Brand & Return to Homepage */}
      <div className="flex items-center gap-3 shrink-0">
        {onBackToLanding ? (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity group text-left"
            title="Return to VirtualThreads Homepage"
          >
            <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform shrink-0">
              VT
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-black tracking-wider uppercase text-gray-900 dark:text-white leading-tight">VirtualThreads</span>
              <span className="text-[10px] font-mono text-brand-500 font-bold">3D Graphics Studio</span>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/25 shrink-0">
              VT
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-gray-900 dark:text-white">VirtualThreads 3D</span>
          </div>
        )}
      </div>

      {/* 2. Center: Interaction Modes, Camera Angles & Animation Presets */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto custom-scrollbar px-2 py-1 max-w-[calc(100vw-340px)]">
        {/* Interaction Mode Toggles */}
        <div className="flex items-center p-0.5 bg-gray-100 dark:bg-studio-800/90 rounded-full border border-gray-200 dark:border-studio-700/50 shrink-0">
          <button
            onClick={() => onInteractionModeChange('orbit')}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              interactionMode === 'orbit'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-700/60'
            }`}
            title="3D Rotate Mode: Click and drag to orbit and rotate the garment in 3D"
          >
            <RotateCw className="size-3.5" />
            <span className="hidden sm:inline">Rotate 3D</span>
          </button>

          <button
            onClick={() => onInteractionModeChange('dragDesign')}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              interactionMode === 'dragDesign'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-700/60'
            }`}
            title="Design Drag Mode: Click and drag artwork directly on 3D model and right-side menu"
          >
            <Move className="size-3.5" />
            <span className="hidden sm:inline">Drag Design</span>
            {interactionMode === 'dragDesign' && (
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-studio-700 shrink-0" />

        {/* Quick Camera Rotate Angles & Zoom Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {cameraViews.map((v) => {
            const isActive = currentCamera === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onCameraChange(v.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white font-bold shadow-md shadow-brand-500/25'
                    : 'text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-800'
                }`}
                title={`Rotate camera to ${v.label} view`}
              >
                {v.label}
              </button>
            );
          })}

          {/* Quick Zoom In & Zoom Out Buttons */}
          {(onZoomIn || onZoomOut) && (
            <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-gray-200 dark:border-studio-700">
              {onZoomIn && (
                <button
                  onClick={onZoomIn}
                  className="p-1 rounded-lg text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-800 transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="size-3.5" />
                </button>
              )}
              {onZoomOut && (
                <button
                  onClick={onZoomOut}
                  className="p-1 rounded-lg text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-800 transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-studio-700 shrink-0" />

        {/* Animation Controls: Static Rest Pose vs 360° Spin */}
        <div className="flex items-center p-0.5 bg-gray-100 dark:bg-studio-800/90 rounded-full border border-gray-200 dark:border-studio-700/50 shrink-0">
          <button
            onClick={() => (onAnimationModeChange ? onAnimationModeChange('static') : (isTurntable && onToggleTurntable ? onToggleTurntable() : null))}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              animationMode === 'static'
                ? 'bg-brand-500 text-white font-bold shadow-md shadow-brand-500/25'
                : 'text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-700/60'
            }`}
            title="Static Animation Mode: Pause all motions and view garment in fixed rest pose"
          >
            <Pause className="size-3.5" />
            <span>Static</span>
          </button>

          <button
            onClick={() => (onAnimationModeChange ? onAnimationModeChange(isTurntable ? 'static' : 'turntable') : onToggleTurntable())}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isTurntable
                ? 'bg-indigo-600 text-white font-bold shadow-md'
                : 'text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-700/60'
            }`}
            title="Toggle automatic 360° turntable spin"
          >
            <RefreshCw className={`size-3.5 ${isTurntable ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">360° Spin</span>
          </button>
        </div>
      </div>

      {/* 3. Right: Quick Actions (Export Button, Theme & Fullscreen) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {onOpenExport && (
          <button
            onClick={onOpenExport}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Open Export Studio"
          >
            <span>Export</span>
          </button>
        )}

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-gray-500 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800 transition-colors"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-indigo-500" />}
          </button>
        )}

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl text-gray-500 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        )}
      </div>

    </header>
  );
}
