import React from 'react';
import { Camera, Video, Sparkles, Shirt, Download, Layers } from 'lucide-react';

export function Navbar({ onOpenExport, onOpenPresets }) {
  return (
    <header className="h-14 border-b border-studio-800 bg-studio-900/90 backdrop-blur-md px-5 flex items-center justify-between z-20 select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow-brand">
          <Shirt className="size-5 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-base tracking-tight text-white">VirtualThreads</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-brand-500/20 text-brand-accent border border-brand-500/30">
            3D STUDIO
          </span>
        </div>
      </div>

      {/* Center Inspiration Actions */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-studio-200 bg-studio-850 hover:bg-studio-800 border border-studio-700/60 transition-colors shadow-sm"
        >
          <Sparkles className="size-3.5 text-amber-400" />
          <span>Style Presets</span>
        </button>
      </div>

      {/* Right Export Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => onOpenExport('image')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-studio-200 bg-studio-850 hover:bg-studio-800 border border-studio-700/70 transition-all hover:text-white"
          title="Download 4K Snapshot"
        >
          <Camera className="size-3.5 text-brand-400" />
          <span className="hidden sm:inline">4K Snapshot</span>
        </button>

        <button
          onClick={() => onOpenExport('video')}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 transition-all shadow-glow-brand hover:shadow-lg active:scale-95"
          title="Record 60 FPS Video Loop"
        >
          <Video className="size-3.5" />
          <span>Export 60 FPS Video</span>
        </button>
      </div>
    </header>
  );
}
