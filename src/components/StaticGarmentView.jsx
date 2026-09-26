import React, { useState, useEffect } from 'react';
import { Box, Sun, Moon } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

export function StaticGarmentView({
  garmentType,
  garmentColor,
  designManager,
  sceneManager,
  onSwitchTo3D,
  backdropMode,
  activeSide: propActiveSide = 'front',
  onSideChange,
  theme = 'dark',
  onToggleTheme,
  onOpenExport
}) {
  const [layers, setLayers] = useState([]);
  const [internalSide, setInternalSide] = useState('front');
  const [snapshot, setSnapshot] = useState(null);

  const activeSide = propActiveSide || internalSide;

  const handleSideToggle = (side) => {
    setInternalSide(side);
    if (onSideChange) {
      onSideChange(side);
    }
  };

  useEffect(() => {
    if (!designManager) return;
    const sync = () => setLayers([...designManager.layers]);
    sync();
    return designManager.subscribe(sync);
  }, [designManager]);

  const product = GARMENT_PRODUCTS.find(p => p.id === garmentType) || {
    id: garmentType,
    title: garmentType.toUpperCase().replace('_', ' ') + ' STUDIO'
  };

  const currentLayers = layers.filter(l => (l.side || 'front') === activeSide);

  // Sync snapshot with current side, garment type, and color
  useEffect(() => {
    const sm = sceneManager || (typeof window !== 'undefined' ? window.__sceneManager : null);
    if (!sm) return;

    let isMounted = true;
    const performCapture = () => {
      if (!isMounted) return;
      try {
        const snap = sm.captureGarmentSnapshot(activeSide, 1000, 1000);
        if (snap && isMounted) {
          setSnapshot(snap);
        }
      } catch (err) {
        console.warn('Failed to capture snapshot in 2D Flat view:', err);
      }
    };

    sm.ensureGarmentModelLoaded(garmentType, () => {
      performCapture();
    });

    performCapture();

    return () => {
      isMounted = false;
    };
  }, [sceneManager, garmentType, garmentColor, activeSide]);

  // Background style
  const bgClasses = {
    dark: 'bg-[#0e0f14]',
    grey: 'bg-[#2b2c34]',
    transparent: 'bg-transparent'
  }[backdropMode] || 'bg-[#0e0f14]';

  return (
    <div className={`absolute inset-0 z-10 flex items-center justify-center select-none overflow-hidden ${bgClasses} transition-colors duration-300`}>
      
      {/* Top 2D Studio Bar: Title, Switch to 3D, and Theme toggle */}
      <header className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 bg-white/95 dark:bg-studio-900/90 backdrop-blur-xl border border-gray-200/90 dark:border-studio-700/60 px-4 py-2 rounded-full shadow-2xl text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="font-extrabold text-gray-900 dark:text-white tracking-wide uppercase">
          {product.title.replace(' STUDIO', '')}
        </span>
        <span className="text-[10px] font-mono text-gray-500 dark:text-studio-400 border-l border-gray-300 dark:border-studio-700 pl-2 hidden sm:inline uppercase">
          2D Flat Mockup Studio
        </span>

        <button
          onClick={onSwitchTo3D}
          className="ml-1 sm:ml-2 px-3 py-1 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-brand-500/25 transition-all active:scale-95 shrink-0"
          title="Return to interactive 3D WebGL model"
        >
          <Box className="size-3.5" />
          <span>Switch to 3D Studio</span>
        </button>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1 rounded-full text-gray-500 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800 transition-colors shrink-0"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="size-3.5 text-amber-500" /> : <Moon className="size-3.5 text-indigo-500" />}
          </button>
        )}
      </header>

      {/* Main Garment Display Container with 3D Perspective */}
      <div 
        className="relative w-[560px] max-w-[85vw] aspect-square flex items-center justify-center transition-all duration-300"
      >
        
        {/* Dynamic Fabric Color Overlay - fallback when snapshot is not yet ready */}
        {!snapshot && (
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl transition-colors duration-300"
            style={{
              backgroundColor: garmentColor,
              maskImage: `url(${getAssetUrl(`/garments/${garmentType}.png`)})`,
              WebkitMaskImage: `url(${getAssetUrl(`/garments/${garmentType}.png`)})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              mixBlendMode: 'multiply',
              opacity: garmentColor.toLowerCase() === '#ffffff' ? 0 : 0.72
            }}
          />
        )}

        {/* Photorealistic Garment Display: Clean 3D Snapshot or static fallback */}
        <img
          src={snapshot || getAssetUrl(`/garments/${garmentType}.png`)}
          alt={`${product.title} ${activeSide.toUpperCase()}`}
          className="w-full h-full object-contain filter drop-shadow-2xl pointer-events-none transition-all duration-300"
          draggable={false}
        />

        {/* Dynamic Decals / Graphic Layer Placement Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Graphic Print Zone (Chest on Front, Upper/Mid Torso on Back; Thigh/Pocket on Sweatpants; Crown on Cap) */}
          <div 
            className={`relative flex items-center justify-center ${
              garmentType === 'sweatpants'
                ? (activeSide === 'back' ? 'w-28 h-32 ml-24 -mt-16' : 'w-32 h-36 -ml-20 mt-4')
                : garmentType === 'cap'
                ? 'w-36 h-28 -mt-14'
                : 'w-48 h-56 -mt-8'
            }`}
          >
            {currentLayers.map((layer) => {
              const scale = layer.scale || 1.0;
              const rotation = layer.rotation || 0;
              // Center offset calculation from 2D coordinates (Front center 530, Back center 1520, Y center 800)
              const centerX = layer.side === 'back' ? 1520 : 530;
              const centerY = 800;
              const offsetX = ((layer.x - centerX) / 400) * 80;
              const offsetY = ((layer.y - centerY) / 400) * 80;

              return (
                <div
                  key={layer.id}
                  className="absolute transition-transform duration-75"
                  style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) scale(${scale})`,
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                >
                  {layer.type === 'image' && layer.image ? (
                    <img
                      src={layer.image.src}
                      alt="Garment Decal"
                      className="max-w-[140px] max-h-[140px] object-contain drop-shadow-lg"
                    />
                  ) : layer.type === 'text' ? (
                    <div
                      style={{
                        color: layer.textColor || '#000000',
                        fontFamily: layer.fontFamily || 'Inter',
                        fontSize: `${(layer.fontSize || 32) * 0.45}px`
                      }}
                      className="font-black text-center whitespace-nowrap drop-shadow-md select-none tracking-tight"
                    >
                      {layer.text}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Front / Back View Toggle Pill at Bottom */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/95 dark:bg-studio-900/90 backdrop-blur-xl px-2 py-1.5 rounded-full border border-gray-200/90 dark:border-studio-700/60 shadow-2xl text-xs font-bold text-gray-900 dark:text-white">
        <button
          onClick={() => handleSideToggle('front')}
          className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeSide === 'front'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
              : 'text-gray-600 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
        >
          <span>Front View</span>
        </button>
        <button
          onClick={() => handleSideToggle('back')}
          className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeSide === 'back'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
              : 'text-gray-600 dark:text-studio-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-studio-800'
          }`}
        >
          <span>Back View</span>
        </button>
      </div>

    </div>
  );
}
