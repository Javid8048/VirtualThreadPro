import React, { useState, useMemo } from 'react';
import { 
  Info, ArrowRight, ExternalLink, Shirt, Search, Play, 
  Layers, Compass, Video, X, Sun, Moon, Lock, Sparkles, Check
} from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

// Garment categories definition
const CATEGORIES = [
  { id: 'all', label: 'All Blanks', count: 11 },
  { id: 'tshirts', label: 'T-Shirts', count: 4, ids: ['oversized_tee', 'cropped_tee', 'regular_tee', 'hanging_tee'] },
  { id: 'outerwear', label: 'Hoodies & Outerwear', count: 3, ids: ['hoodie', 'zip_hoodie', 'hanging_hoodie'] },
  { id: 'sweatshirts', label: 'Sweatshirts', count: 1, ids: ['sweatshirt'] },
  { id: 'polo', label: 'Polo Shirts', count: 1, ids: ['polo'] },
  { id: 'bottoms', label: 'Bottoms & Caps', count: 2, ids: ['sweatpants', 'cap'] },
];

// Curated blank fabric weight, fit and rating dictionary (Editorial Style)
const BLANK_SPECS = {
  oversized_tee: { gsm: '280 GSM', score: '9.85', fit: 'Oversized Drop-Shoulder', material: '100% Combed Cotton', anim: 'Walk, Run & 360° Spin' },
  hoodie: { gsm: '420 GSM', score: '9.92', fit: 'Double-Layer Draped Hood', material: 'Heavyweight Fleece', anim: 'Walk, Wind & Kangaroo Pocket' },
  sweatshirt: { gsm: '380 GSM', score: '9.74', fit: 'Ribbed Crewneck', material: 'French Terry Cotton', anim: 'Torso & Back Decals' },
  cropped_tee: { gsm: '240 GSM', score: '9.65', fit: 'Boxy Cropped Silhouette', material: '100% Organic Cotton', anim: 'Walk & Side Look' },
  regular_tee: { gsm: '220 GSM', score: '9.50', fit: 'Classic Tailored Fit', material: 'Ringspun Cotton', anim: 'Dual-Zone Placement' },
  zip_hoodie: { gsm: '400 GSM', score: '9.88', fit: 'Full-Zip Metal Runner', material: 'Brushed Heavyweight Fleece', anim: 'Split Pocket & Back Graphic' },
  polo: { gsm: '260 GSM', score: '9.45', fit: 'Ribbed Collar & 2-Button Placket', material: 'Pique Knit Cotton', anim: 'Chest Embroidery Zone' },
  hanging_tee: { gsm: '240 GSM', score: '9.60', fit: 'Studio Wooden Hanger Rig', material: 'Natural Gravity Drape', anim: 'Gentle Breeze & Sway' },
  hanging_hoodie: { gsm: '420 GSM', score: '9.80', fit: 'Suspended Hanger Display', material: 'Heavyweight Fleece Drape', anim: 'Relaxed Silhouette' },
  sweatpants: { gsm: '360 GSM', score: '9.70', fit: 'Elastic Ankle Cuffs', material: 'Cotton Fleece Blend', anim: 'Side Thigh & Hip Zones' },
  cap: { gsm: '320 GSM', score: '9.55', fit: '6-Panel Curved Visor', material: '100% Cotton Twill', anim: 'Front Crown Embroidery' }
};

// Curated Studio Guides (Matching BWG "Latest links")

export function LandingPage({
  onSelectGarment,
  onOpenPricing,
  onOpenCatalog,
  theme = 'dark',
  onToggleTheme
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInfoGarment, setActiveInfoGarment] = useState(null);

  // Filter garments by category and search query
  const filteredGarments = useMemo(() => {
    let list = GARMENT_PRODUCTS;

    if (selectedCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      if (cat && cat.ids) {
        list = list.filter(item => cat.ids.includes(item.id));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const spec = BLANK_SPECS[item.id] || {};
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (spec.fit && spec.fit.toLowerCase().includes(q)) ||
          (spec.material && spec.material.toLowerCase().includes(q)) ||
          (spec.gsm && spec.gsm.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[#f6f6f3] dark:bg-[#121417] text-[#1a1c1e] dark:text-[#f3f4f6] font-sans selection:bg-[#fff09f] dark:selection:bg-[#ffe66d] selection:text-[#1a1c1e] flex flex-col justify-between transition-colors duration-200">
      
      {/* 1. Frosted Sticky Header Navigation (BWG Aesthetic) */}
      <header className="sticky top-0 z-40 w-full border-b border-[#e3e4df] dark:border-white/10 bg-[#f6f6f3]/90 dark:bg-[#121417]/90 backdrop-blur-md transition-colors">
        <div className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          
          {/* Brand Monogram & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {/* BWG-style Inverted Monogram Badge */}
            <div className="h-8 px-2 rounded-md bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e] flex items-center justify-center font-mono font-bold text-xs tracking-wider shadow-sm group-hover:scale-105 transition-transform">
              VT
            </div>
            
            <div className="flex flex-col">
              <span className="font-editorial font-bold text-base sm:text-lg tracking-tight leading-none text-[#1a1c1e] dark:text-white">
                VirtualThreads
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5e656d] dark:text-[#94a3b8] mt-0.5">
                3D Apparel Gallery
              </span>
            </div>
          </div>

          {/* Center Category Switcher Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-[#edece8] dark:bg-white/5 p-1 rounded-full border border-[#e3e4df] dark:border-white/10">
            {CATEGORIES.slice(0, 5).map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    const el = document.getElementById('studio-blanks-grid');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e] shadow-sm font-semibold'
                      : 'text-[#5e656d] dark:text-[#94a3b8] hover:text-[#1a1c1e] dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="size-8 rounded-lg border border-[#e3e4df] dark:border-white/10 bg-white/60 dark:bg-white/5 text-[#5e656d] dark:text-[#94a3b8] hover:text-[#1a1c1e] dark:hover:text-white flex items-center justify-center transition-colors"
                title={theme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}
                aria-label="Toggle Color Theme"
              >
                {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-600" />}
              </button>
            )}

            {/* Launch 3D Studio Action */}
            <button
              onClick={() => onSelectGarment('oversized_tee')}
              className="h-8 px-3.5 rounded-lg bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e] font-sans font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <span>Launch Studio</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        
        {/* Curated Studio Blanks Gallery */}
        <section id="studio-blanks-grid" className="pt-8 sm:pt-12 pb-16 sm:pb-24">
          
          {/* Unique Refined Editorial Introduction Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#e3e4df] dark:border-white/10 mb-8">
            <div className="max-w-3xl">
              {/* Monospace Spec Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-white/5 text-[11px] font-mono text-[#5e656d] dark:text-[#94a3b8] mb-3 shadow-xs">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-[#1a1c1e] dark:text-[#f3f4f6]">11 Calibrated Blanks</span>
                <span>·</span>
                <span>Real-Time 3D Physics</span>
                <span>·</span>
                <span>4K WebGL</span>
              </div>

              {/* Unique Editorial Serif Headline */}
              <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#1a1c1e] dark:text-white leading-[1.1] mb-3">
                Curated Streetwear Blanks
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm md:text-base text-[#5e656d] dark:text-[#94a3b8] leading-relaxed font-normal">
                Select from 11 photorealistic streetwear blanks to apply custom graphics, preview tactile puff print textures, and render smooth 3D walking animations.
              </p>
            </div>

            {/* Quick Spec Pills */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="px-3 py-1.5 rounded-lg border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-[#181b20] text-xs font-mono text-[#1a1c1e] dark:text-[#f3f4f6] shadow-xs">
                <span className="text-[#5e656d] dark:text-[#94a3b8]">Weights:</span> 220–420 GSM
              </span>
              <span className="px-3 py-1.5 rounded-lg border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-[#181b20] text-xs font-mono text-[#1a1c1e] dark:text-[#f3f4f6] shadow-xs">
                <span className="text-[#5e656d] dark:text-[#94a3b8]">Decals:</span> 1:1 UV Mapping
              </span>
              <span className="px-3 py-1.5 rounded-lg border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-[#181b20] text-xs font-mono text-[#1a1c1e] dark:text-[#f3f4f6] shadow-xs">
                <span className="text-[#5e656d] dark:text-[#94a3b8]">Export:</span> 60 FPS Video
              </span>
            </div>
          </div>

          {/* Interactive Filter Toolbar & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e] font-semibold shadow-xs'
                        : 'bg-white dark:bg-[#181b20] text-[#5e656d] dark:text-[#94a3b8] hover:text-[#1a1c1e] dark:hover:text-white border border-[#e3e4df] dark:border-white/10'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${isActive ? 'bg-white/20 dark:bg-black/20' : 'bg-[#edece8] dark:bg-white/10'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Instant Search Bar */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#5e656d] dark:text-[#94a3b8] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blanks (e.g. 420 GSM, Tee)..."
                className="w-full sm:w-64 bg-white dark:bg-[#181b20] border border-[#e3e4df] dark:border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-[#1a1c1e] dark:text-white placeholder:text-[#5e656d] dark:placeholder:text-[#94a3b8] focus:outline-none focus:border-[#1a1c1e] dark:focus:border-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Empty Search Result State */}
          {filteredGarments.length === 0 && (
            <div className="w-full py-16 text-center rounded-2xl border border-dashed border-[#e3e4df] dark:border-white/10 bg-white/40 dark:bg-white/[0.02] flex flex-col items-center justify-center">
              <Shirt className="size-10 text-[#5e656d] dark:text-[#94a3b8] mb-3" />
              <p className="text-base font-editorial font-bold text-[#1a1c1e] dark:text-white mb-1">No blanks match "{searchQuery}"</p>
              <p className="text-xs text-[#5e656d] dark:text-[#94a3b8] mb-4">Try clearing your search query or selecting "All Blanks".</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e]"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* 3-Column Curated Blank Cards Grid (Modeled on BWG article cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredGarments.map((product) => {
              const spec = BLANK_SPECS[product.id] || {};
              return (
                <article
                  key={product.id}
                  data-garment-id={product.id}
                  className="group flex flex-col cursor-pointer"
                  onClick={() => onSelectGarment(product.id)}
                >
                  {/* Framed Mockup Preview Frame (BWG figure style with 8:5 ratio) */}
                  <figure className="relative aspect-[8/5] w-full rounded-xl border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-[#181b20] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex items-center justify-center p-6">
                    
                    {/* Top-Right Pinned Monospace Spec/Rating Badge */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                      {spec.gsm && (
                        <span className="px-2 py-0.5 rounded-md border border-[#e3e4df] dark:border-white/10 bg-white/90 dark:bg-[#141619]/90 text-[11px] font-mono font-bold text-[#1a1c1e] dark:text-white backdrop-blur-sm shadow-xs">
                          {spec.gsm}
                        </span>
                      )}
                      {spec.score && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#fff09f] dark:bg-[#ffe66d] text-[11px] font-mono font-bold text-[#1a1c1e] shadow-xs">
                          {spec.score}
                        </span>
                      )}
                    </div>

                    {/* Top-Left Category Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#5e656d] dark:text-[#94a3b8] px-2 py-0.5 rounded bg-[#f6f6f3] dark:bg-white/5 border border-[#e3e4df] dark:border-white/10">
                        {product.category}
                      </span>
                    </div>

                    {/* High-Resolution Streetwear Mockup Image */}
                    <img
                      src={getAssetUrl(`/garments/${product.id}.png`)}
                      alt={product.title}
                      className="max-h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300 ease-out z-0"
                      loading="lazy"
                    />

                    {/* Hover Dark Vignette & Circular Action Pills (BWG style) */}
                    <div className="absolute inset-0 bg-[#1a1c1e]/40 dark:bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGarment(product.id);
                        }}
                        className="size-10 rounded-full bg-white dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Open in 3D Customizer"
                        aria-label="Open in 3D Customizer"
                      >
                        <ArrowRight className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveInfoGarment(product);
                        }}
                        className="size-10 rounded-full bg-white dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="View Blank Specifications"
                        aria-label="View Blank Specifications"
                      >
                        <Info className="size-4" />
                      </button>
                    </div>
                  </figure>

                  {/* Card Metadata Section (BWG Typographic Layout) */}
                  <section className="pt-3.5 pb-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5e656d] dark:text-[#94a3b8]">
                      <span>{spec.fit || product.category}</span>
                      <span>{spec.anim ? '3D Animated' : 'Static Blank'}</span>
                    </div>

                    <h3 className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-[#1a1c1e] dark:text-white group-hover:underline text-left">
                      {product.title}
                    </h3>

                    <p className="text-xs text-[#5e656d] dark:text-[#94a3b8] line-clamp-1 text-left">
                      {spec.material || product.description}
                    </p>
                  </section>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* 6. Editorial Colophon Footer (BWG Style) */}
      <footer className="border-t border-[#e3e4df] dark:border-white/10 bg-[#f0f0ed] dark:bg-[#0e1013] py-8 text-xs text-[#5e656d] dark:text-[#94a3b8] transition-colors">
        <div className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e] font-bold">
              VT
            </span>
            <span>VirtualThreads Studio — 3D Streetwear Archive &amp; Customizer</span>
          </div>

          <div className="flex items-center gap-4 text-center sm:text-right">
            <span>11 Blanks Online</span>
            <span>·</span>
            <span>Three.js WebGL Engine</span>
            <span>·</span>
            <span>Curated Edition 2026</span>
          </div>
        </div>
      </footer>

      {/* Blank Specifications Modal (BWG Detail View) */}
      {activeInfoGarment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#181b20] text-[#1a1c1e] dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-[#e3e4df] dark:border-white/10">
            
            <button
              onClick={() => setActiveInfoGarment(null)}
              className="absolute top-4 right-4 text-[#5e656d] dark:text-[#94a3b8] hover:text-[#1a1c1e] dark:hover:text-white p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Close Modal"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-[#edece8] dark:bg-white/10 text-[#1a1c1e] dark:text-white flex items-center justify-center font-mono font-bold text-xs">
                VT
              </div>
              <div>
                <h3 className="font-editorial font-bold text-base text-[#1a1c1e] dark:text-white">{activeInfoGarment.title}</h3>
                <span className="font-mono text-xs text-[#5e656d] dark:text-[#94a3b8]">
                  {BLANK_SPECS[activeInfoGarment.id]?.gsm || '300 GSM'} · {activeInfoGarment.category}
                </span>
              </div>
            </div>

            <div className="w-full aspect-[16/10] bg-[#f6f6f3] dark:bg-[#141619] rounded-xl flex items-center justify-center p-4 mb-4 border border-[#e3e4df] dark:border-white/10">
              <img
                src={getAssetUrl(`/garments/${activeInfoGarment.id}.png`)}
                alt={activeInfoGarment.title}
                className="max-h-full object-contain filter drop-shadow-xl"
              />
            </div>

            <p className="text-xs text-[#5e656d] dark:text-[#94a3b8] mb-4 leading-relaxed font-sans">
              {activeInfoGarment.description}
            </p>

            <div className="space-y-1.5 mb-6">
              {activeInfoGarment.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#1a1c1e] dark:text-[#f3f4f6]">
                  <Check className="size-3.5 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const id = activeInfoGarment.id;
                  setActiveInfoGarment(null);
                  onSelectGarment(id);
                }}
                className="flex-1 bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e] font-semibold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Customize in 3D Studio</span>
                <ArrowRight className="size-3.5" />
              </button>
              <button
                onClick={() => setActiveInfoGarment(null)}
                className="px-4 py-2.5 rounded-xl border border-[#e3e4df] dark:border-white/10 text-xs font-semibold text-[#5e656d] dark:text-[#94a3b8] hover:text-[#1a1c1e] dark:hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
