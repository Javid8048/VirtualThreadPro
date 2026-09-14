import React, { useState } from 'react';
import {
  RotateCw,
  Move,
  ChevronDown,
  Download,
  ShoppingBag,
  Check,
  ArrowLeft,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  ZoomIn
} from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';

export function HeaderNav({
  currentGarmentType = 'oversized_tee',
  onSelectGarment,
  onOpenProductsCatalog,
  interactionMode = 'orbit',
  onInteractionModeChange,
  currentCamera = 'front',
  onCameraChange,
  animationMode = 'static',
  onToggleTurntable,
  positionGuideOpen = true,
  onTogglePositionGuide,
  onOpenExport,
  onBackToLanding,
  isFullscreen = false,
  onToggleFullscreen
}) {
  const [isGarmentMenuOpen, setIsGarmentMenuOpen] = useState(false);

  const currentGarment = GARMENT_PRODUCTS.find((p) => p.id === currentGarmentType) || GARMENT_PRODUCTS[0];
  const isTurntable = animationMode === 'turntable';

  const cameraViews = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'hero', label: 'Hero 45°' },
    { id: 'chest', label: 'Zoom' }
  ];

  return (
    <header className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-studio-900/90 backdrop-blur-xl border border-studio-700/60 shadow-2xl text-white select-none max-w-[calc(100vw-32px)] overflow-x-auto custom-scrollbar">
      
      {/* 1. Return to Landing / Products */}
      <button
        onClick={onBackToLanding}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-studio-800/80 hover:bg-studio-750 text-studio-300 hover:text-white border border-studio-700/50 text-xs font-bold transition-all shrink-0 active:scale-95"
        title="Return to products (confirms discard if design exists)"
      >
        <ArrowLeft className="size-3.5 text-studio-400" />
        <span className="hidden md:inline">Products</span>
      </button>

      {/* Garment Blank Dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => setIsGarmentMenuOpen(!isGarmentMenuOpen)}
          className="px-3 py-1.5 rounded-full bg-studio-800 hover:bg-studio-750 border border-studio-700/60 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Select garment blank"
        >
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="max-w-[110px] sm:max-w-none truncate">{currentGarment.title.replace(' STUDIO', '')}</span>
          <ChevronDown className={`size-3 text-studio-400 transition-transform duration-200 ${isGarmentMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isGarmentMenuOpen && (
          <div className="absolute top-full mt-2 left-0 w-64 bg-studio-900 border border-studio-750 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-studio-400 border-b border-studio-800">
              Select Garment Blank
            </div>
            <div className="max-h-60 overflow-y-auto py-1 space-y-1 custom-scrollbar">
              {GARMENT_PRODUCTS.map((p) => {
                const isSelected = p.id === currentGarmentType;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectGarment(p.id);
                      setIsGarmentMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-white font-bold'
                        : 'text-studio-300 hover:text-white hover:bg-studio-800'
                    }`}
                  >
                    <span className="truncate">{p.title.replace(' STUDIO', '')}</span>
                    {isSelected && <Check className="size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-studio-800">
              <button
                onClick={() => {
                  setIsGarmentMenuOpen(false);
                  onOpenProductsCatalog();
                }}
                className="w-full py-1.5 px-3 rounded-lg text-center text-[11px] font-bold text-brand-accent hover:bg-brand-500/10 transition-colors"
              >
                Browse Full Catalog (11 Blanks) →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-studio-750 shrink-0" />

      {/* 2. Interaction Mode Toggles: Rotate 3D vs Drag Design */}
      <div className="flex items-center p-0.5 bg-studio-800/90 rounded-full border border-studio-700/50 shrink-0">
        <button
          onClick={() => onInteractionModeChange('orbit')}
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            interactionMode === 'orbit'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-studio-300 hover:text-white hover:bg-studio-700/60'
          }`}
          title="3D Rotate Mode: Click and drag to orbit and rotate the garment in 3D"
        >
          <RotateCw className="size-3.5" />
          <span className="hidden sm:inline">Rotate 3D</span>
        </button>

        <button
          onClick={() => {
            onInteractionModeChange('dragDesign');
            if (!positionGuideOpen && onTogglePositionGuide) {
              onTogglePositionGuide();
            }
          }}
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            interactionMode === 'dragDesign'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-studio-300 hover:text-white hover:bg-studio-700/60'
          }`}
          title="Design Drag Mode: Click and drag artwork directly on 3D model and right-side menu"
        >
          <Move className="size-3.5" />
          <span className="hidden sm:inline">Drag Design</span>
          {interactionMode === 'dragDesign' && (
            <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
          )}
        </button>
      </div>

      <div className="w-px h-5 bg-studio-750 shrink-0" />

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
                  ? 'bg-studio-750 text-white font-bold border border-studio-600 shadow-sm'
                  : 'text-studio-300 hover:text-white hover:bg-studio-800'
              }`}
              title={`Rotate camera to ${v.label} view`}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      <div className="w-px h-5 bg-studio-750 shrink-0" />

      {/* 4. 360 Turntable Continuous Spin */}
      <button
        onClick={onToggleTurntable}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
          isTurntable
            ? 'bg-indigo-600 text-white font-bold shadow-md'
            : 'text-studio-300 hover:text-white hover:bg-studio-800'
        }`}
        title="Toggle automatic 360° turntable spin"
      >
        <RefreshCw className={`size-3.5 ${isTurntable ? 'animate-spin' : ''}`} />
        <span className="hidden lg:inline">360° Spin</span>
      </button>

      <div className="w-px h-5 bg-studio-750 shrink-0" />

      {/* 5. Right Options: Toggle Position Guide, Export, Fullscreen */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* Graphics Drag Menu Screen Toggle */}
        <button
          onClick={onTogglePositionGuide}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
            positionGuideOpen
              ? 'bg-brand-500/25 text-brand-accent border border-brand-500/40 shadow-sm'
              : 'text-studio-300 hover:text-white hover:bg-studio-800'
          }`}
          title={positionGuideOpen ? 'Hide Graphics Drag menu screen' : 'Show Graphics Drag menu screen'}
        >
          <Layers className="size-3.5" />
          <span className="hidden sm:inline">Graphics Menu</span>
          {positionGuideOpen && <span className="size-1.5 rounded-full bg-emerald-400" />}
        </button>

        {/* Export Modal Button */}
        <button
          onClick={onOpenExport}
          className="px-3 py-1 rounded-full bg-studio-800 hover:bg-studio-750 border border-studio-700/60 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          title="Export 4K Snapshots or 60 FPS Video"
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-full text-studio-400 hover:text-white hover:bg-studio-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        )}
      </div>

    </header>
  );
}
