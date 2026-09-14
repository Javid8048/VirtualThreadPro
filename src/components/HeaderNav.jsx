import React, { useState } from 'react';
import { Layers, Sparkles, ChevronDown, Download, Play, ShoppingBag, Check } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';

export function HeaderNav({
  currentGarmentType = 'oversized_tee',
  onSelectGarment,
  onOpenProductsCatalog,
  onOpenGetStarted,
  onOpenExport
}) {
  const [isGarmentMenuOpen, setIsGarmentMenuOpen] = useState(false);

  const currentGarment = GARMENT_PRODUCTS.find(p => p.id === currentGarmentType) || GARMENT_PRODUCTS[0];

  return (
    <header className="absolute top-6 left-6 right-6 h-14 bg-studio-900/85 backdrop-blur-xl border border-studio-800 rounded-full shadow-2xl px-6 flex items-center justify-between z-30 select-none text-white">
      
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenProductsCatalog}>
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-black text-sm tracking-tighter shadow-glow-brand">
            VT
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight leading-none">VirtualThreads</span>
            <span className="text-[9px] font-mono text-studio-400 leading-tight">3D MOCKUP GENERATOR</span>
          </div>
        </div>
      </div>

      {/* Center Controls: Garment Type Selector & Products Catalog */}
      <div className="flex items-center gap-2">
        
        {/* Garment Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsGarmentMenuOpen(!isGarmentMenuOpen)}
            className="px-4 py-2 rounded-full bg-studio-800 hover:bg-studio-750 border border-studio-700/60 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <span className="w-2 h-2 rounded-full bg-brand-accent" />
            <span className="max-w-[140px] sm:max-w-none truncate">{currentGarment.title.replace(' STUDIO', '')}</span>
            <ChevronDown className={`size-3.5 text-studio-400 transition-transform duration-200 ${isGarmentMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isGarmentMenuOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-studio-900 border border-studio-750 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
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

        {/* Products / Blanks Catalog Button */}
        <button
          onClick={onOpenProductsCatalog}
          className="px-3.5 py-2 rounded-full bg-studio-800/80 hover:bg-studio-750 border border-studio-700/40 text-xs font-semibold text-studio-300 hover:text-white flex items-center gap-1.5 transition-all active:scale-95"
          title="Open Products & Blanks Catalog"
        >
          <ShoppingBag className="size-3.5" />
          <span className="hidden sm:inline">3D Mockups</span>
        </button>

      </div>

      {/* Right Actions: Export */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenExport}
          className="px-4 py-2 rounded-full bg-studio-800 hover:bg-studio-750 border border-studio-700/60 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

    </header>
  );
}
