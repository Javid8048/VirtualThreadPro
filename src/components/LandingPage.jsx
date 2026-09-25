import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, Search, X, Sun, Moon, Sparkles, Shirt
} from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

// Garment categories definition
const CATEGORIES = [
  { id: 'all', label: 'All Blanks', count: 9 },
  { id: 'tshirts', label: 'T-Shirts', count: 3, ids: ['oversized_tee', 'cropped_tee', 'regular_tee'] },
  { id: 'outerwear', label: 'Hoodies & Outerwear', count: 2, ids: ['hoodie', 'zip_hoodie'] },
  { id: 'sweatshirts', label: 'Sweatshirts', count: 1, ids: ['sweatshirt'] },
  { id: 'polo', label: 'Polo Shirts', count: 1, ids: ['polo'] },
  { id: 'bottoms', label: 'Bottoms & Caps', count: 2, ids: ['sweatpants', 'cap'] },
];

// Curated blank specifications
const BLANK_SPECS = {
  oversized_tee: { gsm: '280 GSM', subtitle: 'Heavyweight Combed Cotton · Drop-Shoulder' },
  hoodie: { gsm: '420 GSM', subtitle: 'Heavyweight Fleece · Double-Layer Hood' },
  sweatshirt: { gsm: '380 GSM', subtitle: 'French Terry Cotton · Ribbed Crewneck' },
  cropped_tee: { gsm: '240 GSM', subtitle: 'Organic Cotton · Boxy Streetwear Cut' },
  regular_tee: { gsm: '220 GSM', subtitle: 'Ringspun Cotton · Classic Tailored Fit' },
  zip_hoodie: { gsm: '400 GSM', subtitle: 'Brushed Fleece · Front Metal Runner' },
  polo: { gsm: '260 GSM', subtitle: 'Pique Knit Cotton · Turned-Down Collar' },
  sweatpants: { gsm: '360 GSM', subtitle: 'Cotton Fleece Blend · Elastic Ankle Cuffs' },
  cap: { gsm: '320 GSM', subtitle: '100% Cotton Twill · 6-Panel Curved Visor' }
};

export function LandingPage({
  onSelectGarment,
  theme = 'dark',
  onToggleTheme
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
          (spec.subtitle && spec.subtitle.toLowerCase().includes(q)) ||
          (spec.gsm && spec.gsm.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] dark:bg-[#111317] text-gray-900 dark:text-gray-100 font-sans flex flex-col justify-between transition-colors duration-200">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-white/10 bg-white/85 dark:bg-[#111317]/85 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="size-8 rounded-lg bg-gray-950 dark:bg-white text-white dark:text-gray-950 flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
              VT
            </div>
            
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight leading-none text-gray-950 dark:text-white">
                VirtualThreads
              </span>
              <span className="text-[10px] tracking-wide text-gray-500 dark:text-gray-400 mt-0.5">
                3D Apparel Studio
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="size-8 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors"
                title={theme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-600" />}
              </button>
            )}

            {/* Launch Studio Action Button */}
            <button
              onClick={() => onSelectGarment('oversized_tee')}
              className="h-9 px-4 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <span>Launch Studio</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        
        {/* Curated Studio Blanks Gallery */}
        <section id="studio-blanks-grid" className="pt-8 sm:pt-12 pb-16 sm:pb-20">
          
          {/* Clean User-Friendly Hero Section */}
          <div className="pb-6 border-b border-gray-200 dark:border-white/10 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white mb-2">
              Curated Streetwear Blanks
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-normal">
              Select a garment to customize colors, place artwork, and inspect in real-time 3D.
            </p>
          </div>

          {/* Category Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${isActive ? 'bg-white/20 dark:bg-black/20' : 'bg-gray-100 dark:bg-white/10'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Instant Search Bar */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blanks..."
                className="w-full sm:w-60 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors"
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
            <div className="w-full py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] flex flex-col items-center justify-center">
              <Shirt className="size-10 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">No blanks match "{searchQuery}"</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Try clearing your search query or selecting "All Blanks".</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-950 dark:bg-white text-white dark:text-gray-950"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* 3-Column Blank Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredGarments.map((product) => {
              const spec = BLANK_SPECS[product.id] || {};
              const cleanTitle = product.title.replace(' STUDIO', '');

              return (
                <article
                  key={product.id}
                  data-garment-id={product.id}
                  className="group flex flex-col cursor-pointer"
                  onClick={() => onSelectGarment(product.id)}
                >
                  {/* Clean Garment Preview Container */}
                  <figure className="relative aspect-[16/11] w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181b20] shadow-sm hover:shadow-md transition-all overflow-hidden flex items-center justify-center p-6">
                    
                    {/* Top-Right Fabric Weight Badge */}
                    {spec.gsm && (
                      <div className="absolute top-3.5 right-3.5 z-10">
                        <span className="px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-[#141619]/90 text-[10px] font-mono font-bold text-gray-800 dark:text-gray-200 backdrop-blur-sm shadow-xs">
                          {spec.gsm}
                        </span>
                      </div>
                    )}

                    {/* Top-Left Category Badge */}
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
                        {product.category}
                      </span>
                    </div>

                    {/* High-Resolution Mockup Image */}
                    <img
                      src={getAssetUrl(`/garments/${product.id}.png`)}
                      alt={cleanTitle}
                      className="max-h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 ease-out z-0"
                      loading="lazy"
                    />

                    {/* Hover Button */}
                    <div className="absolute inset-0 bg-gray-950/30 dark:bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
                      <span className="px-4 py-2 rounded-xl bg-white dark:bg-gray-950 text-gray-950 dark:text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transform group-hover:scale-100 scale-95 transition-transform">
                        <span>Open 3D Studio</span>
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </figure>

                  {/* Clean Card Metadata Section */}
                  <div className="pt-3 pb-1 flex flex-col gap-0.5">
                    <h3 className="text-base font-bold text-gray-950 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-left">
                      {cleanTitle}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                      {spec.subtitle || product.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Clean 1-Line Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0e1013] py-6 text-xs text-gray-500 dark:text-gray-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="size-5 rounded bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-[10px] font-bold flex items-center justify-center">
              VT
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">VirtualThreads Studio</span>
            <span>—</span>
            <span>Real-Time 3D Apparel Customizer</span>
          </div>

          <div className="text-[11px] text-gray-400 dark:text-gray-500">
            WebGL 3D Engine · 60 FPS Render
          </div>
        </div>
      </footer>

    </div>
  );
}
