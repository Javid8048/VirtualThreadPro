import React, { useState, useMemo } from 'react';
import { 
  Info, Sparkles, Layers, Box, Check, ArrowRight, 
  ExternalLink, ShieldCheck, Shirt, Search, Play, 
  Sliders, Compass, Video, Eye, X
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

// Blank fabric weight and spec dictionary
const BLANK_SPECS = {
  oversized_tee: { gsm: '280 GSM', fit: 'Oversized Drop-Shoulder', material: '100% Combed Cotton', anim: 'Walk, Run & 360° Spin' },
  hoodie: { gsm: '420 GSM', fit: 'Double-Layer Draped Hood', material: 'Heavyweight Fleece', anim: 'Walk, Wind & Kangaroo Pocket' },
  sweatshirt: { gsm: '380 GSM', fit: 'Ribbed Crewneck', material: 'French Terry Cotton', anim: 'Torso & Back Decals' },
  cropped_tee: { gsm: '240 GSM', fit: 'Boxy Cropped Silhouette', material: '100% Organic Cotton', anim: 'Walk & Side Look' },
  regular_tee: { gsm: '220 GSM', fit: 'Classic Tailored Fit', material: 'Ringspun Cotton', anim: 'Dual-Zone Placement' },
  zip_hoodie: { gsm: '400 GSM', fit: 'Full-Zip Metal Runner', material: 'Brushed Heavyweight Fleece', anim: 'Split Pocket & Back Graphic' },
  polo: { gsm: '260 GSM', fit: 'Ribbed Collar & 2-Button Placket', material: 'Pique Knit Cotton', anim: 'Chest Embroidery Zone' },
  hanging_tee: { gsm: '240 GSM', fit: 'Studio Wooden Hanger Rig', material: 'Natural Gravity Drape', anim: 'Gentle Breeze & Sway' },
  hanging_hoodie: { gsm: '420 GSM', fit: 'Suspended Hanger Display', material: 'Heavyweight Fleece Drape', anim: 'Relaxed Silhouette' },
  sweatpants: { gsm: '360 GSM', fit: 'Elastic Ankle Cuffs', material: 'Cotton Fleece Blend', anim: 'Side Thigh & Hip Zones' },
  cap: { gsm: '320 GSM', fit: '6-Panel Curved Visor', material: '100% Cotton Twill', anim: 'Front Crown Embroidery' }
};

export function LandingPage({
  onSelectGarment,
  onOpenPricing,
  onOpenCatalog
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
          (spec.material && spec.material.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[#090b10] text-gray-100 font-sans selection:bg-brand-500 selection:text-white flex flex-col justify-between">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[400px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-60" />
      </div>

      {/* Modern Studio Glassmorphic Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090b10]/85 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="size-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h4.5l3.5 8.5L15.5 4H20l-6.5 15.5h-3L4 4z" />
              </svg>
            </div>
            <div>
              <div className="font-display font-black text-lg tracking-tight text-white flex items-center gap-2">
                <span>VirtualThreads</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  3D Studio
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium hidden sm:block">Interactive 3D Apparel Mockups</p>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
            <button 
              onClick={() => {
                const catalogEl = document.getElementById('garments-section');
                catalogEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors"
            >
              Blank Garments
            </button>
            <button 
              onClick={() => onSelectGarment('oversized_tee')}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Position Guide</span>
            </button>
            <button 
              onClick={() => onSelectGarment('oversized_tee')}
              className="hover:text-white transition-colors"
            >
              3D Animations
            </button>
            <button 
              onClick={onOpenCatalog}
              className="hover:text-white transition-colors"
            >
              Specifications
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectGarment('oversized_tee')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <span>Launch Studio</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 sm:pt-16 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Accent Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-gray-300 mb-6 backdrop-blur-md">
          <span className="size-2 rounded-full bg-brand-accent animate-pulse" />
          <span>Real-Time 3D Apparel Mockups with Walking Physics</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Next-Generation 3D Apparel Mockup & Animation Studio
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed mb-10">
          Select from 11 photorealistic streetwear blanks, map custom graphics with the 2D Position Guide, apply 3D puff print textures, and render smooth 60fps walking animations.
        </p>

        {/* Studio Highlights Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl mb-12">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col items-center justify-center">
            <span className="font-display font-black text-xl text-white">11</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Studio Blanks</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col items-center justify-center">
            <span className="font-display font-black text-xl text-brand-400">4K WebGL</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Realtime Engine</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col items-center justify-center">
            <span className="font-display font-black text-xl text-purple-400">3D Physics</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Walk & Gravity Sway</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col items-center justify-center">
            <span className="font-display font-black text-xl text-emerald-400">1:1 Decals</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Position Guide</span>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div id="garments-section" className="w-full max-w-5xl bg-[#121622]/90 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
          
          {/* Top Row: Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blank garments by style, fabric weight, or fit (e.g., French Terry, Hoodie, Oversized)..."
              className="w-full bg-[#0d1017] border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Bottom Row: Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 ring-1 ring-white/20'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isActive ? 'bg-black/25 text-white' : 'bg-white/10 text-gray-400'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Garments Grid Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        
        {/* Results Count */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span>Displaying {filteredGarments.length} {filteredGarments.length === 1 ? 'Garment Blank' : 'Garment Blanks'}</span>
            {searchQuery && (
              <span className="text-brand-400 font-normal">matching "{searchQuery}"</span>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredGarments.length === 0 && (
          <div className="w-full py-16 text-center rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center">
            <Shirt className="size-12 text-gray-500 mb-3" />
            <p className="text-base font-bold text-gray-300 mb-1">No blanks match your criteria</p>
            <p className="text-xs text-gray-500 mb-4">Try clearing the search query or selecting "All Blanks".</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Garment Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-7">
          {filteredGarments.map((product) => {
            const spec = BLANK_SPECS[product.id] || {};
            return (
              <div
                key={product.id}
                data-garment-id={product.id}
                onClick={() => onSelectGarment(product.id)}
                className="group relative flex flex-col rounded-3xl bg-[#121622] border border-white/10 hover:border-brand-500/50 shadow-xl hover:shadow-2xl hover:shadow-brand-500/10 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Upper Image Card */}
                <div className="relative aspect-[4/3] w-full bg-gradient-to-b from-[#181d2a] to-[#121622] flex items-center justify-center p-6 overflow-hidden">
                  
                  {/* Subtle Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(66,88,216,0.12),transparent_70%)] group-hover:opacity-100 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 text-white border border-white/10 backdrop-blur-md">
                      {product.category}
                    </span>
                    {spec.gsm && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 backdrop-blur-md">
                        {spec.gsm}
                      </span>
                    )}
                  </div>

                  {/* Garment Mockup Image */}
                  <img
                    src={getAssetUrl(`/garments/${product.id}.png`)}
                    alt={product.title}
                    className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 pointer-events-none z-0"
                    loading="eager"
                    decoding="sync"
                  />

                  {/* Floating Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center z-10">
                    <span className="bg-brand-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all">
                      <span>Open in 3D Studio</span>
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-5 flex flex-col flex-1 justify-between bg-[#10131d] border-t border-white/5">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-display font-black text-sm tracking-tight text-white group-hover:text-brand-400 transition-colors uppercase">
                        {product.title}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveInfoGarment(product);
                        }}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                        title="View Blank Specifications"
                      >
                        <Info className="size-4" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                      {product.description}
                    </p>
                  </div>

                  {/* Fit & Animation Tags */}
                  <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-300">
                      <span className="text-gray-500 font-medium">Silhouette:</span>
                      <span className="font-semibold text-gray-200">{spec.fit || 'Tailored'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-300">
                      <span className="text-gray-500 font-medium">Animation:</span>
                      <span className="font-semibold text-brand-300">{spec.anim || 'Walk & 360°'}</span>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => onSelectGarment(product.id)}
                      className="mt-3 w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-brand-500 text-gray-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-white/10 hover:border-brand-500 active:scale-[0.98]"
                    >
                      <span>Launch 3D Customizer</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Pillars: Real-Time 3D Capabilities */}
      <section className="relative z-10 border-t border-white/10 bg-[#07090d] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400">
              Studio Architecture
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-2 mb-3">
              Built for Streetwear Designers & Apparel Brands
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Complete creative control from flat 2D pattern guides to photorealistic 3D garment animations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#0f121a] border border-white/10 flex flex-col gap-3">
              <div className="size-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Play className="size-5" />
              </div>
              <h3 className="font-display font-black text-sm text-white">Real-Time Walking Physics</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Realistic cloth dynamics with walking strides, running motions, side looks, and natural gravity fabric wrinkles.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0f121a] border border-white/10 flex flex-col gap-3">
              <div className="size-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Compass className="size-5" />
              </div>
              <h3 className="font-display font-black text-sm text-white">2D Position Guide</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Precision flat garment schematic with collar rib, front chest, back torso, and sleeve placement mapped 1:1 to 3D.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0f121a] border border-white/10 flex flex-col gap-3">
              <div className="size-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="size-5" />
              </div>
              <h3 className="font-display font-black text-sm text-white">Puff Print & Embroidery</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tactile 3D normal-map extrusion for elevated puff prints, screen prints, acid wash, and fine embroidery relief.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0f121a] border border-white/10 flex flex-col gap-3">
              <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Video className="size-5" />
              </div>
              <h3 className="font-display font-black text-sm text-white">4K Video & 3D glTF Export</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Capture 60fps rotating video loops, high-resolution 4K transparent PNGs, and download standard glTF/GLB models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#050609] py-10 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-lg bg-brand-500 flex items-center justify-center text-white text-[10px] font-bold">
              VT
            </div>
            <span className="font-display font-bold text-gray-400">VirtualThreads 3D Mockup Studio</span>
          </div>
          <p className="text-center sm:text-right text-gray-500">
            Professional 3D apparel customization for modern streetwear brands.
          </p>
        </div>
      </footer>

      {/* Blank Specifications Info Modal */}
      {activeInfoGarment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#121622] text-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-white/10">
            <button
              onClick={() => setActiveInfoGarment(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                <Shirt className="size-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-white">{activeInfoGarment.title}</h3>
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                  {activeInfoGarment.category}
                </span>
              </div>
            </div>

            <div className="w-full aspect-video bg-[#0d1017] rounded-2xl flex items-center justify-center p-4 mb-4 border border-white/10">
              <img
                src={getAssetUrl(`/garments/${activeInfoGarment.id}.png`)}
                alt={activeInfoGarment.title}
                className="max-h-full object-contain filter drop-shadow-xl"
              />
            </div>

            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              {activeInfoGarment.description}
            </p>

            <div className="space-y-2 mb-6">
              {activeInfoGarment.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-200 font-medium">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
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
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-brand-500/25 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Customize in Studio</span>
                <ArrowRight className="size-3.5" />
              </button>
              <button
                onClick={() => setActiveInfoGarment(null)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5"
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
