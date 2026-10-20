import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Settings, ChevronDown, ChevronRight, Video, Check, Wind, Play, Compass, Image as ImageIcon, Layers, Trash2, Plus, Type, Shirt, ShoppingBag, ArrowLeft, RotateCw, X, Sliders } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

const COLOR_SWATCHES = [
  { name: 'Pure White (Lacoste Blanc)', hex: '#ffffff' },
  { name: 'Lacoste Heritage Green', hex: '#002D18' },
  { name: 'Lacoste Court Green', hex: '#06532A' },
  { name: 'Lacoste Tennis Red', hex: '#D30018' },
  { name: 'Lacoste Sunshine Yellow', hex: '#FCD757' },
  { name: 'Lacoste Sky Blue', hex: '#8DC3DE' },
  { name: 'Lacoste Navy', hex: '#1a243f' },
  { name: 'Washed Black', hex: '#24272e' },
  { name: 'Heather Grey', hex: '#7a7d85' },
  { name: 'Vintage Cream', hex: '#f0ede6' }
];

export const LACOSTE_BADGES = [
  {
    id: 'crocodile_classic',
    name: 'Classic Crocodile',
    category: 'Crocodile',
    src: '/lacoste_designs/lacoste_crocodile_official.svg',
    defaultScale: 0.35,
    defaultPrintType: 'embroidery',
    desc: 'Official green embroidered crocodile with red tongue'
  },
  {
    id: 'crocodile_white',
    name: 'White Monochrome Crocodile',
    category: 'Crocodile',
    src: '/lacoste_designs/lacoste_crocodile_white.svg',
    defaultScale: 0.35,
    defaultPrintType: 'embroidery',
    desc: 'Monochrome white tennis crocodile'
  },
  {
    id: 'crocodile_noir',
    name: 'Noir Matte Crocodile',
    category: 'Crocodile',
    src: '/lacoste_designs/lacoste_crocodile_noir.svg',
    defaultScale: 0.35,
    defaultPrintType: 'embroidery',
    desc: 'Stealth noir crocodile emblem'
  },
  {
    id: 'lacoste_1933_crest',
    name: '1933 Heritage Crest',
    category: 'Heritage',
    src: '/lacoste_designs/lacoste_1933_crest.png',
    defaultScale: 0.50,
    defaultPrintType: 'embroidery',
    desc: 'Vintage championship tennis crest'
  },
  {
    id: 'roland_garros_stripe',
    name: 'Roland Garros Racing Stripe',
    category: 'Stripes',
    src: '/lacoste_designs/roland_garros_stripe.png',
    defaultScale: 0.85,
    defaultPrintType: 'screen',
    desc: 'French tricolor racing chest band'
  },
  {
    id: 'lacoste_wordmark',
    name: 'Lacoste Wordmark',
    category: 'Typography',
    src: '/lacoste_designs/lacoste_wordmark.svg',
    defaultScale: 0.45,
    defaultPrintType: 'screen',
    desc: 'Official bold condensed serif wordmark'
  }
];

export const DEFAULT_INTERNET_BACKGROUNDS = [];

export function SidebarLeft({
  garmentColor,
  onGarmentColorChange,
  isComparisonMode = false,
  onToggleComparison = () => {},
  blackPreset = {},
  onUpdateBlackPreset = () => {},
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
  currentCamera = 'front',
  onCameraChange,
  isZoomed = true,
  onToggleZoom,
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
  activeSide = 'front',
  onSideChange,
  isExportStudioOpen = false,
  onBackToLanding,
  customBackground = null,
  onCustomBackgroundUpload,
  onRemoveCustomBackground,
  backgroundBlur = 0,
  onBackgroundBlurChange,
  customBgImage = null,
  onCustomBgUpload,
  onRemoveCustomBg,
  onSelectPresetBg
}) {
  const [openSection, setOpenSection] = useState('designs'); // default to 'designs'
  const [layers, setLayers] = useState([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isBlackTweakOpen, setIsBlackTweakOpen] = useState(false);
  const bgFileInputRef = useRef(null);

  const handleBgFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onCustomBackgroundUpload) {
      onCustomBackgroundUpload(file);
    } else if (onCustomBgUpload) {
      onCustomBgUpload(e);
    }
    e.target.value = '';
  };

  // Sync design layers
  useEffect(() => {
    if (!designManager) return;
    const sync = () => setLayers([...designManager.layers]);
    sync();
    return designManager.subscribe(sync);
  }, [designManager]);

  const frontLayers = layers.filter((l) => (l.side || 'front') === 'front');
  const backLayers = layers.filter((l) => (l.side || 'front') === 'back');
  const leftSleeveLayers = layers.filter((l) => l.side === 'left_sleeve');
  const rightSleeveLayers = layers.filter((l) => l.side === 'right_sleeve');
  const isWalkable = true;

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleAddLacosteBadge = (badge) => {
    if (!designManager) return;
    const targetSide = activeSide || 'front';
    const isFront = targetSide === 'front';
    const isStripe = badge.id === 'roland_garros_stripe';
    const isWordmark = badge.id === 'lacoste_wordmark';
    const isHoodie = currentGarmentType === 'hoodie' || currentGarmentType === 'zip_hoodie';

    let targetX, targetY;
    if (isFront) {
      if (isStripe) {
        targetX = isHoodie ? 430 : 480;
        targetY = isHoodie ? 740 : 820;
      } else if (isWordmark) {
        targetX = isHoodie ? 430 : 480;
        targetY = isHoodie ? 730 : 700;
      } else {
        targetX = isHoodie ? 385 : 390;
        targetY = isHoodie ? 680 : 640;
      }
    } else {
      targetX = isHoodie ? 416 : 1528;
      targetY = isHoodie ? 1530 : 1528;
    }

    const badgeUrl = getAssetUrl(badge.src);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      designManager.addLayer({
        type: 'image',
        side: targetSide,
        image: img,
        dataUrl: badgeUrl,
        x: targetX,
        y: targetY,
        scale: badge.defaultScale || 0.40,
        rotation: 0,
        opacity: 1.0,
        printType: badge.defaultPrintType || 'embroidery'
      });
    };
    img.src = badgeUrl;
  };


  return (
    <>
      {/* Mobile Toggle Button (Visible only on mobile when sidebar is closed) */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed left-3 top-20 z-20 px-3 py-2 rounded-2xl bg-white/95 dark:bg-studio-900/95 text-gray-800 dark:text-white shadow-xl border border-gray-200/90 dark:border-studio-700/80 backdrop-blur-md active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
          title="Open Studio Tools"
        >
          <Settings className="size-3.5 text-brand-500" />
          <span>Tools</span>
        </button>
      )}

      {/* Mobile Backdrop Overlay (Clicking closes drawer) */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-35 animate-fadeIn"
        />
      )}

      <aside className={`fixed md:absolute left-3 md:left-6 top-16 md:top-20 bottom-3 md:bottom-6 w-64 max-w-[calc(100vw-24px)] rounded-3xl bg-white dark:bg-studio-900 text-gray-900 dark:text-studio-100 shadow-2xl p-4 flex flex-col justify-between select-none z-40 md:z-20 border border-gray-200/80 dark:border-studio-750/80 backdrop-blur-xl transition-all duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-[125%] md:translate-x-0'
      }`}>
        
        {/* Top Header Row: Back to Products & VirtualThreads branding & Mobile Close Button */}
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
            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden ml-1 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-studio-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              title="Close sidebar"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

      {/* Top Action Pill: Advanced Controls */}
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

              {/* T-Shirt Fit Selector: Instant toggle between Regular Fit & Oversized Fit */}
              {(currentGarmentType === 'oversized_tee' || currentGarmentType === 'regular_tee') && (
                <div className="pt-2 pb-1 border-t border-gray-100 dark:border-studio-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-studio-400 block mb-1.5">
                    Fit & Silhouette:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-studio-950 rounded-xl border border-gray-200 dark:border-studio-800">
                    <button
                      type="button"
                      onClick={() => onSelectGarment && onSelectGarment('regular_tee')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                        currentGarmentType === 'regular_tee'
                          ? 'bg-white dark:bg-studio-800 text-brand-600 dark:text-brand-accent shadow-xs ring-1 ring-gray-200 dark:ring-studio-700'
                          : 'text-gray-600 dark:text-studio-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span className="leading-tight">Regular Fit</span>
                      <span className="text-[8px] font-normal opacity-75">Standard Shoulders</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectGarment && onSelectGarment('oversized_tee')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                        currentGarmentType === 'oversized_tee'
                          ? 'bg-white dark:bg-studio-800 text-brand-600 dark:text-brand-accent shadow-xs ring-1 ring-gray-200 dark:ring-studio-700'
                          : 'text-gray-600 dark:text-studio-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span className="leading-tight">Oversized Fit</span>
                      <span className="text-[8px] font-normal opacity-75">Dropped Shoulder</span>
                    </button>
                  </div>
                </div>
              )}

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
              {/* Lacoste Co-Creation Badges Picker */}
              <div className="p-2 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Lacoste Badges & Graphics
                  </span>
                  <span className="text-[9px] font-mono text-emerald-500/70">1-Click</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {LACOSTE_BADGES.map((badge) => (
                    <button
                      key={badge.id}
                      onClick={() => handleAddLacosteBadge(badge)}
                      className="group/badge relative flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-studio-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-studio-700 hover:border-emerald-500/50 transition-all shadow-xs active:scale-95"
                      title={`Add ${badge.name} (${badge.desc})`}
                    >
                      <img
                        src={getAssetUrl(badge.src)}
                        alt={badge.name}
                        className="size-7 object-contain filter drop-shadow-sm group-hover/badge:scale-110 transition-transform pointer-events-none"
                      />
                      <span className="text-[8px] font-medium text-gray-700 dark:text-gray-300 group-hover/badge:text-emerald-500 truncate w-full text-center mt-1">
                        {badge.name.replace(' Crocodile', '')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
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
                        if (onSideChange) onSideChange('front');
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
                        if (onSideChange) onSideChange('front');
                        if (onCameraChange) onCameraChange('front');
                        if (designManager) {
                          designManager.addLayer({
                            type: 'text',
                            side: 'front',
                            text: 'FRONT TEXT',
                            textColor: '#000000',
                            x: 480,
                            y: 720
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
                            if (onSideChange) onSideChange('front');
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
                        if (onSideChange) onSideChange('back');
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
                        if (onSideChange) onSideChange('back');
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
                            if (onSideChange) onSideChange('back');
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
                            ) : l.type === 'shape' ? (
                              <div className="size-5 rounded bg-brand-500/20 text-brand-500 border border-brand-500/30 flex items-center justify-center font-bold text-[9px] uppercase">
                                {l.shapeType ? l.shapeType[0] : 'S'}
                              </div>
                            ) : (
                              <div className="size-5 rounded bg-gray-200 dark:bg-studio-700 flex items-center justify-center font-bold text-[10px] text-gray-800 dark:text-white">
                                T
                              </div>
                            )}
                            <span className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">
                              {l.type === 'image' ? `Graphic #${idx + 1}` : l.type === 'shape' ? `${l.shapeType || 'Shape'} #${idx + 1}` : l.text}
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

              {/* Left Sleeve Layers Group */}
              <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-studio-800">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-studio-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Left Sleeve ({leftSleeveLayers.length})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (onSideChange) onSideChange('left_sleeve');
                        if (onCameraChange) onCameraChange('left');
                        if (onOpenPositionGuide) onOpenPositionGuide();
                      }}
                      className="text-[10px] text-sky-600 dark:text-sky-400 hover:text-sky-800 font-bold px-1 rounded hover:bg-sky-50 dark:hover:bg-sky-500/20"
                    >
                      + Design
                    </button>
                  </div>
                </div>
                {leftSleeveLayers.length === 0 ? (
                  <div className="text-[10px] text-gray-500 dark:text-studio-400 italic bg-gray-50 dark:bg-studio-800/60 rounded-lg p-1.5 text-center border border-gray-100 dark:border-studio-800">
                    No left sleeve designs
                  </div>
                ) : (
                  <div className="space-y-1">
                    {leftSleeveLayers.map((l, idx) => {
                      const isActive = l.id === designManager?.activeLayerId;
                      return (
                        <div
                          key={l.id}
                          onClick={() => {
                            if (designManager) designManager.setActiveLayer(l.id);
                            if (onSideChange) onSideChange('left_sleeve');
                            if (onCameraChange) onCameraChange('left');
                            if (onOpenPositionGuide) onOpenPositionGuide();
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-xl border cursor-pointer transition-all ${
                            isActive
                              ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-300 dark:border-sky-500/50'
                              : 'bg-white dark:bg-studio-800 border-gray-200 dark:border-studio-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">
                              {l.type === 'image' ? `Graphic #${idx + 1}` : l.type === 'shape' ? `${l.shapeType || 'Shape'}` : l.text}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (designManager) designManager.removeLayer(l.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Sleeve Layers Group */}
              <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-studio-800">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-studio-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Right Sleeve ({rightSleeveLayers.length})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (onSideChange) onSideChange('right_sleeve');
                        if (onCameraChange) onCameraChange('right');
                        if (onOpenPositionGuide) onOpenPositionGuide();
                      }}
                      className="text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-800 font-bold px-1 rounded hover:bg-purple-50 dark:hover:bg-purple-500/20"
                    >
                      + Design
                    </button>
                  </div>
                </div>
                {rightSleeveLayers.length === 0 ? (
                  <div className="text-[10px] text-gray-500 dark:text-studio-400 italic bg-gray-50 dark:bg-studio-800/60 rounded-lg p-1.5 text-center border border-gray-100 dark:border-studio-800">
                    No right sleeve designs
                  </div>
                ) : (
                  <div className="space-y-1">
                    {rightSleeveLayers.map((l, idx) => {
                      const isActive = l.id === designManager?.activeLayerId;
                      return (
                        <div
                          key={l.id}
                          onClick={() => {
                            if (designManager) designManager.setActiveLayer(l.id);
                            if (onSideChange) onSideChange('right_sleeve');
                            if (onCameraChange) onCameraChange('right');
                            if (onOpenPositionGuide) onOpenPositionGuide();
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-xl border cursor-pointer transition-all ${
                            isActive
                              ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/50'
                              : 'bg-white dark:bg-studio-800 border-gray-200 dark:border-studio-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">
                              {l.type === 'image' ? `Graphic #${idx + 1}` : l.type === 'shape' ? `${l.shapeType || 'Shape'}` : l.text}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (designManager) designManager.removeLayer(l.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
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

              {/* Tweakable Controls for Black Preset */}
              <div className="pt-2 border-t border-gray-100 dark:border-studio-800">
                <button
                  type="button"
                  onClick={() => setIsBlackTweakOpen(!isBlackTweakOpen)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-600 dark:text-studio-300 hover:text-indigo-600 dark:hover:text-brand-accent py-1 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Sliders className="size-3 text-gray-400 dark:text-studio-400" />
                    <span>Black Preset Calibration</span>
                  </div>
                  {isBlackTweakOpen ? (
                    <ChevronDown className="size-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="size-3.5 text-gray-400" />
                  )}
                </button>

                {isBlackTweakOpen && (
                  <div className="mt-2 p-2.5 rounded-xl bg-gray-50/90 dark:bg-studio-800/80 border border-gray-200/80 dark:border-studio-700/60 space-y-2.5 text-[11px] animate-fadeIn">
                    {/* Base Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-studio-300 font-medium">Base Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={blackPreset.color || '#24272e'}
                          onChange={(e) => onUpdateBlackPreset({ color: e.target.value })}
                          className="size-5 rounded cursor-pointer border border-gray-300 dark:border-studio-600 bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-gray-500 dark:text-studio-400 uppercase">
                          {blackPreset.color || '#24272e'}
                        </span>
                      </div>
                    </div>

                    {/* Roughness */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-studio-400 mb-1">
                        <span>Roughness</span>
                        <span className="font-mono">{(blackPreset.roughness !== undefined ? blackPreset.roughness : 0.85).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={blackPreset.roughness !== undefined ? blackPreset.roughness : 0.85}
                        onChange={(e) => onUpdateBlackPreset({ roughness: parseFloat(e.target.value) })}
                        className="w-full accent-brand-500 h-1 bg-gray-200 dark:bg-studio-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Sheen Intensity */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-studio-400 mb-1">
                        <span>Sheen Intensity</span>
                        <span className="font-mono">{(blackPreset.sheen !== undefined ? blackPreset.sheen : 1.0).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={blackPreset.sheen !== undefined ? blackPreset.sheen : 1.0}
                        onChange={(e) => onUpdateBlackPreset({ sheen: parseFloat(e.target.value) })}
                        className="w-full accent-brand-500 h-1 bg-gray-200 dark:bg-studio-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Sheen Roughness */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-studio-400 mb-1">
                        <span>Sheen Roughness</span>
                        <span className="font-mono">{(blackPreset.sheenRoughness !== undefined ? blackPreset.sheenRoughness : 0.4).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={blackPreset.sheenRoughness !== undefined ? blackPreset.sheenRoughness : 0.4}
                        onChange={(e) => onUpdateBlackPreset({ sheenRoughness: parseFloat(e.target.value) })}
                        className="w-full accent-brand-500 h-1 bg-gray-200 dark:bg-studio-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Sheen Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-studio-300 font-medium">Sheen Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={blackPreset.sheenColor || '#5a5f6e'}
                          onChange={(e) => onUpdateBlackPreset({ sheenColor: e.target.value })}
                          className="size-5 rounded cursor-pointer border border-gray-300 dark:border-studio-600 bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-gray-500 dark:text-studio-400 uppercase">
                          {blackPreset.sheenColor || '#5a5f6e'}
                        </span>
                      </div>
                    </div>

                    {/* Cool Rim Light Intensity */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-studio-400 mb-1">
                        <span>Cool Rim Light (#9db0ff)</span>
                        <span className="font-mono">{(blackPreset.rimIntensity !== undefined ? blackPreset.rimIntensity : 2.5).toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={blackPreset.rimIntensity !== undefined ? blackPreset.rimIntensity : 2.5}
                        onChange={(e) => onUpdateBlackPreset({ rimIntensity: parseFloat(e.target.value) })}
                        className="w-full accent-brand-500 h-1 bg-gray-200 dark:bg-studio-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Normal Scale (Jersey Weave) */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-studio-400 mb-1">
                        <span>Jersey Weave Normal</span>
                        <span className="font-mono">{(blackPreset.normalScale !== undefined ? blackPreset.normalScale : 0.8).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={blackPreset.normalScale !== undefined ? blackPreset.normalScale : 0.8}
                        onChange={(e) => onUpdateBlackPreset({ normalScale: parseFloat(e.target.value) })}
                        className="w-full accent-brand-500 h-1 bg-gray-200 dark:bg-studio-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={() => onUpdateBlackPreset({
                        color: '#24272e',
                        roughness: 0.85,
                        metalness: 0.0,
                        sheen: 1.0,
                        sheenRoughness: 0.4,
                        sheenColor: '#5a5f6e',
                        normalScale: 0.8,
                        rimIntensity: 2.5
                      })}
                      className="w-full py-1 rounded-lg text-[10px] font-semibold text-gray-500 dark:text-studio-400 hover:text-gray-900 dark:hover:text-white bg-gray-200/60 dark:bg-studio-700/60 hover:bg-gray-200 dark:hover:bg-studio-700 transition-colors"
                    >
                      Reset Black Preset to Defaults
                    </button>
                  </div>
                )}
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
            <div className="flex items-center gap-2">
              <ImageIcon className="size-3.5 text-brand-500" />
              <span>Background & Device Image</span>
              {customBackground && (
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" title="Custom device background active" />
              )}
            </div>
            {openSection === 'bg' ? (
              <ChevronDown className="size-4 text-gray-400 dark:text-studio-400" />
            ) : (
              <ChevronRight className="size-4 text-gray-400 dark:text-studio-400" />
            )}
          </button>

          {openSection === 'bg' && (
            <div className="pt-2.5 pb-1 space-y-2.5 animate-fadeIn">
              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onBackdropModeChange('dark')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    backdropMode === 'dark' ? 'bg-black dark:bg-brand-500 text-white border-transparent shadow-xs' : 'border-gray-200 dark:border-studio-700 text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                  }`}
                >
                  <span className="size-2 rounded-full bg-studio-900 border border-white/40 shrink-0" />
                  <span>Dark Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => onBackdropModeChange('light')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    backdropMode === 'light' ? 'bg-black dark:bg-brand-500 text-white border-transparent shadow-xs' : 'border-gray-200 dark:border-studio-700 text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                  }`}
                >
                  <span className="size-2 rounded-full bg-[#ccd4e2] border border-gray-400/40 shrink-0" />
                  <span>Clean Grey</span>
                </button>
                <button
                  type="button"
                  onClick={() => onBackdropModeChange('transparent')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    backdropMode === 'transparent' ? 'bg-black dark:bg-brand-500 text-white border-transparent shadow-xs' : 'border-gray-200 dark:border-studio-700 text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                  }`}
                >
                  <span className="size-2 rounded-full bg-studio-800 border border-dashed border-gray-400 shrink-0" />
                  <span>Transparent</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customBackground || customBgImage) {
                      onBackdropModeChange('custom');
                    } else if (bgFileInputRef.current) {
                      bgFileInputRef.current.click();
                    }
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    backdropMode === 'custom' ? 'bg-black dark:bg-brand-500 text-white border-transparent shadow-xs' : 'border-gray-200 dark:border-studio-700 text-gray-600 dark:text-studio-300 hover:bg-gray-50 dark:hover:bg-studio-800'
                  }`}
                >
                  <ImageIcon className="size-3 shrink-0" />
                  <span>Device Image</span>
                </button>
              </div>

              {/* Hidden Global Input for Background File Selection */}
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/jpg"
                onChange={handleBgFileSelected}
                className="hidden"
              />

              {/* Upload CTA or Active Custom Image Card */}
              {!(customBackground || customBgImage) ? (
                <button
                  type="button"
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-gray-300 dark:border-studio-700 hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50/60 dark:bg-studio-850/60 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 text-gray-700 dark:text-studio-200 transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
                >
                  <UploadCloud className="size-4 text-brand-500 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="text-[11px] font-bold">Add Background from Device</span>
                </button>
              ) : (
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-studio-850 border border-gray-200 dark:border-studio-700 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-9 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-studio-700 bg-black/20">
                        <img src={customBackground || customBgImage} alt="Background" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-gray-900 dark:text-white truncate">
                          Device Background
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="size-2.5" />
                          <span>Active in Studio</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => bgFileInputRef.current?.click()}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-studio-800 hover:bg-gray-100 dark:hover:bg-studio-750 text-gray-700 dark:text-studio-200 border border-gray-200 dark:border-studio-700 transition-all shadow-2xs"
                        title="Upload a different image from device"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={onRemoveCustomBackground || onRemoveCustomBg}
                        className="size-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Remove custom background"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Depth of Field (Blur) Slider */}
                  <div className="pt-1.5 border-t border-gray-200/70 dark:border-studio-750">
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
          )}
        </div>

        {/* 3. Animation (3D Studio Only) */}
        {viewMode === '3d' && (
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

                {isWalkable ? (
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
                ) : (
                  <div className="w-full py-1.5 px-2.5 rounded-xl text-left font-medium text-[11px] flex items-center justify-between opacity-40 cursor-not-allowed bg-gray-50 dark:bg-studio-800/40 text-gray-400 dark:text-studio-500" title={`Walking motion is not supported on ${currentGarmentType.replace('_', ' ')}`}>
                    <div className="flex items-center gap-1.5">
                      <Play className="size-3 text-gray-400" />
                      <span>Walk</span>
                    </div>
                    <span className="text-[9px] font-mono">N/A</span>
                  </div>
                )}

                {isWalkable ? (
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
                ) : (
                  <div className="w-full py-1.5 px-2.5 rounded-xl text-left font-medium text-[11px] flex items-center justify-between opacity-40 cursor-not-allowed bg-gray-50 dark:bg-studio-800/40 text-gray-400 dark:text-studio-500" title={`Wave flutter is not supported on ${currentGarmentType.replace('_', ' ')}`}>
                    <div className="flex items-center gap-1.5">
                      <Wind className="size-3 text-gray-400" />
                      <span>Waves</span>
                    </div>
                    <span className="text-[9px] font-mono">N/A</span>
                  </div>
                )}

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

                {isWalkable ? (
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
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* 4. Camera Animation (3D Studio Only) */}
        {viewMode === '3d' && (
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
                  <div className="text-[10px] font-bold text-gray-500 dark:text-studio-400 mb-1">Camera Presets & Zoom</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        onCameraAnimationModeChange('none');
                        onCameraChange('front');
                      }}
                      className={`py-1 px-2 rounded-xl text-[10px] font-semibold border transition-all ${
                        currentCamera === 'front'
                          ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                          : 'border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300'
                      }`}
                    >
                      Front View
                    </button>
                    <button
                      onClick={() => {
                        onCameraAnimationModeChange('none');
                        onCameraChange('back');
                      }}
                      className={`py-1 px-2 rounded-xl text-[10px] font-semibold border transition-all ${
                        currentCamera === 'back'
                          ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                          : 'border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300'
                      }`}
                    >
                      Back View
                    </button>
                    <button
                      onClick={() => {
                        onCameraAnimationModeChange('none');
                        onCameraChange('hero');
                      }}
                      className={`py-1 px-2 rounded-xl text-[10px] font-semibold border transition-all ${
                        currentCamera === 'hero'
                          ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                          : 'border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300'
                      }`}
                    >
                      Hero 45°
                    </button>
                    <button
                      onClick={() => {
                        if (onToggleZoom) onToggleZoom();
                        else onCameraChange('zoom');
                      }}
                      className={`py-1 px-2 rounded-xl text-[10px] font-semibold border transition-all ${
                        isZoomed
                          ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                          : 'border-gray-200 dark:border-studio-700 hover:bg-gray-50 dark:hover:bg-studio-800 text-gray-700 dark:text-studio-300'
                      }`}
                    >
                      {isZoomed ? 'Zoomed (ON)' : 'Zoom (OFF)'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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

              {/* Fabric Texture Finish */}
              <div className="p-2 bg-gray-50 dark:bg-studio-800/80 rounded-xl border border-gray-150 dark:border-studio-700 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-700 dark:text-studio-300">
                  <span>Fabric Texture &amp; Weave</span>
                  <span className="font-mono text-black dark:text-white capitalize">
                    {designManager?.fabricFinish?.replace('_', ' ') || 'Cotton'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  {[
                    { id: 'cotton', label: 'Cotton' },
                    { id: 'mineral_wash', label: 'Mineral' },
                    { id: 'heavy_terry', label: 'Terry' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => designManager?.setFabricFinish?.(f.id)}
                      className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all ${
                        (designManager?.fabricFinish || 'cotton') === f.id
                          ? 'bg-black dark:bg-brand-500 text-white shadow-xs'
                          : 'bg-white dark:bg-studio-900 text-gray-600 dark:text-studio-300 border border-gray-200 dark:border-studio-700 hover:bg-gray-100 dark:hover:bg-studio-750'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </aside>
    </>
  );
}
