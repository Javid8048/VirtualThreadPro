import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { createDefaultLogos } from '../utils/textureGenerator';

export function PresetGalleryModal({ isOpen, onClose, onApplyPreset }) {
  if (!isOpen) return null;

  const defaultLogos = createDefaultLogos();

  const presets = [
    {
      id: 'streetwear_vintage',
      title: 'Tokyo Streetwear Archive',
      description: 'Heavyweight washed black tee with vintage typography and 3D puff print finish.',
      color: '#14161b',
      finish: 'acid_wash',
      lighting: 'studio',
      printType: 'puff',
      logoUrl: defaultLogos[0].dataUrl,
      accent: 'border-blue-500/50'
    },
    {
      id: 'cyber_neon',
      title: 'Neo District Cyberpunk',
      description: 'Dark obsidian base with neon star emblem under high-contrast dual neon rim lights.',
      color: '#0d0f14',
      finish: 'cotton',
      lighting: 'cyber',
      printType: 'screen',
      logoUrl: defaultLogos[1].dataUrl,
      accent: 'border-pink-500/50'
    },
    {
      id: 'vintage_acid',
      title: '90s Acid Rave',
      description: 'Sun-faded mineral wash garment with bold neon yellow smiley face.',
      color: '#2b2d34',
      finish: 'vintage_fade',
      lighting: 'golden',
      printType: 'puff',
      logoUrl: defaultLogos[2].dataUrl,
      accent: 'border-amber-500/50'
    },
    {
      id: 'clean_cream',
      title: 'Minimalist Studio Cream',
      description: 'Off-white organic cotton crewneck with crisp subtle studio lighting.',
      color: '#eae5dc',
      finish: 'cotton',
      lighting: 'studio',
      printType: 'screen',
      logoUrl: defaultLogos[0].dataUrl,
      accent: 'border-emerald-500/50'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-studio-900 border border-studio-700/80 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-studio-400 hover:text-white p-1 rounded-xl hover:bg-studio-800 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="size-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Curated Style Presets</h3>
            <p className="text-xs text-studio-400">One-click apparel styling, lighting, and finishes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {presets.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onApplyPreset(p);
                onClose();
              }}
              className={`p-4 rounded-2xl bg-studio-850/80 border ${p.accent} hover:border-brand-accent cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-brand-accent transition-colors">
                    {p.title}
                  </span>
                  <div
                    className="size-4 rounded-full border border-white/20 shadow-inner"
                    style={{ backgroundColor: p.color }}
                  />
                </div>
                <p className="text-[11px] text-studio-400 leading-relaxed">{p.description}</p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-studio-800/80 text-[10px] text-studio-400 font-mono">
                <span className="capitalize">{p.finish.replace('_', ' ')} • {p.printType}</span>
                <span className="text-brand-400 font-bold group-hover:underline">Apply →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
