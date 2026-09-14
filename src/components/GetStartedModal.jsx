import React, { useState } from 'react';
import { X, ArrowRight, Sparkles, Upload, Video, Layers, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { GARMENT_PRODUCTS } from './ProductsCatalogModal';

export function GetStartedModal({
  isOpen,
  onClose,
  currentGarmentType,
  onSelectGarment,
  onTriggerUploadFront,
  onOpenCatalog
}) {
  const [selectedStep, setSelectedStep] = useState(1);
  const [chosenGarment, setChosenGarment] = useState(currentGarmentType || 'oversized_tee');

  if (!isOpen) return null;

  const handleFinish = () => {
    onSelectGarment(chosenGarment);
    onClose();
    // Open front upload trigger after closing
    setTimeout(() => {
      if (onTriggerUploadFront) onTriggerUploadFront();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-studio-950 border border-studio-800 rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-studio-850 flex items-center justify-between bg-studio-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-accent">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Get Started with 3D Mockups</h2>
              <p className="text-xs text-studio-400">Transform your 2D artwork into photorealistic 3D apparel in 3 simple steps.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-studio-850 hover:bg-studio-800 text-studio-400 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-3 border-b border-studio-850 bg-studio-900/30 text-xs font-semibold">
          {[
            { num: 1, label: '1. Select Garment' },
            { num: 2, label: '2. Add Graphics' },
            { num: 3, label: '3. Animate & Export' }
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setSelectedStep(s.num)}
              className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
                selectedStep === s.num
                  ? 'border-brand-500 text-white bg-brand-500/10'
                  : 'border-transparent text-studio-400 hover:text-studio-200'
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Body Content by Step */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {selectedStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-studio-300">Choose your base streetwear blank:</span>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenCatalog) onOpenCatalog();
                  }}
                  className="text-[11px] text-brand-accent hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>View All 11 Blanks</span>
                  <ChevronRight className="size-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GARMENT_PRODUCTS.slice(0, 6).map((garment) => {
                  const isSelected = chosenGarment === garment.id;
                  return (
                    <button
                      key={garment.id}
                      onClick={() => setChosenGarment(garment.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/15 ring-2 ring-brand-500/40'
                          : 'border-studio-800 bg-studio-900 hover:bg-studio-850'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-accent">
                          {garment.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="size-4 text-emerald-400" />}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-white">{garment.title}</div>
                        <div className="text-[10px] text-studio-400 mt-1 line-clamp-2">{garment.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-studio-900 border border-studio-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Upload className="size-4 text-brand-accent" />
                  <span>Dual Zone Decals (Front & Back)</span>
                </div>
                <p className="text-xs text-studio-400 leading-relaxed">
                  Upload your logos, graphic art, typography, or custom text. Our smart UV mapper places prints precisely on the chest or back torso.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-studio-850 border border-studio-800">
                    <span className="font-bold text-white block">Front Chest Zone</span>
                    <span className="text-[10px] text-studio-400">Left pocket, center chest, or oversized print</span>
                  </div>
                  <div className="p-3 rounded-xl bg-studio-850 border border-studio-800">
                    <span className="font-bold text-white block">Back Torso Zone</span>
                    <span className="text-[10px] text-studio-400">Upper neck branding or full back statement artwork</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Guaranteed Exterior-Only Reflection:</strong> Our custom WebGL GLSL shader isolates pure solid fabric on the inside of the neck and collar lining. Graphics never bleed through.
                </span>
              </div>
            </div>
          )}

          {selectedStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-studio-900 border border-studio-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Video className="size-4 text-brand-accent" />
                  <span>Studio Animations & Export Options</span>
                </div>
                <p className="text-xs text-studio-400 leading-relaxed">
                  Bring your garment to life with motion and export in professional studio resolutions:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-studio-850 border border-studio-800">
                    <span className="font-bold text-white block">60 FPS Video</span>
                    <span className="text-[10px] text-studio-400">10s, 20s, 30s Loops</span>
                  </div>
                  <div className="p-3 rounded-xl bg-studio-850 border border-studio-800">
                    <span className="font-bold text-white block">4K Snapshot</span>
                    <span className="text-[10px] text-studio-400">PNG Transparent Cutout</span>
                  </div>
                  <div className="p-3 rounded-xl bg-studio-850 border border-studio-800">
                    <span className="font-bold text-white block">3D .glTF Export</span>
                    <span className="text-[10px] text-studio-400">For Blender & Clo3D</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-studio-850 bg-studio-900/60 flex items-center justify-between">
          {selectedStep > 1 ? (
            <button
              onClick={() => setSelectedStep(s => s - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-studio-400 hover:text-white transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {selectedStep < 3 ? (
              <button
                onClick={() => setSelectedStep(s => s + 1)}
                className="px-5 py-2.5 rounded-xl bg-studio-800 hover:bg-studio-750 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <span>Next Step</span>
                <ChevronRight className="size-3.5" />
              </button>
            ) : null}

            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-glow-brand transition-all active:scale-95"
            >
              <span>Start Creating Now</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
