import React, { useState, useEffect } from 'react';
import { Box, RotateCw, Sparkles, Layers, Download, Check } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

export function StaticGarmentView({
  garmentType,
  garmentColor,
  designManager,
  onSwitchTo3D,
  backdropMode
}) {
  const [layers, setLayers] = useState([]);
  const [activeSide, setActiveSide] = useState('front');

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

  // Background style
  const bgClasses = {
    dark: 'bg-[#0e0f14]',
    grey: 'bg-[#2b2c34]',
    transparent: 'bg-transparent'
  }[backdropMode] || 'bg-[#0e0f14]';

  return (
    <div className={`absolute inset-0 z-10 flex items-center justify-center select-none overflow-hidden ${bgClasses}`}>
      
      {/* Top Notification Pill: Mode Switcher */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-studio-900/90 backdrop-blur-xl border border-studio-750 px-4 py-2 rounded-full shadow-2xl text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-extrabold text-white tracking-wide">{product.title}</span>
        <span className="text-[10px] font-mono text-studio-400 border-l border-studio-700 pl-2">STATIC STUDIO VIEW</span>

        <button
          onClick={onSwitchTo3D}
          className="ml-2 px-3 py-1 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-glow-brand transition-all active:scale-95"
          title="Return to interactive 3D WebGL model"
        >
          <Box className="size-3.5" />
          <span>Switch to 3D View</span>
        </button>
      </div>

      {/* Main Garment Display Container */}
      <div className="relative w-[560px] max-w-[85vw] aspect-square flex items-center justify-center">
        
        {/* Dynamic Fabric Color Overlay */}
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

        {/* Base Photorealistic Static Garment Image */}
        <img
          src={getAssetUrl(`/garments/${garmentType}.png`)}
          alt={product.title}
          className="w-full h-full object-contain filter drop-shadow-2xl pointer-events-none"
          draggable={false}
        />

        {/* Dynamic Decals / Graphic Layer Placement Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Centered Graphic Chest Print Zone */}
          <div className="relative w-48 h-56 -mt-10 flex items-center justify-center">
            {currentLayers.map((layer) => {
              const scale = layer.scale || 1.0;
              const rotation = layer.rotation || 0;
              // Center offset calculation from 2D coordinates
              const centerX = layer.side === 'back' ? 1520 : 530;
              const offsetX = ((layer.x - centerX) / 400) * 80;
              const offsetY = ((layer.y - 800) / 400) * 80;

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

      {/* Front / Back Toggle Pill at Bottom */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-studio-900/85 backdrop-blur-md px-2 py-1 rounded-full border border-studio-750 shadow-xl text-xs font-bold text-white">
        <button
          onClick={() => setActiveSide('front')}
          className={`px-3 py-1 rounded-full transition-all ${
            activeSide === 'front'
              ? 'bg-brand-500 text-white shadow-glow-brand'
              : 'text-studio-400 hover:text-white'
          }`}
        >
          Front View
        </button>
        <button
          onClick={() => setActiveSide('back')}
          className={`px-3 py-1 rounded-full transition-all ${
            activeSide === 'back'
              ? 'bg-brand-500 text-white shadow-glow-brand'
              : 'text-studio-400 hover:text-white'
          }`}
        >
          Back View
        </button>
      </div>

    </div>
  );
}
