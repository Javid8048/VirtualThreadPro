import React from 'react';
import { Eye, RotateCw, ZoomIn } from 'lucide-react';

export function CameraControlsBar({ onCameraChange, currentCamera }) {
  const views = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'hero', label: 'Hero 45°' },
    { id: 'left', label: 'Left' },
    { id: 'right', label: 'Right' },
    { id: 'chest', label: 'Chest Zoom' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1.5 rounded-2xl bg-studio-900/85 backdrop-blur-md border border-studio-700/60 shadow-2xl">
      <div className="flex items-center gap-1 px-1">
        {views.map((v) => {
          const isActive = currentCamera === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onCameraChange(v.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-studio-300 hover:text-white hover:bg-studio-800'
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
