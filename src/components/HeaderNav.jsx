import React, { useState, useRef, useEffect } from 'react';
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
  Pause,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Check
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
  canRedo = false,
  backdropMode = 'dark',
  onBackdropModeChange = () => {},
  customBackground = null,
  onCustomBackgroundUpload = () => {},
  onRemoveCustomBackground = () => {},
  backgroundBlur = 0,
  onBackgroundBlurChange = () => {}
}) {
  const isCameraAnimating = cameraAnimationMode && cameraAnimationMode !== 'none';
  const [isBgMenuOpen, setIsBgMenuOpen] = useState(false);
  const bgMenuRef = useRef(null);
  const headerBgFileInputRef = useRef(null);

  // Close background menu when clicking outside
  useEffect(() => {
    if (!isBgMenuOpen) return;
    const handleClickOutside = (e) => {
      if (bgMenuRef.current && !bgMenuRef.current.contains(e.target)) {
        setIsBgMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isBgMenuOpen]);

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

        {/* Background Selector & Device Image Uploader */}
        <div className="relative" ref={bgMenuRef}>
          <button
            onClick={() => setIsBgMenuOpen(!isBgMenuOpen)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              backdropMode === 'custom' || isBgMenuOpen
                ? 'bg-brand-500 text-white border-transparent shadow-sm'
                : 'bg-white dark:bg-studio-800 border-gray-200/90 dark:border-studio-700 text-gray-700 dark:text-studio-200 hover:border-brand-500'
            }`}
            title="Choose studio background or add custom background from device"
          >
            <ImageIcon className="size-3.5" />
            <span className="hidden sm:inline">Background</span>
            {customBackground && (
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Background Menu Popover */}
          {isBgMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 p-3 rounded-2xl bg-white/95 dark:bg-studio-900/95 border border-gray-200 dark:border-studio-700 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-studio-800">
                <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-brand-500" />
                  <span>Studio Background</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-studio-400">
                  {backdropMode === 'custom' ? 'Custom Device' : backdropMode}
                </span>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onBackdropModeChange('dark');
                    setIsBgMenuOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border flex flex-col items-center gap-1 transition-all ${
                    backdropMode === 'dark'
                      ? 'bg-black dark:bg-brand-500 text-white border-transparent shadow-xs'
                      : 'border-gray-200 dark:border-studio-700 text-gray-700 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                  }`}
                >
                  <span className="size-3 rounded-full bg-[#1f2229] border border-white/30" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBackdropModeChange('light');
                    setIsBgMenuOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border flex flex-col items-center gap-1 transition-all ${
                    backdropMode === 'light'
                      ? 'bg-black dark:bg-brand-500 text-white border-transparent shadow-xs'
                      : 'border-gray-200 dark:border-studio-700 text-gray-700 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                  }`}
                >
                  <span className="size-3 rounded-full bg-[#e5e7eb] border border-gray-400/40" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBackdropModeChange('transparent');
                    setIsBgMenuOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border flex flex-col items-center gap-1 transition-all ${
                    backdropMode === 'transparent'
                      ? 'bg-black dark:bg-brand-500 text-white border-transparent shadow-xs'
                      : 'border-gray-200 dark:border-studio-700 text-gray-700 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                  }`}
                >
                  <span className="size-3 rounded-full bg-studio-800 border border-dashed border-gray-400" />
                  <span>Checker</span>
                </button>
              </div>

              {/* Upload CTA or Active Custom Image Card */}
              <div className="pt-2 border-t border-gray-100 dark:border-studio-800">
                <input
                  ref={headerBgFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onCustomBackgroundUpload) {
                      onCustomBackgroundUpload(file);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {!customBackground ? (
                  <button
                    type="button"
                    onClick={() => headerBgFileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-brand-500/60 hover:border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 hover:bg-brand-50 dark:hover:bg-brand-500/20 text-brand-600 dark:text-brand-300 transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
                  >
                    <UploadCloud className="size-4 text-brand-500 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-xs font-bold">Add Background from Device</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-studio-800 border border-gray-200 dark:border-studio-700 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-studio-700 bg-black/20">
                          <img src={customBackground} alt="Device Background" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">Device Background</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="size-2.5" />
                            <span>Active in Studio</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => headerBgFileInputRef.current?.click()}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-studio-700 hover:bg-gray-100 dark:hover:bg-studio-650 text-gray-700 dark:text-studio-200 border border-gray-200 dark:border-studio-600 transition-all shadow-2xs"
                          title="Upload a different image from device"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={onRemoveCustomBackground}
                          className="size-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Remove custom background"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Depth of Field (Blur) Slider */}
                    <div className="pt-1.5 border-t border-gray-200/70 dark:border-studio-700">
                      <div className="flex items-center justify-between text-[10px] font-medium text-gray-500 dark:text-studio-400 mb-1">
                        <span>Depth of Field (Blur)</span>
                        <span className="font-mono text-gray-700 dark:text-studio-200 font-bold">{backgroundBlur || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={backgroundBlur || 0}
                        onChange={(e) => onBackgroundBlurChange && onBackgroundBlurChange(Number(e.target.value))}
                        className="w-full h-1 bg-gray-200 dark:bg-studio-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
