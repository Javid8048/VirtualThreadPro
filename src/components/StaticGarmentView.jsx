import React, { useState, useEffect } from 'react';
import { Box, Sun, Moon, Download } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

export function StaticGarmentView({
  garmentType,
  garmentColor,
  designManager,
  onSwitchTo3D,
  backdropMode,
  customBackground = null,
  customBgImage = null,
  backgroundBlur = 0,
  activeSide: propActiveSide = 'front',
  onSideChange,
  theme = 'dark',
  onToggleTheme,
  onOpenExport
}) {
  const [layers, setLayers] = useState([]);
  const [internalSide, setInternalSide] = useState('front');

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

  const product = GARMENT_PRODUCTS.find((p) => p.id === garmentType) || {
    id: garmentType,
    title: garmentType.toUpperCase().replace('_', ' ') + ' STUDIO'
  };

  // Respected front vs back layers
  const currentLayers = layers.filter((l) => (l.side || 'front') === activeSide);

  // Background style (supports dark, grey/light, transparent, and custom)
  const bgClasses = {
    dark: 'bg-[radial-gradient(ellipse_at_center,_#1f2229_0%,_#16181f_45%,_#0f1115_100%)]',
    light: 'bg-[#e5e7eb]',
    grey: 'bg-[#2b2c34]',
    transparent: 'bg-transparent',
    custom: 'bg-[#0f1115]'
  }[backdropMode] || 'bg-[radial-gradient(ellipse_at_center,_#1f2229_0%,_#16181f_45%,_#0f1115_100%)]';

  const effectiveBgImage = customBackground || customBgImage;

  return (
    <div className={`absolute inset-0 z-10 flex items-center justify-center select-none overflow-hidden ${bgClasses} transition-colors duration-300`}>
      {/* Custom Device Background Layer */}
      {backdropMode === 'custom' && effectiveBgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-300"
          style={{
            backgroundImage: `url(${effectiveBgImage})`,
            filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : 'none',
            transform: backgroundBlur > 0 ? 'scale(1.06)' : 'none'
          }}
        />
      )}
      {backdropMode === 'custom' && (
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      )}
      
      {/* Top 2D Studio Bar: Title, Switch to 3D, Export, and Theme toggle */}
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

        {onOpenExport && (
          <button
            onClick={onOpenExport}
            className="ml-0.5 sm:ml-1 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-brand-500/25 transition-all active:scale-95 shrink-0"
            title="Open Export Studio"
          >
            <Download className="size-3.5" />
            <span>Export</span>
          </button>
        )}

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

      {/* Main Garment Display Container with 2D Perspective */}
      <div className="relative w-[560px] max-w-[85vw] aspect-square flex items-center justify-center transition-all duration-300">
        
        {/* Dynamic Fabric Color Overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl transition-colors duration-300"
          style={{
            backgroundColor: garmentColor,
            maskImage: `url(${activeSide === 'back' ? getAssetUrl(`/garments/${garmentType}_back.png`) : getAssetUrl(`/garments/${garmentType}.png`)})`,
            WebkitMaskImage: `url(${activeSide === 'back' ? getAssetUrl(`/garments/${garmentType}_back.png`) : getAssetUrl(`/garments/${garmentType}.png`)})`,
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

        {/* Photorealistic Garment Display (Authentic Front & Back Views for all 9 Blanks) */}
        <img
          src={
            activeSide === 'back'
              ? getAssetUrl(`/garments/${garmentType}_back.png`)
              : getAssetUrl(`/garments/${garmentType}.png`)
          }
          alt={`${product.title} ${activeSide.toUpperCase()}`}
          className="w-full h-full object-contain filter drop-shadow-2xl pointer-events-none transition-all duration-300"
          draggable={false}
        />

        {/* Dynamic Decals / Graphic Layer Placement Overlay (Calibrated precisely on chest matching 3D) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`relative flex items-center justify-center w-48 h-56 ${activeSide === 'back' ? '-mt-16' : '-mt-24 sm:-mt-28'}`}>
            {currentLayers.map((layer) => {
              const scale = layer.scale || 1.0;
              const rotation = layer.rotation || 0;
              const isHoodie = garmentType === 'hoodie' || garmentType === 'zip_hoodie';
              const centerX = layer.side === 'back' ? (isHoodie ? 416 : 1528) : (isHoodie ? 430 : 480);
              const centerY = layer.side === 'back' ? (isHoodie ? 1530 : 960) : (isHoodie ? 730 : 720);
              const offsetX = ((layer.x - centerX) / 400) * 80;
              const offsetY = ((layer.y - centerY) / 400) * 80;

              const imgSrc = typeof layer.image === 'string'
                ? layer.image
                : (layer.image?.src || (layer.image?.toDataURL ? layer.image.toDataURL() : null));

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
                  {layer.type === 'image' && imgSrc ? (
                    <img
                      src={imgSrc}
                      alt="Garment Decal"
                      className="max-w-[140px] max-h-[140px] object-contain drop-shadow-lg"
                    />
                  ) : layer.type === 'text' ? (
                    <div
                      style={{
                        color: layer.textColor || '#000000',
                        fontFamily: layer.fontFamily || 'Inter',
                        fontSize: `${Math.max(14, (layer.fontSize || 12) * 1.5)}px`
                      }}
                      className="font-black text-center whitespace-nowrap drop-shadow-md select-none tracking-tight"
                    >
                      {layer.text}
                    </div>
                  ) : layer.type === 'shape' ? (
                    <svg
                      viewBox="-60 -60 120 120"
                      className="w-24 h-24 object-contain drop-shadow-lg overflow-visible"
                    >
                      {layer.shapeType === 'circle' && (
                        <circle cx="0" cy="0" r="45" fill={layer.fillColor || '#ffffff'} stroke={layer.strokeColor || '#000000'} strokeWidth={layer.strokeWidth ?? 4} />
                      )}
                      {layer.shapeType === 'rectangle' && (
                        <rect x="-45" y="-45" width="90" height="90" rx="8" fill={layer.fillColor || '#ffffff'} stroke={layer.strokeColor || '#000000'} strokeWidth={layer.strokeWidth ?? 4} />
                      )}
                      {layer.shapeType === 'star' && (
                        <polygon
                          points="0,-45 13,-14 45,-14 19,7 28,40 0,20 -28,40 -19,7 -45,-14 -13,-14"
                          fill={layer.fillColor || '#f59e0b'}
                          stroke={layer.strokeColor || '#000000'}
                          strokeWidth={layer.strokeWidth ?? 3}
                        />
                      )}
                      {layer.shapeType === 'triangle' && (
                        <polygon
                          points="0,-45 45,35 -45,35"
                          fill={layer.fillColor || '#ffffff'}
                          stroke={layer.strokeColor || '#000000'}
                          strokeWidth={layer.strokeWidth ?? 4}
                        />
                      )}
                      {layer.shapeType === 'badge' && (
                        <polygon
                          points="0,-48 42,-24 42,24 0,48 -42,24 -42,-24"
                          fill={layer.fillColor || '#3b82f6'}
                          stroke={layer.strokeColor || '#000000'}
                          strokeWidth={layer.strokeWidth ?? 4}
                        />
                      )}
                    </svg>
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
