import React, { useState } from 'react';
import {
  RotateCw,
  Move,
  ZoomIn,
  Footprints,
  RefreshCw,
  Layers,
  Sparkles,
  Compass,
  Box,
  X
} from 'lucide-react';

/**
 * MobileBottomNav
 * Ergonomic 4-primary-action glassmorphic mobile dock for VirtualThreads 3D Studio.
 * Complies with Apple HIG & Google Material standards (min 48px width per target; >80px actual width).
 * Features smooth sub-drawers for camera angles and animations.
 */
export function MobileBottomNav({
  interactionMode = 'orbit',
  onInteractionModeChange,
  currentCamera = 'front',
  onCameraChange,
  isZoomed = false,
  onToggleZoom,
  animationMode = 'static',
  onAnimationModeChange,
  rightDrawerMode = 'design',
  onToggleDesignGuide,
  onOpenExport,
  garmentType = 'oversized_tee',
  viewMode = '3d',
  onViewModeChange,
  selectedSide = 'front',
  onSideChange
}) {
  const [showCameraFlyout, setShowCameraFlyout] = useState(false);

  const isCap = garmentType === 'cap';
  const isWalking = animationMode === 'walking';
  const isTurntable = animationMode === 'turntable';
  const isDesignOpen = rightDrawerMode === 'design';
  const isExportOpen = rightDrawerMode === 'export';

  const cameraViews = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'side', label: 'Side' },
    { id: 'hero', label: 'Hero' }
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-30 select-none animate-fadeIn">
      {/* Tap backdrop to close camera flyout */}
      {showCameraFlyout && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setShowCameraFlyout(false)}
        />
      )}

      {/* Camera Angles & Motion Sub-Drawer Flyout */}
      {showCameraFlyout && (
        <div className="absolute bottom-16 left-0 right-0 p-3.5 bg-white/95 dark:bg-studio-900/95 backdrop-blur-2xl rounded-3xl border border-gray-200/90 dark:border-studio-700/80 shadow-2xl z-30 animate-scaleIn">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-100 dark:border-studio-800">
            <div className="flex items-center gap-1.5">
              <Compass className="size-4 text-brand-500" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">Camera & Motion Studio</span>
            </div>
            <button
              onClick={() => setShowCameraFlyout(false)}
              className="size-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              title="Close Menu"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Section 1: Camera Angle Presets */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-studio-500 mb-1.5">
            Perspective View
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {cameraViews.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  onCameraChange(v.id);
                  setShowCameraFlyout(false);
                }}
                className={`h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                  currentCamera === v.id
                    ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-400/40'
                    : 'bg-gray-100 dark:bg-studio-800 text-gray-700 dark:text-studio-300 hover:bg-gray-200 dark:hover:bg-studio-750'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Section 2: Motion, Animations & Controls */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-studio-500 mb-1.5">
            Animation & Controls
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {/* 360° Turntable */}
            <button
              onClick={() => {
                onAnimationModeChange(isTurntable ? 'static' : 'turntable');
              }}
              className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-all ${
                isTurntable
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                  : 'bg-gray-100 dark:bg-studio-800 text-gray-700 dark:text-studio-300 hover:bg-gray-200 dark:hover:bg-studio-750'
              }`}
              title="Toggle 360° Turntable Spin"
            >
              <RefreshCw className={`size-4 ${isTurntable ? 'animate-spin' : ''}`} />
              <span>360° Spin</span>
            </button>

            {/* Runway Catwalk Walk */}
            <button
              disabled={isCap}
              onClick={() => {
                onAnimationModeChange(isWalking ? 'static' : 'walking');
              }}
              className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-all ${
                isCap
                  ? 'opacity-35 cursor-not-allowed bg-gray-100 dark:bg-studio-800 text-gray-400'
                  : isWalking
                  ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-400/40'
                  : 'bg-gray-100 dark:bg-studio-800 text-gray-700 dark:text-studio-300 hover:bg-gray-200 dark:hover:bg-studio-750'
              }`}
              title={isCap ? 'Walking animation disabled for headwear' : 'Toggle Catwalk Runway Motion'}
            >
              <div className="relative">
                <Footprints className="size-4" />
                {!isCap && isWalking && (
                  <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span>{isCap ? 'N/A' : 'Catwalk'}</span>
            </button>

            {/* Zoom Toggle */}
            <button
              onClick={onToggleZoom}
              className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-all ${
                isZoomed
                  ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-400/40'
                  : 'bg-gray-100 dark:bg-studio-800 text-gray-700 dark:text-studio-300 hover:bg-gray-200 dark:hover:bg-studio-750'
              }`}
              title="Toggle Camera Zoom"
            >
              <div className="relative">
                <ZoomIn className="size-4" />
                {isZoomed && (
                  <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span>{isZoomed ? 'Zoomed' : 'Wide'}</span>
            </button>

            {/* 2D Flat vs 3D Mode Toggle */}
            <button
              onClick={() => {
                if (onViewModeChange) {
                  onViewModeChange(viewMode === '3d' ? '2d' : '3d');
                }
                setShowCameraFlyout(false);
              }}
              className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-all ${
                viewMode === '2d'
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40'
                  : 'bg-gray-100 dark:bg-studio-800 text-gray-700 dark:text-studio-300 hover:bg-gray-200 dark:hover:bg-studio-750'
              }`}
              title="Toggle 2D Flat / 3D Mode"
            >
              <Box className="size-4" />
              <span>{viewMode === '3d' ? '2D Flat' : '3D Mode'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Glassmorphic 4-Action Dock (Comfortable 80px+ Touch Zones) */}
      <nav className="h-14 px-2 bg-white/95 dark:bg-studio-900/95 backdrop-blur-2xl rounded-2xl border border-gray-200/90 dark:border-studio-700/80 shadow-2xl grid grid-cols-4 gap-1.5 text-gray-900 dark:text-white items-center">
        {/* 1. Mode / 3D Orbit Action */}
        {viewMode === '3d' ? (
          <button
            onClick={() => onInteractionModeChange(interactionMode === 'orbit' ? 'dragDesign' : 'orbit')}
            className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              interactionMode === 'dragDesign'
                ? 'bg-brand-500 text-white shadow-sm ring-1 ring-brand-400/40'
                : 'text-gray-700 dark:text-studio-200 hover:bg-gray-100 dark:hover:bg-studio-800'
            }`}
            title={interactionMode === 'orbit' ? 'Switch to Drag Design' : 'Switch to 3D Orbit'}
          >
            {interactionMode === 'orbit' ? <RotateCw className="size-4" /> : <Move className="size-4" />}
            <span className="text-[10px] font-bold leading-none">{interactionMode === 'orbit' ? '3D Orbit' : 'Drag'}</span>
          </button>
        ) : (
          <button
            onClick={() => onViewModeChange && onViewModeChange('3d')}
            className="h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all bg-brand-500/15 text-brand-500 hover:bg-brand-500/25 border border-brand-500/30"
            title="Switch to 3D Studio"
          >
            <Box className="size-4" />
            <span className="text-[10px] font-bold leading-none">3D Studio</span>
          </button>
        )}

        {/* 2. Camera / Angles / Motion Sub-Drawer (or 2D Side toggle) */}
        {viewMode === '3d' ? (
          <button
            onClick={() => setShowCameraFlyout(!showCameraFlyout)}
            className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              showCameraFlyout
                ? 'bg-brand-500 text-white shadow-sm ring-1 ring-brand-400/40'
                : isTurntable || isWalking
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40'
                : 'text-gray-700 dark:text-studio-200 hover:bg-gray-100 dark:hover:bg-studio-800'
            }`}
            title="Camera Angles & Studio Animations"
          >
            <Compass className={`size-4 ${isTurntable ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-bold capitalize leading-none">
              {showCameraFlyout ? 'Close' : currentCamera}
            </span>
          </button>
        ) : (
          <button
            onClick={() => onSideChange && onSideChange(selectedSide === 'front' ? 'back' : 'front')}
            className="h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all bg-gray-100 dark:bg-studio-800 text-gray-700 dark:text-studio-200 hover:bg-gray-200 dark:hover:bg-studio-750"
            title="Toggle Front / Back 2D View"
          >
            <RotateCw className="size-4" />
            <span className="text-[10px] font-bold capitalize leading-none">{selectedSide}</span>
          </button>
        )}

        {/* 3. Design Sheet Trigger */}
        <button
          onClick={onToggleDesignGuide}
          className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            isDesignOpen
              ? 'bg-brand-500 text-white shadow-sm ring-1 ring-brand-400/40'
              : 'text-gray-700 dark:text-studio-200 hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
          title="Open Design & Graphics Sheet"
        >
          <Layers className="size-4" />
          <span className="text-[10px] font-bold leading-none">Design</span>
        </button>

        {/* 4. Export Studio Trigger */}
        <button
          onClick={onOpenExport}
          className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            isExportOpen
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm ring-1 ring-brand-400/40'
              : 'bg-brand-500/15 text-brand-500 hover:bg-brand-500/25 border border-brand-500/20'
          }`}
          title="Open 60 FPS Video & 4K Export Studio"
        >
          <Sparkles className="size-4" />
          <span className="text-[10px] font-bold leading-none">Export</span>
        </button>
      </nav>
    </div>
  );
}
