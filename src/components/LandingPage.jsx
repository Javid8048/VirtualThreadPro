import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, Search, X, Sun, Moon, Sparkles, Shirt, Layers, 
  Play, Video, Check, ChevronDown, ChevronUp, Film, Camera, Move, Compass
} from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

// Garment categories definition
const CATEGORIES = [
  { id: 'all', label: 'All Blanks', count: 9 },
  { id: 'tshirts', label: 'T-Shirts', count: 3, ids: ['regular_tee', 'oversized_tee', 'cropped_tee'] },
  { id: 'outerwear', label: 'Hoodies & Outerwear', count: 2, ids: ['hoodie', 'zip_hoodie'] },
  { id: 'sweatshirts', label: 'Sweatshirts', count: 1, ids: ['sweatshirt'] },
  { id: 'polo', label: 'Polo Shirts', count: 1, ids: ['polo'] },
  { id: 'bottoms', label: 'Bottoms', count: 1, ids: ['sweatpants'] },
  { id: 'headwear', label: 'Headwear', count: 1, ids: ['cap'] },
];

// Curated blank specifications
const BLANK_SPECS = {
  regular_tee: { gsm: '220 GSM', subtitle: 'Ringspun Cotton · Classic Normal Fit' },
  oversized_tee: { gsm: '280 GSM', subtitle: 'Heavyweight Combed Cotton · Drop-Shoulder' },
  hoodie: { gsm: '420 GSM', subtitle: 'Heavyweight Fleece · Double-Layer Hood' },
  sweatshirt: { gsm: '380 GSM', subtitle: 'French Terry Cotton · Ribbed Crewneck' },
  cropped_tee: { gsm: '240 GSM', subtitle: 'Organic Cotton · Boxy Streetwear Cut' },
  zip_hoodie: { gsm: '400 GSM', subtitle: 'Brushed Fleece · Front Metal Runner' },
  polo: { gsm: '220 GSM', subtitle: 'Honeycomb Piqué Cotton · Tailored Athletic Fit' },
  sweatpants: { gsm: '380 GSM', subtitle: 'Heavyweight Fleece · Drawstrings & Ribbed Cuffs' },
  cap: { gsm: '280 GSM', subtitle: 'Structured Cotton Twill · 6-Panel Curved Brim' }
};

// Studio Capabilities (Feature breakdown matching clone prompt)
const CAPABILITIES = [
  {
    icon: Move,
    title: '2D-to-3D Artwork Projection',
    desc: 'Drag, scale, and rotate high-resolution PNG/SVG logos across chest, back, and sleeves with instant UV projection.'
  },
  {
    icon: Sparkles,
    title: 'Tactile Fabric Shaders & 3D Puff Print',
    desc: 'Photorealistic cotton normal maps, acid wash vintage fades, and 3D raised rubber puff print extrusion relief.'
  },
  {
    icon: Play,
    title: 'Dynamic Motion Cycles',
    desc: 'Inspect mockups in 360° turntable spin, runway walking stride, aerodynamic wind waves, and thread-by-thread knitting growth.'
  },
  {
    icon: Video,
    title: 'Instant 60 FPS Video & 4K Export',
    desc: 'Render client-side hardware-accelerated MP4/WebM video loops and 4K print-ready snapshots with zero server wait.'
  }
];

// Studio Plans (Compliant Tiers)
const PRICING_TIERS = [
  {
    name: 'Starter Blank',
    price: '$0',
    frequency: 'Instant Access',
    desc: 'Launch the interactive 3D studio and customize all blanks immediately with no sign-up wall.',
    features: [
      'Access to all 7 streetwear 3D blanks',
      'Front & back artwork positioning',
      'Real-time color customization',
      '360° turntable & walk animations',
      'Standard resolution exports'
    ],
    buttonText: 'Try Starter Studio',
    garmentId: 'regular_tee',
    featured: false
  },
  {
    name: 'Creator Studio',
    price: '$19',
    frequency: 'per month',
    desc: 'Designed for independent streetwear designers and brands exporting high-resolution apparel campaigns.',
    features: [
      'Ultra-crisp 4K snapshot exports (PNG/JPG)',
      'Smooth 60 FPS video loops (MP4 & WebM)',
      'Attribution watermark removed',
      '3D Puff Print & Acid Wash visual effects',
      'Commercial apparel presentation license'
    ],
    buttonText: 'Launch Creator Studio',
    garmentId: 'hoodie',
    featured: true
  },
  {
    name: 'Brand & Agency',
    price: '$99',
    frequency: 'per year',
    desc: 'Full studio toolset for clothing manufacturers, production agencies, and global apparel teams.',
    features: [
      'Everything in Creator Studio included',
      'Unlimited 4K and 60 FPS video exports',
      '3D glTF model downloads with Draco compression',
      'All studio lighting presets & motion cycles',
      'Priority client presentation rendering'
    ],
    buttonText: 'Enter Agency Studio',
    garmentId: 'sweatshirt',
    featured: false
  }
];

// FAQ Accordion Data
const FAQS = [
  {
    q: 'Do I need to sign up or create an account to start designing?',
    a: 'No sign-up or credit card required. You can launch any blank immediately, upload your graphics, adjust colors, and inspect in real-time 3D.'
  },
  {
    q: 'Can I export mockups in 60 FPS video and 4K resolution?',
    a: 'Yes! The in-browser export engine renders 60 FPS video loops in 9:16 vertical, 1:1 square, and 16:9 widescreen formats, as well as 4K print snapshots.'
  },
  {
    q: 'What artwork formats are supported?',
    a: 'You can upload transparent PNG, JPG, and SVG graphics. Decals support independent scaling, rotation, opacity, and 3D puff print tactile extrusion.'
  },
  {
    q: 'Can I use the exported mockups for commercial client presentations?',
    a: 'Yes, all mockups exported from the studio are approved for brand lookbooks, tech packs, e-commerce listings, and client pitch decks.'
  }
];

export function LandingPage({
  onSelectGarment,
  onResumeStudio,
  hasActiveSession = false,
  currentGarmentType = 'regular_tee',
  theme = 'dark',
  onToggleTheme
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

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

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

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

            {/* Studio Action Button */}
            {hasActiveSession && onResumeStudio ? (
              <button
                onClick={onResumeStudio}
                className="h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 active:scale-95 transition-all"
                title="Resume your active studio customizations"
              >
                <Sparkles className="size-3.5" />
                <span>Resume Studio</span>
                <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onSelectGarment('regular_tee')}
                className="h-9 px-4 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <span>Launch Studio</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        
        {/* Editorial Hero Section without duplicate heavy WebGL Canvas */}
        <section className="pt-8 sm:pt-12 pb-10 border-b border-gray-200 dark:border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headlines, Value Props & Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-semibold mb-4 border border-brand-500/20 w-fit">
                <Sparkles className="size-3.5" />
                <span>Real-Time 3D Apparel Engine • WebGL 2.0</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-gray-950 dark:text-white mb-4 leading-[1.12]">
                Convert 2D Designs into 3D Apparel Mockups
              </h1>
              
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 font-normal leading-relaxed mb-6 max-w-xl">
                Pick a streetwear blank, position your artwork in real-time 3D with tactile puff print and embroidery finishes, and export silky-smooth 60 FPS video loops and 4K renders in seconds.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                {hasActiveSession && onResumeStudio ? (
                  <button
                    onClick={onResumeStudio}
                    className="h-11 px-7 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
                  >
                    <Sparkles className="size-4" />
                    <span>Resume Active Studio</span>
                    <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectGarment('regular_tee')}
                    className="h-11 px-6 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-bold text-sm flex items-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span>Launch 3D Studio</span>
                    <ArrowRight className="size-4" />
                  </button>
                )}

                <a
                  href="#studio-blanks-grid"
                  className="h-11 px-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-200 font-semibold text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <span>Explore 9 Blanks</span>
                </a>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-white/10 text-xs">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold">9 Streetwear Blanks</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <div className="size-2 rounded-full bg-brand-500 shrink-0" />
                  <span className="font-semibold">60 FPS WebGL Video</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <div className="size-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="font-semibold">Puff &amp; Embroidery</span>
                </div>
              </div>
            </div>

            {/* Right Column: Studio Showcase Card (0ms Instant Load, Eliminates Demo WebGL Screen) */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="w-full max-w-md rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white/95 dark:bg-[#15181e]/95 backdrop-blur-xl p-6 shadow-2xl transition-all">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      3D Studio Engine
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    WebGL 2.0 PBR
                  </span>
                </div>

                {/* Quick Blank Silhouettes Grid */}
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5">
                  Instant Launch Blanks:
                </div>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { id: 'regular_tee', label: 'Classic Tee', gsm: '220 GSM' },
                    { id: 'oversized_tee', label: 'Oversized', gsm: '280 GSM' },
                    { id: 'hoodie', label: 'Hoodie', gsm: '420 GSM' },
                    { id: 'sweatshirt', label: 'Sweatshirt', gsm: '380 GSM' },
                    { id: 'sweatpants', label: 'Joggers', gsm: '380 GSM' },
                    { id: 'cap', label: '6-Panel Cap', gsm: '280 GSM' },
                  ].map((blank) => (
                    <button
                      key={blank.id}
                      onClick={() => onSelectGarment(blank.id)}
                      className="p-2.5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.03] hover:border-brand-500/50 hover:bg-brand-500/5 transition-all text-left group"
                    >
                      <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                        {blank.label}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {blank.gsm}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Key Studio Features list */}
                <div className="space-y-2 mb-5 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Real-time front &amp; back 2D-to-3D UV artwork mapping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-brand-500 shrink-0" />
                    <span>360° turntable spin &amp; catwalk runway animations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-purple-500 shrink-0" />
                    <span>Hardware-accelerated 60 FPS video &amp; 4K snapshots</span>
                  </div>
                </div>

                {/* Launch / Resume Button */}
                {hasActiveSession && onResumeStudio ? (
                  <button
                    onClick={onResumeStudio}
                    className="w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md"
                  >
                    <Sparkles className="size-4" />
                    <span>Resume 3D Studio Session</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectGarment(currentGarmentType || 'regular_tee')}
                    className="w-full h-11 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all shadow-md"
                  >
                    <Shirt className="size-4" />
                    <span>Open Customizer Studio</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Curated Studio Blanks Gallery */}
        <section id="studio-blanks-grid" className="pt-10 pb-16">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                Curated Streetwear Blanks
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select any garment to customize colors, place graphics, and inspect with dynamic motion.
              </p>
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blanks..."
                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors"
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

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 scrollbar-none">
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

        {/* Studio Capabilities Section (Commented out per user request) */}
        {/*
        <section className="py-14 border-t border-gray-200 dark:border-white/10">
          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">
              Studio Capabilities
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Built for streetwear creators, apparel brands, and merchandise designers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAPABILITIES.map((item, i) => {
              const Icon = item.icon;
              return (
                <div 
                  key={i}
                  className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 flex flex-col gap-3"
                >
                  <div className="size-10 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white flex items-center justify-center shrink-0">
                    <Icon className="size-5 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        */}

        {/* Studio Plans & Membership Tiers (Commented out per user request) */}
        {/*
        <section className="py-14 border-t border-gray-200 dark:border-white/10">
          <div className="mb-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">
              Transparent Studio Access
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Start immediately with full access to all 7 streetwear blanks.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier, idx) => {
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                    tier.featured
                      ? 'border-brand-500 dark:border-brand-500 bg-white dark:bg-[#151820] shadow-xl ring-2 ring-brand-500/20'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-black text-gray-950 dark:text-white">
                        {tier.name}
                      </h3>
                      {tier.featured && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white tracking-wide uppercase">
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-black text-gray-950 dark:text-white">
                        {tier.price}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        / {tier.frequency}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                      {tier.desc}
                    </p>

                    <div className="space-y-2.5 mb-8 border-t border-gray-100 dark:border-white/10 pt-4">
                      {tier.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                          <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectGarment(tier.garmentId)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      tier.featured
                        ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/25'
                        : 'bg-gray-950 dark:bg-white text-white dark:text-gray-950 hover:opacity-90'
                    }`}
                  >
                    <span>{tier.buttonText}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        */}

        {/* Interactive FAQ Accordion */}
        <section className="py-14 border-t border-gray-200 dark:border-white/10 max-w-3xl mx-auto w-full">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Everything you need to know about the 3D apparel studio.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-gray-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="size-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-3 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0e1013] py-6 text-xs text-gray-500 dark:text-gray-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="size-5 rounded bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-[10px] font-bold flex items-center justify-center">
              VT
            </span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">VirtualThreads Studio</span>
            <span>—</span>
            <span>Real-Time 3D Apparel Configurator</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>WebGL 2.0 Engine Active</span>
            </span>
            <span>·</span>
            <span>60 FPS Hardware Render</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
