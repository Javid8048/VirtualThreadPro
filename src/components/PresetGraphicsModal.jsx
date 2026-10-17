import React, { useState } from 'react';
import { X, Sparkles, Plus, Check, Search } from 'lucide-react';
import { PRESET_GRAPHICS, PRESET_CATEGORIES, svgToImage } from '../utils/presetGraphics';

export function PresetGraphicsModal({
  isOpen,
  onClose,
  onSelectGraphic,
  selectedSide = 'front',
  garmentColor = '#ffffff'
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const filtered = PRESET_GRAPHICS.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.tags && item.tags.some(t => t.includes(q)));
    return matchesCat && matchesSearch;
  });

  const handleApplyGraphic = async (item) => {
    try {
      setIsAdding(true);
      const { img, dataUrl, svg } = await svgToImage(item.svg, garmentColor);
      onSelectGraphic({
        image: img,
        dataUrl,
        name: item.name,
        svg: item.svg
      });
      setIsAdding(false);
      onClose();
    } catch (err) {
      console.error('Failed to load preset graphic:', err);
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-studio-900 border border-gray-200 dark:border-studio-700 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-gray-900 dark:text-white select-none">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-studio-800 flex items-center justify-between bg-gray-50/80 dark:bg-studio-850/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-brand-500/15 text-brand-500 flex items-center justify-center border border-brand-500/25">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">Streetwear Graphics &amp; Stickers</h3>
              <p className="text-[11px] text-gray-500 dark:text-studio-400">
                Add instant vector artwork to {selectedSide.toUpperCase()} panel • 100% transparent
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-studio-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-gray-100 dark:border-studio-800 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stickers, barcodes, emblems..."
              className="w-full bg-gray-100 dark:bg-studio-800/80 border border-gray-200 dark:border-studio-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-black dark:bg-white text-white dark:text-gray-900 shadow-xs'
                    : 'bg-gray-100 dark:bg-studio-800 text-gray-600 dark:text-studio-300 hover:bg-gray-200 dark:hover:bg-studio-750'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Graphics Grid */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((item) => {
              const isSelected = selectedId === item.id;
              const encoded = encodeURIComponent(item.svg);
              const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;

              return (
                <div
                  key={item.id}
                  onClick={() => handleApplyGraphic(item)}
                  className="group relative flex flex-col p-3 rounded-2xl border border-gray-200 dark:border-studio-750 bg-gray-50/60 dark:bg-studio-800/50 hover:bg-white dark:hover:bg-studio-800 hover:border-brand-500 dark:hover:border-brand-500 shadow-2xs hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  <div className="aspect-[4/3] w-full flex items-center justify-center p-2 rounded-xl bg-white dark:bg-studio-900/80 border border-gray-100 dark:border-studio-750 group-hover:scale-102 transition-transform overflow-hidden">
                    <img
                      src={dataUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain filter dark:invert-0"
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-studio-400 capitalize">
                        {item.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isAdding}
                      className="size-6 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors"
                      title="Add to garment"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
