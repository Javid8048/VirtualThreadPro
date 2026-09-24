import React, { useEffect, useRef } from 'react';
import { CameraControlsBar } from './CameraControlsBar';

export function Viewport3D({
  sceneManagerRef,
  currentCamera,
  onCameraChange,
  onZoomIn,
  onZoomOut,
  backdropMode
}) {
  const containerRef = useRef(null);

  // Background style class
  const getBackdropClass = () => {
    if (backdropMode === 'dark') {
      return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-studio-800 via-studio-900 to-studio-950';
    } else if (backdropMode === 'light') {
      return 'bg-gradient-to-b from-[#e8ecf3] to-[#ccd4e2]';
    } else {
      // Transparent checkerboard
      return 'bg-[linear-gradient(45deg,#1b202c_25%,transparent_25%),linear-gradient(-45deg,#1b202c_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1b202c_75%),linear-gradient(-45deg,transparent_75%,#1b202c_75%)] bg-[size:24px_24px] bg-studio-950';
    }
  };

  return (
    <div className={`relative flex-1 h-[calc(100vh-3.5rem)] overflow-hidden transition-colors duration-300 ${getBackdropClass()}`}>
      {/* 3D Canvas Mounting Point */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Camera Toolbar */}
      <CameraControlsBar
        currentCamera={currentCamera}
        onCameraChange={onCameraChange}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />

      {/* Canvas Hint */}
      <div className="absolute top-4 left-6 pointer-events-none select-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-studio-900/60 backdrop-blur-md border border-studio-800 text-[11px] text-studio-400">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Interactive 3D • Left click to rotate, scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
