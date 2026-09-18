import React from 'react';
import {
  RotateCw,
  Move,
  Maximize2,
  Minimize2,
  RefreshCw,
  Pause,
  Sun,
  Moon
} from 'lucide-react';

export function HeaderNav({
  interactionMode = 'orbit',
  onInteractionModeChange,
  currentCamera = 'front',
  onCameraChange,
  animationMode = 'static',
  onAnimationModeChange,
  onToggleTurntable,
  isFullscreen = false,
  onToggleFullscreen,
  theme = 'dark',
  onToggleTheme
}) {
  const isTurntable = animationMode === 'turntable';

  const cameraViews = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'side', label: 'Side' },
    { id: 'hero', label: 'Hero 45°' },
    { id: 'chest', label: 'Zoom' }
  ];

  return (
    <header className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-studio-900/90 backdrop-blur-xl border border-gray-200/90 dark:border-studio-700/60 shadow-2xl text-gray-900 dark:text-white select-none max-w-[calc(100vw-32px)] overflow-x-auto custom-scrollbar transition-colors">
      
      {/* 1. Interaction Mode Toggles: Rotate 3D vs Drag Design */}
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

      {/* 3. Quick Camera Rotate Angles */}
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
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-studio-700 shrink-0" />

      {/* 3. Animation Controls: Static Rest Pose vs 360° Spin */}
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

      <div className="w-px h-5 bg-gray-200 dark:bg-studio-700 shrink-0" />

      {/* 4. Right Controls: Theme Toggle & Fullscreen */}
      <div className="flex items-center gap-1 shrink-0">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full text-gray-500 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800 transition-colors"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="size-3.5 text-amber-500" /> : <Moon className="size-3.5 text-indigo-500" />}
          </button>
        )}

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-full text-gray-500 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        )}
      </div>

    </header>
  );
}
