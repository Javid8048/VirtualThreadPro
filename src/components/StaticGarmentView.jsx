import React, { useState, useEffect } from 'react';
import { Box, Sun, Moon } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

export function StaticGarmentView({
  garmentType,
  garmentColor,
  designManager,
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
          className="w-full h-full object-contain filter drop-shadow-2xl pointer-events-none transition-all duration-300"
          draggable={false}
        />

        {/* ========================================================================= */}
        {/* Authentic BACK VIEW Overlays (Per Garment: covers front-only features)     */}
        {/* ========================================================================= */}
        {activeSide === 'back' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <svg
              viewBox="0 0 560 560"
              className="w-full h-full object-contain"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="backCollarShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
                </filter>
                <filter id="backPocketShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.18" />
                </filter>
              </defs>

              {/* 1. POLO SHIRT BACK VIEW: Cover collar scoop, placket, and buttons */}
              {garmentType === 'polo' && (
                <>
                  {/* Opaque shield covering front placket and buttons */}
                  <rect
                    x="250"
                    y="65"
                    width="60"
                    height="165"
                    rx="4"
                    fill={garmentColor || '#ffffff'}
                  />
                  {/* High Back Turned-Down Collar Band */}
                  <path
                    d="M 230 54 Q 280 64 330 54 Q 342 86 280 86 Q 218 86 230 54 Z"
                    fill={garmentColor || '#ffffff'}
                    filter="url(#backCollarShadow)"
                  />
                  <path
                    d="M 228 53 Q 280 65 332 53"
                    fill="none"
                    stroke={garmentColor === '#ffffff' ? '#d4d4d8' : 'rgba(0,0,0,0.22)'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 230 56 Q 280 68 330 56"
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                  {/* Back Shoulder Yoke Seam */}
                  <line x1="165" y1="135" x2="395" y2="135" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="4,2" opacity="0.40" />
                  <line x1="280" y1="86" x2="280" y2="390" stroke="#000000" strokeWidth="1" strokeDasharray="8,6" opacity="0.06" />
                </>
              )}

              {/* 2. SWEATPANTS BACK VIEW: Cover front drawstrings, add back pockets */}
              {garmentType === 'sweatpants' && (
                <>
                  {/* Opaque shield covering front drawstrings and fly */}
                  <rect
                    x="230"
                    y="30"
                    width="100"
                    height="175"
                    rx="6"
                    fill={garmentColor || '#ffffff'}
                  />
                  {/* Clean continuous back elastic waistband */}
                  <path
                    d="M 195 40 Q 280 48 365 40"
                    fill="none"
                    stroke={garmentColor === '#ffffff' ? '#d4d4d8' : 'rgba(0,0,0,0.20)'}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 195 44 Q 280 52 365 44"
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth="1.2"
                    strokeDasharray="4,2"
                  />
                  {/* Center Back Rise Seam */}
                  <line x1="280" y1="46" x2="280" y2="225" stroke="#a1a1aa" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.5" />
                  {/* Left Back Patch Pocket */}
                  <polygon
                    points="218,85 258,85 258,135 238,148 218,135"
                    fill={garmentColor || '#ffffff'}
                    stroke={garmentColor === '#ffffff' ? '#d4d4d8' : 'rgba(0,0,0,0.18)'}
                    strokeWidth="1.5"
                    filter="url(#backPocketShadow)"
                  />
                  {/* Right Back Patch Pocket */}
                  <polygon
                    points="302,85 342,85 342,135 322,148 302,135"
                    fill={garmentColor || '#ffffff'}
                    stroke={garmentColor === '#ffffff' ? '#d4d4d8' : 'rgba(0,0,0,0.18)'}
                    strokeWidth="1.5"
                    filter="url(#backPocketShadow)"
                  />
                </>
              )}

              {/* 3. HOODIES (PULLOVER & ZIP) BACK VIEW: Cover pocket & zipper, show draped back hood */}
              {(garmentType === 'hoodie' || garmentType === 'zip_hoodie') && (
                <>
                  {/* Opaque shield covering front kangaroo pocket & zipper runner */}
                  <rect
                    x="180"
                    y="225"
                    width="200"
                    height="195"
                    rx="8"
                    fill={garmentColor || '#ffffff'}
                  />
                  {/* Smooth back torso seam */}
                  <line x1="280" y1="120" x2="280" y2="410" stroke="#000000" strokeWidth="1" strokeDasharray="8,6" opacity="0.05" />
                  {/* Draped 3D Back Hood Overlay */}
                  <path
                    d="M 215 48 Q 280 128 345 48 Q 280 32 215 48 Z"
                    fill={garmentColor || '#ffffff'}
                    filter="url(#backCollarShadow)"
                  />
                  <path
                    d="M 215 48 Q 280 128 345 48"
                    fill="none"
                    stroke={garmentColor === '#ffffff' ? '#d4d4d8' : 'rgba(0,0,0,0.20)'}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 218 52 Q 280 124 342 52"
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                </>
              )}

              {/* 4. CAP BACK VIEW: Cover visor brim, show strap & arch opening */}
              {garmentType === 'cap' && (
                <>
                  {/* Visor occlusion overlay */}
                  <ellipse cx="280" cy="420" rx="140" ry="40" fill={garmentColor || '#ffffff'} opacity="0.9" />
                  {/* Rear semi-circular arch cutout */}
                  <path
                    d="M 240 370 Q 280 330 320 370 Z"
                    fill="#18181b"
                  />
                  {/* Adjustable fabric closure strap */}
                  <rect x="235" y="372" width="90" height="14" rx="3" fill={garmentColor || '#ffffff'} stroke="#a1a1aa" strokeWidth="1" />
                  {/* Metallic brass closure buckle */}
                  <rect x="305" y="370" width="14" height="18" rx="2" fill="#d4d4d4" stroke="#71717a" strokeWidth="1" />
                </>
              )}

              {/* 5. T-SHIRTS & SWEATSHIRT BACK VIEW: High back neck, dropped shoulder seams */}
              {garmentType !== 'polo' && garmentType !== 'sweatpants' && garmentType !== 'hoodie' && garmentType !== 'zip_hoodie' && garmentType !== 'cap' && (
                <>
                  {/* Inside Neck Scoop Fill Cover */}
                  <path
                    d="M 244 64 C 254 84, 306 84, 316 64 C 300 58, 260 58, 244 64 Z"
                    fill={garmentColor || '#ffffff'}
                    filter="url(#backCollarShadow)"
                  />
                  {/* High Back Neckline Ribbed Collar Rim */}
                  <path
                    d="M 242 63 Q 280 72 318 63"
                    fill="none"
                    stroke={garmentColor === '#ffffff' ? '#e2e2e8' : 'rgba(0,0,0,0.18)'}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Back Neck Ribbing Double Stitch */}
                  <path
                    d="M 242 66 Q 280 75 318 66"
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                  />
                  {/* Dropped Shoulder Seams across upper back */}
                  <line x1="165" y1="140" x2="242" y2="64" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="4,2" opacity="0.45" />
                  <line x1="395" y1="140" x2="318" y2="64" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="4,2" opacity="0.45" />
                  {/* Subtle Back Center Spine Crease */}
                  <line x1="280" y1="78" x2="280" y2="400" stroke="#000000" strokeWidth="1" strokeDasharray="8,6" opacity="0.06" />
                </>
              )}

            </svg>
          </div>
        )}

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
