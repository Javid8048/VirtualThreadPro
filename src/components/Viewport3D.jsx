import React, { useEffect, useRef } from 'react';
import { CameraControlsBar } from './CameraControlsBar';

export function Viewport3D({
  sceneManagerRef,
  currentCamera,
  onCameraChange,
  onZoomIn,
  onZoomOut,
  backdropMode,
  customBackground = null,
  backgroundBlur = 0
}) {
  const containerRef = useRef(null);

  // Background style class
  const getBackdropClass = () => {
    if (backdropMode === 'dark') {
      return 'bg-[radial-gradient(ellipse_at_center,_#1f2229_0%,_#16181f_45%,_#0f1115_100%)]';
    } else if (backdropMode === 'light') {
      return 'bg-gradient-to-b from-[#e8ecf3] to-[#ccd4e2]';
    } else if (backdropMode === 'transparent') {
      // Transparent checkerboard
      return 'bg-[linear-gradient(45deg,#1b202c_25%,transparent_25%),linear-gradient(-45deg,#1b202c_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1b202c_75%),linear-gradient(-45deg,transparent_75%,#1b202c_75%)] bg-[size:24px_24px] bg-[#0f1115]';
    } else {
      return 'bg-[radial-gradient(ellipse_at_center,_#1f2229_0%,_#16181f_45%,_#0f1115_100%)]';
    }
  };

  return (
    <div className={`relative flex-1 h-[calc(100vh-3.5rem)] overflow-hidden transition-colors duration-300 ${getBackdropClass()}`}>
      {/* Custom Device Background */}
      {backdropMode === 'custom' && customBackground && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-300"
          style={{
            backgroundImage: `url(${customBackground})`,
            filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : 'none',
            transform: backgroundBlur > 0 ? 'scale(1.06)' : 'none'
          }}
        />
      )}
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
          <span className="hidden sm:inline">Interactive 3D • Left click to rotate • Double-click design to move & resize</span>
          <span className="inline sm:hidden">Swipe to rotate • Double-tap design to move & resize</span>
        </div>
      </div>
    </div>
  );
}
