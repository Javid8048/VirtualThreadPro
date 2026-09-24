import React, { useState } from 'react';
import { X, Sparkles, Check, ChevronDown, ChevronRight, ArrowRight, Play, ExternalLink, ShieldCheck } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

export const GARMENT_PRODUCTS = [
  {
    id: 'oversized_tee',
    title: 'OVERSIZED T-SHIRT STUDIO',
    badge: 'DEFAULT BLANK',
    badgeType: 'default',
    category: 'Tops',
    description: 'Heavyweight streetwear oversized drop-shoulder t-shirt with authentic cloth drape and wrinkles.',
    features: ['Walk & Wind Animations', 'Front & Back Decals', 'Puff Print & Acid Wash'],
    imageBg: 'from-blue-900/30 to-indigo-950/40',
    popular: true
  },
  {
    id: 'hoodie',
    title: 'OVERSIZED HOODIE STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Outerwear',
    description: 'Heavyweight streetwear hoodie featuring a draped double-layer 3D hood, front kangaroo pocket, and ribbed cuffs.',
    features: ['3D Draped Hood', 'Kangaroo Pocket', '4K & 60fps Video'],
    imageBg: 'from-purple-900/30 to-slate-950/40',
    popular: true
  },
  {
    id: 'sweatshirt',
    title: 'OVERSIZED SWEATSHIRT STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Sweatshirts',
    description: 'Heavyweight streetwear crewneck sweatshirt with ribbed wrist cuffs, neckband, and bottom hem.',
    features: ['Ribbed Long Sleeves', 'Torso & Back Placement', '360° Orbit'],
    imageBg: 'from-emerald-900/30 to-slate-950/40',
    popular: true
  },
  {
    id: 'cropped_tee',
    title: 'CROPPED, BOXY T-SHIRT STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Tops',
    description: 'Modern boxy fit with dropped shoulders, wider torso silhouette, and a clean cropped waistline.',
    features: ['Boxy Streetwear Cut', 'Cropped Waistband', 'Walk Animation'],
    imageBg: 'from-amber-900/30 to-slate-950/40',
    popular: false
  },
  {
    id: 'regular_tee',
    title: 'REGULAR T-SHIRT STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Tops',
    description: 'Classic fitted everyday crewneck t-shirt with standard sleeve length and tailored chest proportions.',
    features: ['Classic Everyday Fit', 'Clean Double Stitch', 'Dual-side Print'],
    imageBg: 'from-sky-900/30 to-slate-950/40',
    popular: false
  },
  {
    id: 'zip_hoodie',
    title: 'ZIP HOODIE STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Outerwear',
    description: 'Full-zip streetwear hoodie with front metallic zipper track, split kangaroo pockets, and draped hood.',
    features: ['Front Metal Zipper', 'Split Kangaroo Pocket', 'Dual-side Decals'],
    imageBg: 'from-rose-900/30 to-slate-950/40',
    popular: true
  },
  {
    id: 'polo',
    title: 'OVERSIZED POLO SHIRT STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Collared',
    description: 'Relaxed streetwear polo shirt with turned-down ribbed collar and front button placket.',
    features: ['Turned-down Collar', '2-Button Placket', 'Left Chest Pocket Decal'],
    imageBg: 'from-teal-900/30 to-slate-950/40',
    popular: false
  },
  {
    id: 'sweatpants',
    title: 'SWEATPANTS STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Bottoms',
    description: 'Heavyweight fleece sweatpants with gathered elastic cuffs, waistband, and side leg print zone.',
    features: ['Elastic Waistband', 'Gathered Ankle Cuffs', 'Leg Graphics'],
    imageBg: 'from-indigo-900/30 to-slate-950/40',
    popular: false
  },
  {
    id: 'cap',
    title: 'CAP STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Headwear',
    description: 'Classic 6-panel unstructured dad cap and snapback with curved visor and front embroidery relief.',
    features: ['6-Panel Crown', 'Curved Visor', 'Front Embroidery Decal'],
    imageBg: 'from-stone-900/30 to-slate-950/40',
    popular: false
  }
];

const FAQS = [
  {
    q: 'Can I create 3D mockups without a subscription?',
    a: 'Yes! In this application, all 9 garment studios, 60fps video recording, 4K snapshots, and 3D glTF model downloads are completely unlocked with all studio features.'
  },
  {
    q: 'Do I need to sign up or log in to start?',
    a: 'No sign-up or credit card required. You can launch any blank immediately, upload your graphic artworks, and start animating in real-time.'
  },
  {
    q: 'Can I create unlimited mockups?',
    a: 'Yes, you can generate unlimited 3D clothing mockups, video loops (10s, 20s, 30s), and high-resolution snapshots without caps or limits.'
  },
  {
    q: 'Do you store my designs on a server?',
    a: 'No! Everything renders 100% locally in your browser using Three.js and WebGL. Your design files and graphics never leave your computer, ensuring total privacy.'
  },
  {
    q: 'Do I have to wait for the mockup to render/export?',
    a: 'No cloud queue or rendering delays. Real-time canvas streams and direct GLTF export encode on-the-fly directly on your GPU.'
  },
  {
    q: 'Can I edit the color of the garment?',
    a: 'Yes, every garment supports instant color customization using our curated streetwear swatches or the hex color picker.'
  },
  {
    q: 'Does the graphic design reflect inside the collar or hem?',
    a: 'No. Our custom GLSL fabric shader guarantees that artwork prints reflect strictly on the exterior surface, preserving a pristine interior fabric lining.'
  }
];

export function ProductsCatalogModal({
  isOpen,
  onClose,
  currentGarmentType,
  onSelectGarment,
  onGetStarted
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeFaq, setActiveFaq] = useState(null);
  const [versionTab, setVersionTab] = useState('v2');

  if (!isOpen) return null;

  const categories = ['All', 'Tops', 'Outerwear', 'Sweatshirts', 'Bottoms', 'Headwear'];
  const filteredProducts = selectedCategory === 'All'
    ? GARMENT_PRODUCTS
    : GARMENT_PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-studio-950 border border-studio-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white my-auto">
        
        {/* Modal Top Header */}
        <div className="p-6 border-b border-studio-850 flex items-center justify-between bg-studio-900/60 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
              <h2 className="text-xl font-extrabold tracking-tight">Convert your 2D Designs to 3D</h2>
            </div>
            
            {/* Version Switcher like virtualthreads.io */}
            <div className="hidden sm:flex items-center bg-studio-850 p-1 rounded-xl border border-studio-700/60 text-xs">
              <button
                onClick={() => setVersionTab('v1')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  versionTab === 'v1' ? 'bg-white text-black shadow' : 'text-studio-400 hover:text-white'
                }`}
              >
                Version 1
              </button>
              <button
                onClick={() => setVersionTab('v2')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  versionTab === 'v2' ? 'bg-brand-500 text-white shadow-glow-brand' : 'text-studio-400 hover:text-white'
                }`}
              >
                Version 2 (Active)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                if (onGetStarted) onGetStarted();
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-brand transition-all active:scale-95"
            >
              <span>GET STARTED</span>
              <ArrowRight className="size-3.5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-studio-850 hover:bg-studio-800 text-studio-400 hover:text-white transition-colors"
              title="Close Products Modal"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          
          {/* Subtitle & Filter Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-studio-300">
                Select one of our blanks, add your designs, and export video loops and 4K snapshots.
              </p>
              <p className="text-xs text-brand-accent mt-1 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="size-3.5" />
                All 9 garment types unlocked with exterior-only graphic reflection.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-500 text-white shadow-glow-brand'
                      : 'bg-studio-850 text-studio-400 hover:bg-studio-800 hover:text-white border border-studio-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Garments Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => {
              const isCurrent = currentGarmentType === product.id;

              return (
                <div
                  key={product.id}
                  className={`group relative rounded-2xl bg-studio-900 border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                    isCurrent
                      ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-glow-brand'
                      : 'border-studio-800 hover:border-studio-700 hover:bg-studio-850'
                  }`}
                >
                  {/* Top Card Image & Badge */}
                  <div className={`relative h-44 bg-gradient-to-br ${product.imageBg} p-4 flex flex-col justify-between overflow-hidden`}>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          product.badgeType === 'default'
                            ? 'bg-emerald-500 text-black'
                            : 'bg-brand-500 text-white shadow-glow-brand'
                        }`}
                      >
                        {product.badge}
                      </span>

                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="size-3 text-emerald-600" />
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Garment Official High-Res Thumbnail */}
                    <div className="flex items-center justify-center py-1 h-28">
                      <img
                        src={getAssetUrl(`/garments/${product.id}.png`)}
                        alt={product.title}
                        className="h-full object-contain filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                      />
                    </div>

                    <div className="text-[11px] text-studio-400 font-mono flex items-center justify-between">
                      <span>{product.category}</span>
                      <span>16 Morphs • 60 FPS</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-sm font-extrabold tracking-wide text-white group-hover:text-brand-accent transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-xs text-studio-400 mt-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {product.features.map((feat, i) => (
                          <span key={i} className="text-[10px] bg-studio-800 text-studio-300 px-2 py-0.5 rounded-md border border-studio-700/50">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        onSelectGarment(product.id);
                        onClose();
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 ${
                        isCurrent
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold'
                          : 'bg-studio-800 hover:bg-brand-500 text-white hover:shadow-glow-brand'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="size-4" />
                          <span>Currently Editing in 3D</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 fill-current" />
                          <span>Launch Blank in 3D Studio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "Your Brand Deserves Motion" Banner */}
          <div className="relative rounded-3xl bg-gradient-to-r from-brand-600/30 via-indigo-900/40 to-studio-900 border border-brand-500/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-accent bg-brand-500/20 px-3 py-1 rounded-full border border-brand-500/30">
                STUDIO UNLOCKED
              </span>
              <h2 className="text-2xl font-black tracking-tight">Your Brand Deserves Motion</h2>
              <p className="text-xs text-studio-300 max-w-xl leading-relaxed">
                "I'd recommend VirtualThreads to anyone who wants proper 3D mockups without the usual time drain or stress—it's been a genuine time saver."
                <span className="block mt-1 font-semibold text-white">— Stanislav B · Motion Designer</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  if (onGetStarted) onGetStarted();
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-glow-brand flex items-center gap-2 transition-all active:scale-95"
              >
                <span>GET STARTED</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Interactive FAQ Section */}
          <div className="space-y-4 pt-4 border-t border-studio-850">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-white">Frequently Asked Questions</h3>
              <p className="text-xs text-studio-400">Need more information? Everything you need to know about our unlocked 3D mockups.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {FAQS.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-studio-900 border border-studio-800 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-studio-200 hover:text-white"
                    >
                      <span>{faq.q}</span>
                      <span className="text-brand-accent ml-2 text-base">
                        {isOpen ? '−' : '＋'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-studio-400 leading-relaxed animate-fadeIn">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
