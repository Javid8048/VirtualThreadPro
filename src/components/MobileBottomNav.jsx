import React, { useState } from 'react';
import {
  RotateCw,
  Move,
  ZoomIn,
  Pause,
  Footprints,
  RefreshCw,
  Layers,
  Sparkles,
  Compass
} from 'lucide-react';

export function MobileBottomNav({
  interactionMode = 'orbit',
  onInteractionModeChange,
  currentCamera = 'front',
  onCameraChange,
  isZoomed = true,
  onToggleZoom,
  animationMode = 'static',
  onAnimationModeChange,
  rightDrawerMode = 'design',
  onToggleDesignGuide,
  onOpenExport,
  garmentType = 'oversized_tee'
}) {
  const [showAnglesMenu, setShowAnglesMenu] = useState(false);
  const isCap = garmentType === 'cap';
  const isWalking = animationMode === 'walking';
  const isTurntable = animationMode === 'turntable';

  const cameraViews = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'side', label: 'Side' },
    { id: 'hero', label: 'Hero' }
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-30 select-none animate-fadeIn">
      {/* Angles Quick Popup Menu (if open) */}
      {showAnglesMenu && (
        <div className="mb-2 p-1.5 bg-white/95 dark:bg-studio-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/90 dark:border-studio-700/80 shadow-2xl flex items-center justify-around gap-1 animate-scaleIn">
          {cameraViews.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                onCameraChange(v.id);
                setShowAnglesMenu(false);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                currentCamera === v.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-studio-300 hover:bg-gray-100 dark:hover:bg-studio-800'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Glassmorphic Mobile Action Dock */}
      <nav className="h-14 px-2.5 bg-white/95 dark:bg-studio-900/95 backdrop-blur-2xl rounded-2xl border border-gray-200/90 dark:border-studio-700/80 shadow-2xl flex items-center justify-between gap-1 text-gray-900 dark:text-white">
        {/* 1. Orbit vs Drag Mode */}
        <button
          onClick={() => onInteractionModeChange(interactionMode === 'orbit' ? 'dragDesign' : 'orbit')}
          className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            interactionMode === 'dragDesign'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-studio-300 hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
          title={interactionMode === 'orbit' ? 'Switch to Drag Design' : 'Switch to 3D Orbit'}
        >
          {interactionMode === 'orbit' ? <RotateCw className="size-4" /> : <Move className="size-4" />}
          <span className="text-[9px] font-bold leading-none">{interactionMode === 'orbit' ? '3D Orbit' : 'Drag'}</span>
        </button>

        {/* 2. Camera Angle Quick Selector */}
        <button
          onClick={() => setShowAnglesMenu(!showAnglesMenu)}
          className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            showAnglesMenu
              ? 'bg-brand-500/15 text-brand-500 font-bold border border-brand-500/30'
              : 'text-gray-600 dark:text-studio-300 hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
          title="Change 3D Camera Angle"
        >
          <Compass className="size-4" />
          <span className="text-[9px] font-bold capitalize leading-none">{currentCamera}</span>
        </button>

        {/* 3. Independent Zoom Toggle */}
        <button
          onClick={onToggleZoom}
          className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            isZoomed
              ? 'bg-brand-500 text-white shadow-sm ring-1 ring-brand-400/50'
              : 'text-gray-600 dark:text-studio-300 hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
          title={isZoomed ? 'Zoom Active (Tap for Wide)' : 'Zoom Inactive (Tap for Close-up)'}
        >
          <div className="relative">
            <ZoomIn className="size-4" />
            {isZoomed && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          <span className="text-[9px] font-bold leading-none">{isZoomed ? 'Zoomed' : 'Wide'}</span>
        </button>

        {/* 4. Walking Animation Toggle */}
        <button
          disabled={isCap}
          onClick={() => onAnimationModeChange(isWalking ? 'static' : 'walking')}
          className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            isCap
              ? 'opacity-35 cursor-not-allowed text-gray-400 dark:text-studio-500'
              : isWalking
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-studio-300 hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
          title={isCap ? 'Walking animation is disabled for headwear' : isWalking ? 'Pause Walk (Static)' : 'Start Catwalk Walk Animation'}
        >
          <div className="relative">
            <Footprints className="size-4" />
            {!isCap && isWalking && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          <span className="text-[9px] font-bold leading-none">{isCap ? 'N/A' : 'Walk'}</span>
        </button>

        {/* 5. 360° Turntable Spin */}
        <button
          onClick={() => onAnimationModeChange(isTurntable ? 'static' : 'turntable')}
          className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            isTurntable
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-studio-300 hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
          title="Toggle 360° Turntable Spin"
        >
          <RefreshCw className={`size-4 ${isTurntable ? 'animate-spin' : ''}`} />
          <span className="text-[9px] font-bold leading-none">360°</span>
        </button>

        {/* 6. Design Drawer Sheet Trigger */}
        <button
          onClick={onToggleDesignGuide}
          className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            rightDrawerMode === 'design'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-studio-300 hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
          title="Open Design & Graphics Studio"
        >
          <Layers className="size-4" />
          <span className="text-[9px] font-bold leading-none">Design</span>
        </button>

        {/* 7. Export Studio Trigger */}
        <button
          onClick={onOpenExport}
          className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            rightDrawerMode === 'export'
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm'
              : 'bg-brand-500/15 text-brand-500 hover:bg-brand-500/25'
          }`}
          title="Open Video & 4K Export Studio"
        >
          <Sparkles className="size-4" />
          <span className="text-[9px] font-bold leading-none">Export</span>
        </button>
      </nav>
    </div>
  );
}
