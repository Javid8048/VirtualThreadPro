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
const STUDIO_GUIDES = [
  {
    title: '2D Decal Position Guide — 1:1 UV Texture Mapping on Curved 3D Surfaces',
    category: 'Interface',
    tag: 'Position Guide',
    date: 'Studio Spec 2.4',
    readTime: '3 min guide'
  },
  {
    title: 'Tactile 3D Normal Mapping — Elevated Puff Print, Screen Print & Embroidery Height Maps',
    category: 'Materials',
    tag: 'Puff Print',
    date: 'Studio Spec 2.3',
    readTime: '4 min guide'
  },
  {
    title: 'Deterministic 60 FPS Export — Continuous Turntable Loop Recording with Zero Frame Lag',
    category: 'Export Studio',
    tag: '60 FPS Video',
    date: 'Studio Spec 2.2',
    readTime: '2 min guide'
  },
  {
    title: 'Real-Time Walking & Cloth Dynamics — Dual Skeletal Deformers on Draped Streetwear',
    category: 'Physics',
    tag: 'Cloth Dynamics',
    date: 'Studio Spec 2.1',
    readTime: '5 min guide'
  }
];

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
            {CATEGORIES.slice(0, 4).map((cat) => {
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
            <button
              onClick={() => {
                const el = document.getElementById('studio-guides');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1 rounded-full text-xs font-medium text-[#5e656d] dark:text-[#94a3b8] hover:text-[#1a1c1e] dark:hover:text-white transition-all"
            >
              Guides
            </button>
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
        
        {/* 2. Hero Spotlight ("Blank of the Day" / Featured Showcase) */}
        <section className="pt-10 sm:pt-14 pb-14 border-b border-[#e3e4df] dark:border-white/10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-8">
            
            {/* Top Monospace Meta / Rating Pill (BWG SOTD style) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-white/5 text-xs font-mono text-[#5e656d] dark:text-[#94a3b8] mb-4 shadow-sm">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[#1a1c1e] dark:text-[#f3f4f6]">Blank of the Day</span>
              <span>·</span>
              <span className="font-bold text-[#1a1c1e] dark:text-[#fff09f]">Score: 9.92</span>
              <span>·</span>
              <span>420 GSM French Terry</span>
            </div>

            {/* Grand Editorial Serif Title */}
            <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#1a1c1e] dark:text-white mb-4 leading-[1.08]">
              The Heavyweight Boxy Hoodie
            </h1>

            {/* Curated Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-[#5e656d] dark:text-[#94a3b8] max-w-2xl leading-relaxed mb-6 font-normal">
              Double-layer draped hood, 420 GSM combed organic fleece, and real-time walking physics calibrated for precision 1:1 decal placement.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectGarment('hoodie')}
                className="h-10 px-5 rounded-xl bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e] font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                <span>Customize in 3D Studio</span>
                <ArrowRight className="size-4" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('studio-blanks-grid');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-10 px-4 rounded-xl border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-white/5 hover:bg-[#edece8] dark:hover:bg-white/10 text-[#1a1c1e] dark:text-white font-medium text-xs sm:text-sm transition-all"
              >
                View All 11 Blanks
              </button>
            </div>
          </div>

          {/* Realistic Desktop Browser Frame Mockup (BWG Hero Feature) */}
          <div className="relative w-full max-w-5xl mx-auto rounded-2xl border border-[#e3e4df] dark:border-white/15 bg-white dark:bg-[#181b20] shadow-xl overflow-hidden group">
            
            {/* Browser Top Window Chrome Bar */}
            <div className="h-10 px-4 bg-[#f0f0ed] dark:bg-[#141619] border-b border-[#e3e4df] dark:border-white/10 flex items-center justify-between select-none">
              
              {/* Traffic Light Window Control Dots */}
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 inline-block" />
                <span className="size-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 inline-block" />
                <span className="size-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 inline-block" />
              </div>

              {/* Centered URL Address Bar */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-[#1d2127] border border-[#e3e4df] dark:border-white/10 text-xs text-[#5e656d] dark:text-[#94a3b8] font-mono w-72 justify-center">
                <Lock className="size-3 text-emerald-500 shrink-0" />
                <span className="truncate">virtualthreads.studio/blanks/hoodie-420gsm</span>
              </div>

              {/* Right Indicator */}
              <div className="text-[11px] font-mono uppercase font-semibold text-[#5e656d] dark:text-[#94a3b8]">
                4K WebGL
              </div>
            </div>

            {/* Embedded Garment Preview Canvas */}
            <div 
              onClick={() => onSelectGarment('hoodie')}
              className="relative aspect-[16/9] sm:aspect-[16/10] w-full bg-gradient-to-b from-[#f8f8f6] to-[#ecece8] dark:from-[#181b20] dark:to-[#121417] flex items-center justify-center p-8 sm:p-12 cursor-pointer overflow-hidden"
            >
              {/* Subtle Studio Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(66,88,216,0.1),transparent_70%)] pointer-events-none" />

              {/* Garment High-Res Visual */}
              <img
                src={getAssetUrl('/garments/hoodie.png')}
                alt="420 GSM Heavyweight Hoodie"
                className="max-h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-500 ease-out z-10"
              />

              {/* Hover Floating Action Card Overlay */}
              <div className="absolute inset-0 bg-[#1a1c1e]/40 dark:bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
                <div className="px-5 py-3 rounded-xl bg-white dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-white font-semibold text-xs sm:text-sm shadow-2xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <span>Open in 3D Customizer</span>
                  <ArrowRight className="size-4" />
                </div>
              </div>

              {/* Bottom Spec Footer Pill */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-[#5e656d] dark:text-[#94a3b8] z-10 pointer-events-none">
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-white/80 dark:bg-black/60 border border-[#e3e4df] dark:border-white/10 backdrop-blur-sm">
                  Walk &amp; 360° Turntable Rig
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/80 dark:bg-black/60 border border-[#e3e4df] dark:border-white/10 backdrop-blur-sm">
                  100% Cotton Fleece · 420 GSM
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Curated Gallery Grid ("Latest Studio Blanks" - Modeled on BWG "Latest picks") */}
        <section id="studio-blanks-grid" className="py-12 sm:py-16 border-b border-[#e3e4df] dark:border-white/10">
          
          {/* Section Header & Interactive Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#5e656d] dark:text-[#94a3b8] mb-1">
                <span>Curated Directory</span>
                <span>·</span>
                <span className="text-[#1a1c1e] dark:text-white font-bold">{filteredGarments.length} Available</span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-[#1a1c1e] dark:text-white">
                Latest Studio Blanks
              </h2>
            </div>

            {/* Search Input & Category Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#5e656d] dark:text-[#94a3b8] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter blanks (e.g. 420 GSM, Tee)..."
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

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-[#1a1c1e] dark:bg-white text-white dark:text-[#1a1c1e] font-semibold'
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

        {/* 4. Curated Resource Feed ("Studio Guides & Documentation" - Matching BWG "Latest links") */}
        <section id="studio-guides" className="py-12 sm:py-16 border-b border-[#e3e4df] dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#5e656d] dark:text-[#94a3b8]">
                Documentation &amp; Tech Notes
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1c1e] dark:text-white mt-1">
                Studio Guides &amp; Specifications
              </h2>
            </div>
            
            <button
              onClick={() => onSelectGarment('oversized_tee')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#1a1c1e] dark:text-white hover:underline"
            >
              <span>Explore in Studio</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          {/* Clean Row-Based Resource List */}
          <div className="divide-y divide-[#e3e4df] dark:divide-white/10 border-t border-b border-[#e3e4df] dark:border-white/10">
            {STUDIO_GUIDES.map((guide, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectGarment('oversized_tee')}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="font-mono text-xs text-[#5e656d] dark:text-[#94a3b8] shrink-0 w-8">
                    0{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-editorial text-base sm:text-lg font-bold text-[#1a1c1e] dark:text-white group-hover:underline">
                      {guide.title}
                    </h4>
                    <p className="text-xs text-[#5e656d] dark:text-[#94a3b8] mt-0.5">
                      {guide.category} · {guide.readTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#edece8] dark:bg-white/10 text-[#1a1c1e] dark:text-white border border-[#e3e4df] dark:border-white/10">
                    {guide.tag}
                  </span>
                  <span className="text-xs font-mono text-[#5e656d] dark:text-[#94a3b8] hidden md:inline">
                    {guide.date}
                  </span>
                  <ArrowRight className="size-4 text-[#5e656d] dark:text-[#94a3b8] group-hover:translate-x-1 group-hover:text-[#1a1c1e] dark:group-hover:text-white transition-all" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Feature Architecture Grid */}
        <section className="py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-[#181b20] flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase font-bold text-[#5e656d] dark:text-[#94a3b8]">Engine 01</span>
              <h3 className="font-editorial font-bold text-lg text-[#1a1c1e] dark:text-white">Real-Time Walking Physics</h3>
              <p className="text-xs text-[#5e656d] dark:text-[#94a3b8] leading-relaxed">
                Dual skeletal deformers simulate realistic walking strides, running motions, and natural fabric gravitational sway.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-[#181b20] flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase font-bold text-[#5e656d] dark:text-[#94a3b8]">Engine 02</span>
              <h3 className="font-editorial font-bold text-lg text-[#1a1c1e] dark:text-white">2D Position Guide</h3>
              <p className="text-xs text-[#5e656d] dark:text-[#94a3b8] leading-relaxed">
                Precision flat garment schematic with collar rib, front chest, back torso, and sleeve zones mapped 1:1 to 3D.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-[#181b20] flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase font-bold text-[#5e656d] dark:text-[#94a3b8]">Engine 03</span>
              <h3 className="font-editorial font-bold text-lg text-[#1a1c1e] dark:text-white">Tactile Puff Print Shaders</h3>
              <p className="text-xs text-[#5e656d] dark:text-[#94a3b8] leading-relaxed">
                Real-time normal-map extrusion for 3D raised puff prints, vintage acid wash, and dimensional embroidery textures.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#e3e4df] dark:border-white/10 bg-white dark:bg-[#181b20] flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase font-bold text-[#5e656d] dark:text-[#94a3b8]">Engine 04</span>
              <h3 className="font-editorial font-bold text-lg text-[#1a1c1e] dark:text-white">Deterministic 60 FPS Export</h3>
              <p className="text-xs text-[#5e656d] dark:text-[#94a3b8] leading-relaxed">
                High-definition WebM and MP4 video capture at 12 Mbps with hardware-accelerated frame blitting and zero frame jitter.
              </p>
            </div>

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
