import React from 'react';
import {
  RotateCw,
  Move,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Shirt,
  Undo2,
  Redo2,
  Pause
} from 'lucide-react';

export function HeaderNav({
  currentGarmentType = 'oversized_tee',
  onSelectGarment,
  onOpenProductsCatalog,
  interactionMode = 'orbit',
  onInteractionModeChange,
  currentCamera = 'front',
  onCameraChange,
  isZoomed = true,
  onToggleZoom,
  onZoomIn,
  onZoomOut,
  animationMode = 'static',
  onAnimationModeChange,
  onToggleTurntable,
  cameraAnimationMode = 'none',
  isFullscreen = false,
  onToggleFullscreen,
  theme = 'dark',
  onToggleTheme,
  onOpenExport,
  onBackToLanding,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) {
  const isCameraAnimating = cameraAnimationMode && cameraAnimationMode !== 'none';

  const cameraViews = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'side', label: 'Side' },
    { id: 'hero', label: 'Hero 45°' }
  ];

  const garmentNameMap = {
    regular_tee: 'Normal T-Shirt',
    oversized_tee: 'Oversized Tee',
    cropped_tee: 'Cropped Tee',
    polo: 'Athletic Polo',
    sweatshirt: 'Sweatshirt',
    hoodie: 'Hoodie',
    zip_hoodie: 'Zip Hoodie'
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-14 sm:h-16 px-3 sm:px-6 z-30 flex items-center justify-between border-b border-gray-200/90 dark:border-studio-700/80 bg-white/95 dark:bg-studio-900/95 backdrop-blur-xl shadow-xs text-gray-900 dark:text-white select-none transition-colors">
      
      {/* 1. Left: Brand & Return to Homepage */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {onBackToLanding ? (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity group text-left"
            title="Return to VirtualThreads Homepage"
          >
            <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform shrink-0">
              VT
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-black tracking-wider uppercase text-gray-900 dark:text-white leading-tight">VirtualThreads</span>
              <span className="text-[10px] font-mono text-brand-500 font-bold">3D Graphics Studio</span>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/25 shrink-0">
              VT
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-gray-900 dark:text-white">VirtualThreads 3D</span>
          </div>
        )}

        {/* Mobile Garment Selector Pill */}
        {onOpenProductsCatalog && (
          <button
            onClick={onOpenProductsCatalog}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-studio-800 text-[11px] font-bold text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-studio-700/80 hover:bg-gray-200/70 dark:hover:bg-studio-700 transition-colors"
            title="Switch Garment Blank"
          >
            <Shirt className="size-3 text-brand-500" />
            <span className="truncate max-w-[100px]">{garmentNameMap[currentGarmentType] || 'Garments'}</span>
            <span className="text-[9px] text-gray-400">▾</span>
          </button>
        )}
      </div>

      {/* 2. Center: Desktop Interaction Modes, Camera Angles & Animation Presets */}
      <div className="hidden md:flex items-center gap-2 sm:gap-2.5 overflow-x-auto custom-scrollbar px-2 py-1 max-w-[calc(100vw-360px)]">
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
            <span>Rotate 3D</span>
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
            <span>Drag Design</span>
            {interactionMode === 'dragDesign' && (
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Undo / Redo History Controls */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-studio-800/90 rounded-full p-0.5 border border-gray-200 dark:border-studio-700/50 shrink-0">
            {onUndo && (
              <button
                type="button"
                disabled={!canUndo}
                onClick={onUndo}
                className="p-1 rounded-full text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-200/70 dark:hover:bg-studio-700 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="size-3.5" />
              </button>
            )}
            {onRedo && (
              <button
                type="button"
                disabled={!canRedo}
                onClick={onRedo}
                className="p-1 rounded-full text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-200/70 dark:hover:bg-studio-700 transition-colors"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="size-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="w-px h-5 bg-gray-200 dark:bg-studio-700 shrink-0" />

        {/* Quick Camera Rotate Angles & Independent Zoom Controls */}
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

          {/* Independent Zoom Mode Toggle */}
          {onToggleZoom && (
            <button
              type="button"
              disabled={isCameraAnimating}
              onClick={onToggleZoom}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ml-0.5 ${
                isCameraAnimating
                  ? 'opacity-40 cursor-not-allowed pointer-events-none text-gray-400 dark:text-studio-500 border border-gray-200/50'
                  : isZoomed
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 ring-1.5 ring-brand-400/50'
                  : 'text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-800 border border-gray-200/80 dark:border-studio-700/60'
              }`}
              title={isCameraAnimating ? "Zoom is disabled during camera animation" : isZoomed ? "Zoom Mode: Active (Click to switch to Wide Full Garment view)" : "Zoom Mode: Inactive (Click to switch to Close-up Zoom view)"}
            >
              <ZoomIn className="size-3.5" />
              <span>{isZoomed ? 'Zoomed' : 'Zoom'}</span>
              {isZoomed && !isCameraAnimating && (
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}

          {/* Quick Zoom In & Zoom Out Buttons */}
          {(onZoomIn || onZoomOut) && (
            <div className={`flex items-center gap-0.5 ml-1 pl-1 border-l border-gray-200 dark:border-studio-700 ${isCameraAnimating ? 'opacity-40 pointer-events-none' : ''}`}>
              {onZoomIn && (
                <button
                  disabled={isCameraAnimating}
                  onClick={onZoomIn}
                  className="p-1 rounded-lg text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-800 transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="size-3.5" />
                </button>
              )}
              {onZoomOut && (
                <button
                  disabled={isCameraAnimating}
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

        {/* Animation Controls: Static Rest Pose */}
        <div className="flex items-center p-0.5 bg-gray-100 dark:bg-studio-800/90 rounded-full border border-gray-200 dark:border-studio-700/50 shrink-0">
          <button
            disabled={isCameraAnimating}
            onClick={() => onAnimationModeChange ? onAnimationModeChange('static') : null}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              isCameraAnimating
                ? 'opacity-40 cursor-not-allowed pointer-events-none text-gray-400 dark:text-studio-500'
                : animationMode === 'static'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-studio-700/60'
            }`}
            title={isCameraAnimating ? "Static is disabled during camera animation" : "Static Animation Mode: Pause all motions and view garment in fixed rest pose"}
          >
            <Pause className="size-3.5" />
            <span>Static</span>
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
            className="hidden sm:flex p-2 rounded-xl text-gray-500 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        )}
      </div>

    </header>
  );
}
