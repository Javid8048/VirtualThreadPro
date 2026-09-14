import React, { useState } from 'react';
import { Info, Sparkles, Layers, Box, Check, ArrowRight, ExternalLink, ShieldCheck, Shirt } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';
import { getAssetUrl } from '../utils/assets';

// Separate garments into Version 1 and Version 2 as shown in the screenshot
const VERSION_1_IDS = [
  'oversized_tee',
  'hanging_tee',
  'cropped_tee',
  'sweatshirt',
  'regular_tee',
  'hoodie'
];

const VERSION_2_IDS = [
  'zip_hoodie',
  'polo',
  'hanging_hoodie',
  'sweatpants',
  'cap'
];

export function LandingPage({
  onSelectGarment,
  onOpenPricing,
  onOpenCatalog
}) {
  const [selectedVersion, setSelectedVersion] = useState('v1'); // 'v1' | 'v2' | 'all'
  const [activeInfoGarment, setActiveInfoGarment] = useState(null);

  const displayedGarments = (() => {
    if (selectedVersion === 'all') {
      return GARMENT_PRODUCTS;
    }
    const targetIds = selectedVersion === 'v1' ? VERSION_1_IDS : VERSION_2_IDS;
    return targetIds.map(id => GARMENT_PRODUCTS.find(p => p.id === id)).filter(Boolean);
  })();

  return (
    <div className="min-h-screen w-full bg-[#0c0f17] text-white relative overflow-x-hidden font-sans select-none flex flex-col justify-between">
      
      {/* Background Ambience: Subtle Radial Glows & SVG Polygon Mesh Lines */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Radial ambient highlights */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_75%_-15%,rgba(66,88,216,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_85%,rgba(66,88,216,0.12),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        {/* Geometric Wireframe Polygon Mesh from VirtualThreads.io */}
        <svg
          className="absolute inset-0 h-full w-full opacity-35"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <g stroke="rgba(80, 115, 230, 0.28)" strokeWidth="1.1" strokeLinejoin="round">
            <polygon points="120,80 480,240 180,480" fill="rgba(66, 88, 216, 0.03)" />
            <polygon points="480,240 820,120 740,420" fill="rgba(255, 255, 255, 0.015)" />
            <polygon points="820,120 1280,180 1020,520" fill="rgba(66, 88, 216, 0.025)" />
            <polygon points="180,480 740,420 520,780" fill="rgba(66, 88, 216, 0.02)" />
            <polygon points="740,420 1020,520 860,820" fill="rgba(255, 255, 255, 0.01)" />
            <polygon points="1020,520 1380,580 1220,860" fill="rgba(66, 88, 216, 0.03)" />
          </g>
          <g stroke="rgba(255, 255, 255, 0.07)" strokeWidth="0.8">
            <line x1="0" y1="180" x2="1440" y2="460" />
            <line x1="1440" y1="120" x2="0" y2="720" />
            <line x1="320" y1="0" x2="980" y2="900" />
          </g>
        </svg>
      </div>

      {/* Top Floating White Navigation Pill Bar */}
      <header className="relative z-20 w-full max-w-5xl mx-auto pt-6 px-4">
        <nav className="bg-white text-gray-900 rounded-full shadow-2xl px-6 py-2.5 flex items-center justify-between border border-gray-100">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedVersion('v1')}>
            {/* Authentic VirtualThreads Shield Icon */}
            <div className="size-8 bg-black rounded-lg flex items-center justify-center text-white shadow-md">
              <svg viewBox="0 0 24 24" className="size-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h4.5l3.5 8.5L15.5 4H20l-6.5 15.5h-3L4 4z" />
              </svg>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-gray-950">VirtualThreads</span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-gray-600">
            <button
              onClick={() => onSelectGarment('oversized_tee')}
              className="hover:text-black transition-colors"
            >
              Free 2D Mockups
            </button>
            <button
              onClick={() => onSelectGarment('oversized_tee')}
              className="hover:text-black transition-colors"
            >
              3D Mockups
            </button>
            <button
              onClick={onOpenCatalog}
              className="hover:text-black transition-colors"
            >
              Pricing
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCatalog}
              className="text-xs font-bold text-gray-700 hover:text-black px-3 py-1.5 transition-colors hidden sm:block"
            >
              Member Login
            </button>
            <button
              onClick={() => onSelectGarment('oversized_tee')}
              className="bg-[#4258d8] hover:bg-[#3446b8] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md transition-all active:scale-95"
            >
              Upgrade
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Area: Version Switcher + Product Grid Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center w-full">
        
        {/* Version Switcher Pill (Version 1 | Version 2) */}
        <div className="mb-8 flex items-center justify-center">
          <div className="inline-flex rounded-xl border border-white/15 bg-black/40 p-1 shadow-inner backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSelectedVersion('v1')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedVersion === 'v1'
                  ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Version 1
            </button>
            <button
              type="button"
              onClick={() => setSelectedVersion('v2')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedVersion === 'v2'
                  ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Version 2
            </button>
          </div>
        </div>

        {/* Main Product Grid Container (Translucent Rounded Box with Outer Border) */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7 md:p-8 backdrop-blur-md shadow-2xl ring-1 ring-white/5 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-7">
            {displayedGarments.map((product) => {
              const isFree = product.id === 'oversized_tee';
              return (
                <div
                  key={product.id}
                  data-garment-id={product.id}
                  onClick={() => onSelectGarment(product.id)}
                  className="relative flex flex-col rounded-2xl bg-white border border-white/15 shadow-xl overflow-hidden cursor-pointer group hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 active:scale-[0.98]"
                >
                  {/* Upper Garment Image Area with Subtle Mesh Gradient */}
                  <div className="relative aspect-square w-full bg-gradient-to-b from-[#f2f4f8] via-[#ebedf2] to-[#dfe3ea] overflow-hidden flex items-center justify-center p-5">
                    
                    {/* Subtle Geometric Background Mesh */}
                    <svg
                      className="absolute inset-0 h-full w-full opacity-20 pointer-events-none"
                      viewBox="0 0 200 200"
                      preserveAspectRatio="xMidYMid slice"
                    >
                      <g stroke="#3b52d9" strokeWidth="0.5" fill="none">
                        <polygon points="0,20 60,60 20,120" />
                        <polygon points="60,60 140,40 120,120" />
                        <polygon points="140,40 200,80 180,160" />
                        <polygon points="20,120 120,120 80,190" />
                        <polygon points="120,120 180,160 140,200" />
                      </g>
                    </svg>

                    {/* FREE Badge for Default Blank */}
                    {isFree && (
                      <div className="absolute top-3 left-3 z-10 bg-black text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                        FREE
                      </div>
                    )}

                    {/* Product Mockup Image */}
                    <img
                      src={getAssetUrl(`/garments/${product.id}.png`)}
                      alt={product.title}
                      className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      loading="eager"
                      decoding="sync"
                    />

                    {/* Hover Prompt */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-black/80 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-all">
                        Customize Studio →
                      </span>
                    </div>
                  </div>

                  {/* Bottom Footer Label with Info Icon */}
                  <div className="bg-white px-4 py-3 border-t border-gray-100 flex items-center justify-between text-gray-800">
                    <span className="font-bold text-[10.5px] uppercase tracking-wider truncate pr-2 text-gray-700 group-hover:text-black transition-colors">
                      {product.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveInfoGarment(product);
                      }}
                      className="text-gray-400 hover:text-black transition-colors p-1 rounded-full hover:bg-gray-100"
                      title="View Blank Specifications"
                    >
                      <Info className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Centered Bottom "View All Products" Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                if (selectedVersion === 'all') {
                  setSelectedVersion('v1');
                } else {
                  setSelectedVersion('all');
                }
              }}
              className="bg-[#151924] hover:bg-[#1f2433] text-white text-xs font-bold py-2.5 px-6 rounded-xl border border-white/20 shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span>{selectedVersion === 'all' ? 'Show Version 1' : 'View All Products'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="relative z-10 py-6 text-center text-xs text-gray-500">
        <p>VirtualThreads 3D Apparel Mockup Studio • 120,000+ brands designing in 3D</p>
      </footer>

      {/* Info Modal for Garment Blank Specs */}
      {activeInfoGarment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white text-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setActiveInfoGarment(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Shirt className="size-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-950">{activeInfoGarment.title}</h3>
                <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                  {activeInfoGarment.category}
                </span>
              </div>
            </div>

            <div className="w-full aspect-video bg-gray-50 rounded-2xl flex items-center justify-center p-3 mb-4 border border-gray-100">
              <img
                src={getAssetUrl(`/garments/${activeInfoGarment.id}.png`)}
                alt={activeInfoGarment.title}
                className="max-h-full object-contain"
              />
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              {activeInfoGarment.description}
            </p>

            <div className="space-y-1.5 mb-6">
              {activeInfoGarment.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                  <Check className="size-3.5 text-emerald-600 shrink-0" />
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
                className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Customize in Studio</span>
                <ArrowRight className="size-3.5" />
              </button>
              <button
                onClick={() => setActiveInfoGarment(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100"
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
