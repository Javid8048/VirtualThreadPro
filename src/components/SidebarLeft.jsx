import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Settings, ChevronDown, ChevronRight, Video, Check, Wind, Play, Compass, Image as ImageIcon, Layers, Trash2, Plus, Type, Shirt, ShoppingBag, ArrowLeft, RotateCw } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';

const COLOR_SWATCHES = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Washed Black', hex: '#14161b' },
  { name: 'Heather Grey', hex: '#7a7d85' },
  { name: 'Vintage Cream', hex: '#f0ede6' },
  { name: 'Forest Green', hex: '#263b2f' },
  { name: 'Cobalt Navy', hex: '#192848' },
  { name: 'Terracotta Rust', hex: '#873a2b' },
  { name: 'Lilac Mauve', hex: '#584c63' },
  { name: 'Acid Washed', hex: '#2b2d35' }
];

export function SidebarLeft({
  garmentColor,
  onGarmentColorChange,
  backdropMode,
  onBackdropModeChange,
  animationMode,
  onAnimationModeChange,
  walkSpeed = 1.0,
  onWalkSpeedChange,
  cameraAnimationMode = 'none',
  onCameraAnimationModeChange,
  acidWash = 0,
  onAcidWashChange,
  puffPrint = 0,
  onPuffPrintChange,
  onTriggerKnit,
  onCameraChange,
  onOpenExport,
  onOpenPositionGuide,
  onTriggerUploadFront,
  onTriggerUploadBack,
  designManager,
  currentGarmentType = 'oversized_tee',
  onSelectGarment,
  onOpenProductsCatalog,
  viewMode = '3d',
  onViewModeChange,
  onBackToLanding
}) {
  const [openSection, setOpenSection] = useState('designs'); // default to 'designs'
  const [layers, setLayers] = useState([]);

  // Sync design layers
  useEffect(() => {
    if (!designManager) return;
    const sync = () => setLayers([...designManager.layers]);
    sync();
    return designManager.subscribe(sync);
  }, [designManager]);

  const frontLayers = layers.filter((l) => (l.side || 'front') === 'front');
  const backLayers = layers.filter((l) => (l.side || 'front') === 'back');

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <aside className="absolute left-6 top-20 bottom-6 w-64 rounded-3xl bg-white dark:bg-studio-900 text-gray-900 dark:text-studio-100 shadow-2xl p-4 flex flex-col justify-between select-none z-20 border border-gray-200/80 dark:border-studio-750/80 animate-fadeIn backdrop-blur-xl transition-colors">
      
      {/* Top Header Row: Back to Products & VirtualThreads branding */}
      <div className="flex items-center justify-between pb-2.5 mb-1.5 border-b border-gray-100 dark:border-studio-800">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800 py-1.5 px-2.5 rounded-xl transition-all group"
          title="Return to products landing page"
        >
          <ArrowLeft className="size-3.5 text-gray-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Products</span>
        </button>
        <div className="flex items-center gap-1.5 pr-1">
          <div className="size-5 bg-black dark:bg-brand-500 rounded-md flex items-center justify-center text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="size-3 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4h4.5l3.5 8.5L15.5 4H20l-6.5 15.5h-3L4 4z" />
            </svg>
          </div>
          <span className="font-extrabold text-[11px] tracking-tight text-gray-900 dark:text-white">VirtualThreads</span>
        </div>
      </div>

      {/* Top Action Pill: Advanced Controls (Toggles Position Guide) */}
      <div className="space-y-1.5">
        <button
          onClick={onOpenPositionGuide}
          className="w-full bg-studio-900 dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white font-semibold text-xs py-2.5 px-4 rounded-full flex items-center justify-between transition-all active:scale-95 shadow-md group"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span>Design & Graphics Studio</span>
          </div>
          <Settings className="size-3.5 text-studio-400 group-hover:rotate-45 transition-transform" />
        </button>
      </div>

      {/* Accordion Menu Options */}
      <div className="flex-1 my-3 overflow-y-auto space-y-1 text-xs pr-0.5 custom-scrollbar">
        
        {/* Studio View Mode Switcher: 3D Interactive vs 2D Flat Mockup */}
        <div className="py-1 mb-2">
          <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-studio-950 border border-gray-200 dark:border-studio-800">
            <button
              onClick={() => onViewModeChange && onViewModeChange('3d')}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-black dark:bg-studio-800 text-white shadow-sm'
                  : 'text-gray-500 dark:text-studio-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <span className={`size-1.5 rounded-full ${viewMode === '3d' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              3D Studio
            </button>
            <button
              onClick={() => onViewModeChange && onViewModeChange('2d')}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === '2d'
                  ? 'bg-black dark:bg-studio-800 text-white shadow-sm'
                  : 'text-gray-500 dark:text-studio-400 hover:text-black dark:hover:text-white'
              }`}
            >
              2D Flat
            </button>
          </div>
        </div>

        {/* Garment Blank Selection (9 Streetwear Blanks) */}
        <div className="border-b border-gray-100 dark:border-studio-800 py-2.5">
          <button
            onClick={() => toggleSection('garment')}
            className="w-full flex items-center justify-between font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-brand-accent py-1 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Shirt className="size-3.5 text-indigo-500 dark:text-brand-accent" />
              <span>Garment Blank</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold bg-indigo-50 dark:bg-brand-500/20 text-indigo-700 dark:text-brand-accent border border-indigo-100 dark:border-brand-500/30 px-2 py-0.5 rounded-full uppercase whitespace-nowrap">
                {(GARMENT_PRODUCTS.find(p => p.id === currentGarmentType)?.title || 'T-Shirt')
                  .replace(' STUDIO', '')
                  .replace('OVERSIZED ', '')}
              </span>
              {openSection === 'garment' ? (
                <ChevronDown className="size-4 text-gray-400 dark:text-studio-400" />
              ) : (
                <ChevronRight className="size-4 text-gray-400 dark:text-studio-400" />
              )}
            </div>
          </button>

          {openSection === 'garment' && (
            <div className="pt-2 pb-1 space-y-1 animate-fadeIn">
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {GARMENT_PRODUCTS.map((p) => {
                  const isSelected = p.id === currentGarmentType;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectGarment && onSelectGarment(p.id)}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] font-medium flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white border border-gray-200 dark:border-studio-700 shadow-sm'
                          : 'text-gray-700 dark:text-studio-200 hover:bg-gray-100 dark:hover:bg-studio-800 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate">{p.title.replace(' STUDIO', '')}</span>
                      {isSelected && <Check className="size-3 text-indigo-600 dark:text-brand-accent shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {onOpenProductsCatalog && (
                <button
                  onClick={onOpenProductsCatalog}
                  className="w-full mt-1 py-1.5 px-2 rounded-lg text-center text-[10px] font-bold text-indigo-600 dark:text-brand-accent hover:bg-indigo-50 dark:hover:bg-brand-500/15 border border-indigo-100 dark:border-brand-500/30 transition-colors"
                >
                  View All 9 Blanks & Details →
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* 1. Multi-Design Layer Manager (Front & Back) */}
        <div className="border-b border-gray-100 dark:border-studio-800 py-2.5">
          <button
            onClick={() => toggleSection('designs')}
            className="w-full flex items-center justify-between font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-brand-accent py-1 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5 text-indigo-500 dark:text-brand-accent" />
              <span>Designs & Layers</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold bg-gray-100 dark:bg-studio-800 text-gray-700 dark:text-studio-300 border border-gray-200 dark:border-studio-700 px-1.5 py-0.2 rounded-full">
                {layers.length}
              </span>
              {openSection === 'designs' ? (
                <ChevronDown className="size-4 text-gray-400 dark:text-studio-400" />
              ) : (
                <ChevronRight className="size-4 text-gray-400 dark:text-studio-400" />
              )}
            </div>
          </button>

          {openSection === 'designs' && (
            <div className="pt-2 pb-1 space-y-3 animate-fadeIn">
              {/* Front Layers Group */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-studio-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-brand-accent" />
                    Front Chest ({frontLayers.length})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (onCameraChange) onCameraChange('front');
                        if (onTriggerUploadFront) onTriggerUploadFront();
                      }}
                      className="text-[10px] text-indigo-600 dark:text-brand-accent hover:text-indigo-800 dark:hover:text-white font-bold px-1 rounded hover:bg-indigo-50 dark:hover:bg-brand-500/20"
                      title="Upload Image to Front"
                    >
                      + Image
                    </button>
                    <button
                      onClick={() => {
                        if (onCameraChange) onCameraChange('front');
                        if (designManager) {
                          designManager.addLayer({
                            type: 'text',
                            side: 'front',
                            text: 'FRONT TEXT',
                            textColor: '#000000',
                            x: 530,
                            y: 800
                          });
                        }
                      }}
                      className="text-[10px] text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white font-bold px-1 rounded hover:bg-gray-100 dark:hover:bg-studio-800"
                      title="Add Text to Front"
                    >
                      + Text
                    </button>
                  </div>
                </div>

                {frontLayers.length === 0 ? (
                  <div className="text-[10px] text-gray-500 dark:text-studio-400 italic bg-gray-50 dark:bg-studio-800/60 rounded-lg p-1.5 text-center border border-gray-100 dark:border-studio-800">
                    No front designs applied
                  </div>
                ) : (
                  <div className="space-y-1">
                    {frontLayers.map((l, idx) => {
                      const isActive = l.id === designManager?.activeLayerId;
                      return (
                        <div
                          key={l.id}
                          onClick={() => {
                            if (designManager) designManager.setActiveLayer(l.id);
                            if (onCameraChange) onCameraChange('front');
                            if (onOpenPositionGuide) onOpenPositionGuide();
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-xl border cursor-pointer transition-all ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-brand-500/20 border-indigo-300 dark:border-brand-500/50 ring-1 ring-indigo-300 dark:ring-brand-500/30'
                              : 'bg-white dark:bg-studio-800 border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-750'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {l.type === 'image' && l.image ? (
                              <img src={l.image.src} alt="" className="size-5 rounded object-cover border border-gray-200 dark:border-studio-700" />
                            ) : (
                              <div className="size-5 rounded bg-gray-200 dark:bg-studio-700 flex items-center justify-center font-bold text-[10px] text-gray-800 dark:text-white">
                                T
                              </div>
                            )}
                            <span className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">
                              {l.type === 'image' ? `Graphic #${idx + 1}` : l.text}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (designManager) designManager.removeLayer(l.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Delete Layer"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Back Layers Group */}
              <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-studio-800">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-studio-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Back Torso ({backLayers.length})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (onCameraChange) onCameraChange('back');
                        if (onTriggerUploadBack) onTriggerUploadBack();
                      }}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold px-1 rounded hover:bg-amber-50 dark:hover:bg-amber-500/20"
                      title="Upload Image to Back"
                    >
                      + Image
                    </button>
                    <button
                      onClick={() => {
                        if (onCameraChange) onCameraChange('back');
                        if (designManager) {
                          designManager.addLayer({
                            type: 'text',
                            side: 'back',
                            text: 'BACK TEXT',
                            textColor: '#000000',
                            x: 1520,
                            y: 800
                          });
                        }
                      }}
                      className="text-[10px] text-gray-600 dark:text-studio-300 hover:text-black dark:hover:text-white font-bold px-1 rounded hover:bg-gray-100 dark:hover:bg-studio-800"
                      title="Add Text to Back"
                    >
                      + Text
                    </button>
                  </div>
                </div>

                {backLayers.length === 0 ? (
                  <div className="text-[10px] text-gray-500 dark:text-studio-400 italic bg-gray-50 dark:bg-studio-800/60 rounded-lg p-1.5 text-center border border-gray-100 dark:border-studio-800">
                    No back designs applied
                  </div>
                ) : (
                  <div className="space-y-1">
                    {backLayers.map((l, idx) => {
                      const isActive = l.id === designManager?.activeLayerId;
                      return (
                        <div
                          key={l.id}
                          onClick={() => {
                            if (designManager) designManager.setActiveLayer(l.id);
                            if (onCameraChange) onCameraChange('back');
                            if (onOpenPositionGuide) onOpenPositionGuide();
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-xl border cursor-pointer transition-all ${
                            isActive
                              ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 ring-1 ring-amber-300 dark:ring-amber-500/30'
                              : 'bg-white dark:bg-studio-800 border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-750'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {l.type === 'image' && l.image ? (
                              <img src={l.image.src} alt="" className="size-5 rounded object-cover border border-gray-200 dark:border-studio-700" />
                            ) : (
                              <div className="size-5 rounded bg-gray-200 dark:bg-studio-700 flex items-center justify-center font-bold text-[10px] text-gray-800 dark:text-white">
                                T
                              </div>
                            )}
                            <span className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">
                              {l.type === 'image' ? `Graphic #${idx + 1}` : l.text}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (designManager) designManager.removeLayer(l.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Delete Layer"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Garment Color */}
        <div className="border-b border-gray-100 dark:border-studio-800 py-2.5">
          <button
            onClick={() => toggleSection('color')}
            className="w-full flex items-center justify-between font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-brand-accent py-1 transition-colors"
          >
            <span>Garment Color</span>
            {openSection === 'color' ? (
              <ChevronDown className="size-4 text-gray-400 dark:text-studio-400" />
            ) : (
              <ChevronRight className="size-4 text-gray-400 dark:text-studio-400" />
            )}
          </button>

          {openSection === 'color' && (
            <div className="pt-3 pb-1 space-y-2.5 animate-fadeIn">
              <div className="grid grid-cols-4 gap-2">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = garmentColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      onClick={() => onGarmentColorChange(swatch.hex)}
                      className={`relative aspect-square rounded-full border transition-all ${
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-500/50 scale-110'
                          : 'border-gray-200 dark:border-studio-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={garmentColor}
                  onChange={(e) => onGarmentColorChange(e.target.value)}
                  className="size-6 rounded-full cursor-pointer border border-gray-200 dark:border-studio-700 bg-transparent"
                />
                <span className="text-[11px] font-mono text-gray-500 dark:text-studio-400 uppercase">{garmentColor}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Background */}
        <div className="border-b border-gray-100 dark:border-studio-800 py-2.5">
          <button
            onClick={() => toggleSection('bg')}
            className="w-full flex items-center justify-between font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-brand-accent py-1 transition-colors"
          >
            <span>Background</span>
            {openSection === 'bg' ? (
              <ChevronDown className="size-4 text-gray-400 dark:text-studio-400" />
            ) : (
              <ChevronRight className="size-4 text-gray-400 dark:text-studio-400" />
            )}
          </button>

          {openSection === 'bg' && (
            <div className="pt-2.5 pb-1 grid grid-cols-2 gap-1.5 animate-fadeIn">
              <button
                onClick={() => onBackdropModeChange('dark')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                  backdropMode === 'dark' ? 'bg-black dark:bg-brand-500 text-white' : 'border-gray-200 dark:border-studio-700 text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                }`}
              >
                Dark Studio
              </button>
              <button
                onClick={() => onBackdropModeChange('light')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                  backdropMode === 'light' ? 'bg-black dark:bg-brand-500 text-white' : 'border-gray-200 dark:border-studio-700 text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                }`}
              >
                Clean Grey
              </button>
              <button
                onClick={() => onBackdropModeChange('transparent')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border col-span-2 transition-all ${
                  backdropMode === 'transparent' ? 'bg-black dark:bg-brand-500 text-white' : 'border-gray-200 dark:border-studio-700 text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                }`}
              >
                Transparent (PNG)
              </button>
            </div>
          )}
        </div>

        {/* 3. Animation */}
        <div className="border-b border-gray-100 dark:border-studio-800 py-2.5">
          <button
            onClick={() => toggleSection('anim')}
            className="w-full flex items-center justify-between font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-brand-accent py-1 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Play className="size-3.5 text-gray-400 dark:text-studio-400" />
              <span>Animation</span>
            </div>
            {openSection === 'anim' ? (
              <ChevronDown className="size-4 text-gray-400 dark:text-studio-400" />
            ) : (
              <ChevronRight className="size-4 text-gray-400 dark:text-studio-400" />
            )}
          </button>

          {openSection === 'anim' && (
            <div className="pt-2 pb-1 space-y-1.5 animate-fadeIn">
              <button
                onClick={() => onAnimationModeChange('static')}
                className={`w-full py-1.5 px-2.5 rounded-xl text-left font-medium text-[11px] flex items-center justify-between ${
                  animationMode === 'static' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                }`}
              >
                <span>Static</span>
                {animationMode === 'static' && <Check className="size-3 text-black dark:text-white" />}
              </button>

              <button
                onClick={() => onAnimationModeChange('walking')}
                className={`w-full py-1.5 px-2.5 rounded-xl text-left font-medium text-[11px] flex items-center justify-between ${
                  animationMode === 'walking' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Play className="size-3 text-emerald-500" />
                  <span>Walk</span>
                </div>
                {animationMode === 'walking' && <Check className="size-3 text-black dark:text-white" />}
              </button>

              <button
                onClick={() => onAnimationModeChange('waves')}
                className={`w-full py-1.5 px-2.5 rounded-xl text-left font-medium text-[11px] flex items-center justify-between ${
                  animationMode === 'waves' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Wind className="size-3 text-sky-500" />
                  <span>Waves</span>
                </div>
                {animationMode === 'waves' && <Check className="size-3 text-black dark:text-white" />}
              </button>

              <button
                onClick={() => {
                  onAnimationModeChange('knit');
                  if (onTriggerKnit) onTriggerKnit();
                }}
                className={`w-full py-1.5 px-2.5 rounded-xl text-left font-medium text-[11px] flex items-center justify-between ${
                  animationMode === 'knit' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Knit</span>
                </div>
                {animationMode === 'knit' && <Check className="size-3 text-black dark:text-white" />}
              </button>

              {/* Animation Speed Slider */}
              <div className="p-2 bg-gray-50 dark:bg-studio-800/80 rounded-xl border border-gray-150 dark:border-studio-700 space-y-1.5 mt-1.5 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 dark:text-studio-300">
                  <span>Animation Speed</span>
                  <span className="font-mono text-black dark:text-white font-bold bg-white dark:bg-studio-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-studio-700">
                    {(walkSpeed || 1.0).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.1"
                  value={walkSpeed || 1.0}
                  onChange={(e) => onWalkSpeedChange(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              <button
                onClick={() => onAnimationModeChange('turntable')}
                className={`w-full py-1.5 px-2.5 rounded-xl text-left font-medium text-[11px] flex items-center justify-between ${
                  animationMode === 'turntable' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="size-3 text-brand-500" />
                  <span>360° Turntable</span>
                </div>
                {animationMode === 'turntable' && <Check className="size-3 text-black dark:text-white" />}
              </button>

              <button
                onClick={() => onAnimationModeChange('rotate_walk')}
                className={`w-full py-1.5 px-2.5 rounded-xl text-left font-medium text-[11px] flex items-center justify-between ${
                  animationMode === 'rotate_walk' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <RotateCw className="size-3 text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Rotate & Walk</span>
                </div>
                {animationMode === 'rotate_walk' && <Check className="size-3 text-black dark:text-white" />}
              </button>
            </div>
          )}
        </div>

        {/* 4. Camera Animation */}
        <div className="border-b border-gray-100 dark:border-studio-800 py-2.5">
          <button
            onClick={() => toggleSection('cam')}
            className="w-full flex items-center justify-between font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-brand-accent py-1 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>Camera Animation</span>
            </div>
            {openSection === 'cam' ? (
              <ChevronDown className="size-4 text-gray-400 dark:text-studio-400" />
            ) : (
              <ChevronRight className="size-4 text-gray-400 dark:text-studio-400" />
            )}
          </button>

          {openSection === 'cam' && (
            <div className="pt-2 pb-1 space-y-2 animate-fadeIn">
              <div className="space-y-1">
                <button
                  onClick={() => onCameraAnimationModeChange('none')}
                  className={`w-full py-1.5 px-2 rounded-xl text-left text-[11px] font-medium flex items-center justify-between ${
                    cameraAnimationMode === 'none' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                  }`}
                >
                  <span>None (Manual Orbit)</span>
                  {cameraAnimationMode === 'none' && <Check className="size-3 text-black dark:text-white" />}
                </button>
                <button
                  onClick={() => onCameraAnimationModeChange('rotate')}
                  className={`w-full py-1.5 px-2 rounded-xl text-left text-[11px] font-medium flex items-center justify-between ${
                    cameraAnimationMode === 'rotate' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                  }`}
                >
                  <span>Rotate 360°</span>
                  {cameraAnimationMode === 'rotate' && <Check className="size-3 text-black dark:text-white" />}
                </button>
                <button
                  onClick={() => onCameraAnimationModeChange('rotatezoom')}
                  className={`w-full py-1.5 px-2 rounded-xl text-left text-[11px] font-medium flex items-center justify-between ${
                    cameraAnimationMode === 'rotatezoom' ? 'bg-gray-100 dark:bg-studio-800 font-bold text-black dark:text-white' : 'text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800/60'
                  }`}
                >
                  <span>Rotation & Zoom</span>
                  {cameraAnimationMode === 'rotatezoom' && <Check className="size-3 text-black dark:text-white" />}
                </button>
              </div>

              <div className="pt-1">
                <div className="text-[10px] font-bold text-gray-500 dark:text-studio-400 mb-1">Camera Presets</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      onCameraAnimationModeChange('none');
                      onCameraChange('front');
                    }}
                    className="py-1 px-2 rounded-xl text-[10px] font-semibold border border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300"
                  >
                    Front View
                  </button>
                  <button
                    onClick={() => {
                      onCameraAnimationModeChange('none');
                      onCameraChange('back');
                    }}
                    className="py-1 px-2 rounded-xl text-[10px] font-semibold border border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300"
                  >
                    Back View
                  </button>
                  <button
                    onClick={() => {
                      onCameraAnimationModeChange('none');
                      onCameraChange('hero');
                    }}
                    className="py-1 px-2 rounded-xl text-[10px] font-semibold border border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300"
                  >
                    Hero 45°
                  </button>
                  <button
                    onClick={() => {
                      onCameraAnimationModeChange('none');
                      onCameraChange('chest');
                    }}
                    className="py-1 px-2 rounded-xl text-[10px] font-semibold border border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300"
                  >
                    Chest Zoom
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Advanced Controls: Acid Wash & Puff Print */}
        <div className="py-2.5">
          <button
            onClick={() => toggleSection('effects')}
            className="w-full flex items-center justify-between font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-brand-accent py-1 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Settings className="size-3.5 text-gray-500 dark:text-studio-400" />
              <span>Advanced Effects</span>
            </div>
            {openSection === 'effects' ? (
              <ChevronDown className="size-4 text-gray-400 dark:text-studio-400" />
            ) : (
              <ChevronRight className="size-4 text-gray-400 dark:text-studio-400" />
            )}
          </button>

          {openSection === 'effects' && (
            <div className="pt-2 pb-1 space-y-3 animate-fadeIn">
              {/* Acid Wash Slider */}
              <div className="p-2 bg-gray-50 dark:bg-studio-800/80 rounded-xl border border-gray-150 dark:border-studio-700 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-700 dark:text-studio-300">
                  <span>Acid Wash</span>
                  <span className="font-mono text-black dark:text-white bg-white dark:bg-studio-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-studio-700">
                    {Math.round((acidWash || 0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={acidWash || 0}
                  onChange={(e) => onAcidWashChange(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              {/* Puff Print Slider */}
              <div className="p-2 bg-gray-50 dark:bg-studio-800/80 rounded-xl border border-gray-150 dark:border-studio-700 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-700 dark:text-studio-300">
                  <span>Puff Print Relief</span>
                  <span className="font-mono text-black dark:text-white bg-white dark:bg-studio-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-studio-700">
                    {Math.round((puffPrint || 0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={puffPrint || 0}
                  onChange={(e) => onPuffPrintChange(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Export Pill matching screenshot */}
      <button
        onClick={onOpenExport}
        className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs py-3.5 px-5 rounded-full flex items-center justify-between shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
      >
        <span>Export</span>
        <div className="size-6 rounded-full bg-white/20 flex items-center justify-center">
          <Video className="size-3.5 fill-white" />
        </div>
      </button>

    </aside>
  );
}
