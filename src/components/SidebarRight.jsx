import React from 'react';
import { Palette, Play, Wind, Sun, Compass, Sparkles, Moon, Layers, Sliders } from 'lucide-react';

const COLOR_SWATCHES = [
  { name: 'Vintage Black', hex: '#14161b' },
  { name: 'Charcoal Wash', hex: '#2b2d34' },
  { name: 'Off-White Cream', hex: '#eae5dc' },
  { name: 'Crisp White', hex: '#fbfbfd' },
  { name: 'Sage Green', hex: '#3f4f46' },
  { name: 'Cobalt Royal', hex: '#1a3365' },
  { name: 'Terracotta', hex: '#7a3e30' },
  { name: 'Washed Lilac', hex: '#5c546e' },
  { name: 'Mocha Earth', hex: '#443730' },
  { name: 'Neon Electric', hex: '#d4ff00' }
];

export function SidebarRight({
  garmentColor,
  onGarmentColorChange,
  fabricFinish,
  onFabricFinishChange,
  animationMode,
  onAnimationModeChange,
  turntableSpeed,
  onTurntableSpeedChange,
  lightingPreset,
  onLightingPresetChange,
  backdropMode,
  onBackdropModeChange
}) {
  return (
    <aside className="w-80 border-l border-studio-800 bg-studio-900/70 backdrop-blur-md flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-4 gap-6 select-none z-10">
      
      {/* Garment Color */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-brand-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-studio-300">Garment Color</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-studio-850 px-2 py-0.5 rounded-lg border border-studio-800">
            <input
              type="color"
              value={garmentColor}
              onChange={(e) => onGarmentColorChange(e.target.value)}
              className="size-4 rounded cursor-pointer bg-transparent border-0"
            />
            <span className="text-[10px] font-mono text-studio-300 uppercase">{garmentColor}</span>
          </div>
        </div>

        {/* Color swatches */}
        <div className="grid grid-cols-5 gap-2">
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = garmentColor.toLowerCase() === swatch.hex.toLowerCase();
            return (
              <button
                key={swatch.hex}
                onClick={() => onGarmentColorChange(swatch.hex)}
                className={`relative aspect-square rounded-xl transition-all border ${
                  isSelected
                    ? 'border-brand-accent scale-105 shadow-glow-accent ring-2 ring-brand-accent/40'
                    : 'border-studio-700/60 hover:scale-105'
                }`}
                style={{ backgroundColor: swatch.hex }}
                title={swatch.name}
              />
            );
          })}
        </div>
      </section>

      {/* Fabric Material & Wash */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="size-4 text-brand-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-studio-300">Fabric Finish</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onFabricFinishChange('cotton')}
            className={`p-2 rounded-xl border text-center transition-all ${
              fabricFinish === 'cotton'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold">280 GSM</div>
            <div className="text-[9px] text-studio-500">Raw Cotton</div>
          </button>

          <button
            onClick={() => onFabricFinishChange('acid_wash')}
            className={`p-2 rounded-xl border text-center transition-all ${
              fabricFinish === 'acid_wash'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold">Acid Wash</div>
            <div className="text-[9px] text-studio-500">Mineral wash</div>
          </button>

          <button
            onClick={() => onFabricFinishChange('vintage_fade')}
            className={`p-2 rounded-xl border text-center transition-all ${
              fabricFinish === 'vintage_fade'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold">Sun Fade</div>
            <div className="text-[9px] text-studio-500">Vintage aged</div>
          </button>
        </div>
      </section>

      {/* Motion & Animations */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Wind className="size-4 text-brand-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-studio-300">Motion & Animation</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAnimationModeChange('turntable')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              animationMode === 'turntable'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold flex items-center gap-1.5">
              <Compass className="size-3.5 text-brand-accent" />
              <span>360° Turntable</span>
            </div>
            <div className="text-[10px] text-studio-500 mt-0.5">Smooth rotating preview</div>
          </button>

          <button
            onClick={() => onAnimationModeChange('wind')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              animationMode === 'wind'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold flex items-center gap-1.5">
              <Wind className="size-3.5 text-sky-400" />
              <span>Wind Flutter</span>
            </div>
            <div className="text-[10px] text-studio-500 mt-0.5">Dynamic cloth ripple</div>
          </button>

          <button
            onClick={() => onAnimationModeChange('walk')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              animationMode === 'walk'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold flex items-center gap-1.5">
              <Play className="size-3.5 text-emerald-400" />
              <span>Walker Bounce</span>
            </div>
            <div className="text-[10px] text-studio-500 mt-0.5">Invisible model stride</div>
          </button>

          <button
            onClick={() => onAnimationModeChange('none')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              animationMode === 'none'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold">Static Frame</div>
            <div className="text-[10px] text-studio-500 mt-0.5">Freeze motion</div>
          </button>
        </div>

        {/* Turntable speed control */}
        {animationMode === 'turntable' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-studio-400 font-medium">Rotation Speed</span>
              <span className="text-studio-200 font-mono text-[11px]">{(turntableSpeed * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.2"
              step="0.1"
              value={turntableSpeed}
              onChange={(e) => onTurntableSpeedChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </section>

      {/* Studio Lighting */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sun className="size-4 text-brand-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-studio-300">Studio Lighting</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onLightingPresetChange('studio')}
            className={`p-2 rounded-xl border text-center transition-all ${
              lightingPreset === 'studio'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold">Softbox</div>
            <div className="text-[9px] text-studio-500">Commercial</div>
          </button>

          <button
            onClick={() => onLightingPresetChange('cyber')}
            className={`p-2 rounded-xl border text-center transition-all ${
              lightingPreset === 'cyber'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold">Cyberpunk</div>
            <div className="text-[9px] text-studio-500">Neon dual</div>
          </button>

          <button
            onClick={() => onLightingPresetChange('golden')}
            className={`p-2 rounded-xl border text-center transition-all ${
              lightingPreset === 'golden'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <div className="text-xs font-bold">Sunset</div>
            <div className="text-[9px] text-studio-500">Warm rim</div>
          </button>
        </div>
      </section>

      {/* Studio Backdrop */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Moon className="size-4 text-brand-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-studio-300">Backdrop</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onBackdropModeChange('dark')}
            className={`py-2 px-1 rounded-xl border text-center transition-all ${
              backdropMode === 'dark'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <span className="text-xs font-bold">Luxury Dark</span>
          </button>

          <button
            onClick={() => onBackdropModeChange('light')}
            className={`py-2 px-1 rounded-xl border text-center transition-all ${
              backdropMode === 'light'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <span className="text-xs font-bold">Clean Grey</span>
          </button>

          <button
            onClick={() => onBackdropModeChange('transparent')}
            className={`py-2 px-1 rounded-xl border text-center transition-all ${
              backdropMode === 'transparent'
                ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm'
                : 'border-studio-800 bg-studio-850 text-studio-400 hover:text-studio-200'
            }`}
          >
            <span className="text-xs font-bold">Transparent</span>
          </button>
        </div>
      </section>

    </aside>
  );
}
