import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { SidebarLeft } from './components/SidebarLeft';
import { PositionGuide } from './components/PositionGuide';
import { ExportModal } from './components/ExportModal';
import { ProductsCatalogModal } from './components/ProductsCatalogModal';
import { GetStartedModal } from './components/GetStartedModal';
import { StaticGarmentView } from './components/StaticGarmentView';
import { LandingPage } from './components/LandingPage';
import { SceneManager } from './three/SceneManager';

export default function App() {
  const containerRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadTargetSideRef = useRef('front');

  // App Page Route State ('landing' | 'studio')
  const [currentPage, setCurrentPage] = useState('landing');

  // Garment Blank Type State (11 Blanks from virtualthreads.io/products)
  const [garmentType, setGarmentType] = useState('oversized_tee');
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [productsCatalogOpen, setProductsCatalogOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  // States matching official VirtualThreads UI
  const [garmentColor, setGarmentColor] = useState('#ffffff'); // default clean white
  const [backdropMode, setBackdropMode] = useState('dark');
  const [animationMode, setAnimationMode] = useState('static');
  const [walkSpeed, setWalkSpeed] = useState(1.0);
  const [cameraAnimationMode, setCameraAnimationMode] = useState('none'); // 'none' | 'rotate' | 'rotatezoom'
  const [acidWash, setAcidWash] = useState(0); // 0 to 1
  const [puffPrint, setPuffPrint] = useState(0); // 0 to 1
  const [interactionMode, setInteractionMode] = useState('orbit'); // 'orbit' | 'dragDesign'
  const [positionGuideOpen, setPositionGuideOpen] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalTab, setExportModalTab] = useState('video');
  const [mobileFrameGuide, setMobileFrameGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  window.__IS_LOADED__ = isLoaded;
  const [designManager, setDesignManager] = useState(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const sm = new SceneManager(containerRef.current, () => {
      setIsLoaded(true);
    });

    sceneManagerRef.current = sm;
    window.__SCENE_MANAGER__ = sm;
    setDesignManager(sm.designManager);

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
      setDesignManager(null);
    };
  }, []);

  // Handlers
  const handleGarmentTypeChange = (type) => {
    setGarmentType(type);
    setViewMode('3d');
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setGarmentType(type);
      sceneManagerRef.current.handleResize();
    }
  };
  window.__SET_GARMENT_TYPE__ = handleGarmentTypeChange;

  const handleSelectGarmentFromLanding = (type) => {
    handleGarmentTypeChange(type);
    setCurrentPage('studio');
  };
  window.__SELECT_GARMENT_FROM_LANDING__ = handleSelectGarmentFromLanding;
  window.__SET_CURRENT_PAGE__ = setCurrentPage;

  // Ensure Three.js canvas resizes cleanly whenever entering studio
  useEffect(() => {
    if (currentPage === 'studio' && sceneManagerRef.current) {
      setTimeout(() => {
        sceneManagerRef.current.handleResize();
      }, 50);
    }
  }, [currentPage]);

  const handleGarmentColorChange = (hex) => {
    setGarmentColor(hex);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setGarmentColor(hex);
    }
  };

  const handleAcidWashChange = (val) => {
    setAcidWash(val);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAcidWash(val);
    }
  };

  const handlePuffPrintChange = (val) => {
    setPuffPrint(val);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setPuffPrint(val);
    }
  };

  const handleCameraAnimationModeChange = (mode) => {
    setCameraAnimationMode(mode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraAnimationMode(mode);
    }
  };

  const handleTriggerKnit = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.triggerKnitAnimation();
    }
  };

  const handleAnimationModeChange = (mode) => {
    setAnimationMode(mode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAnimationMode(mode);
    }
  };

  const handleWalkSpeedChange = (speed) => {
    setWalkSpeed(speed);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setWalkSpeed(speed);
    }
  };

  const handleInteractionModeChange = (mode) => {
    setInteractionMode(mode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setInteractionMode(mode);
    }
  };

  const handleCameraChange = (view) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(view);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleTriggerUploadFront = () => {
    uploadTargetSideRef.current = 'front';
    handleCameraChange('front');
    fileInputRef.current?.click();
  };

  const handleTriggerUploadBack = () => {
    uploadTargetSideRef.current = 'back';
    handleCameraChange('back');
    fileInputRef.current?.click();
  };

  const handleTriggerUpload = (side = 'front') => {
    uploadTargetSideRef.current = typeof side === 'string' ? side : 'front';
    handleCameraChange(uploadTargetSideRef.current);
    fileInputRef.current?.click();
  };

  const handleGlobalFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !sceneManagerRef.current) return;

    const targetSide = uploadTargetSideRef.current || 'front';
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        sceneManagerRef.current.designManager.addLayer({
          type: 'image',
          side: targetSide,
          image: img,
          x: targetSide === 'back' ? 1520 : 530,
          y: 800,
          scale: 1.0,
          rotation: 0,
          printType: 'puff'
        });
        setPositionGuideOpen(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Viewport background style
  const getBackdropClass = () => {
    if (backdropMode === 'dark') {
      return 'bg-[#121318]';
    } else if (backdropMode === 'light') {
      return 'bg-[#e5e7eb]';
    } else {
      return 'bg-[linear-gradient(45deg,#1b202c_25%,transparent_25%),linear-gradient(-45deg,#1b202c_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1b202c_75%),linear-gradient(-45deg,transparent_75%,#1b202c_75%)] bg-[size:24px_24px] bg-[#121318]';
    }
  };

  return (
    <div className={`relative h-screen w-screen overflow-hidden ${getBackdropClass()}`}>
      
      {/* Hidden Global File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGlobalFileUpload}
        className="hidden"
      />

      {/* 1. Landing Page View (Default when loading the website) */}
      {currentPage === 'landing' && (
        <LandingPage
          onSelectGarment={handleSelectGarmentFromLanding}
          onOpenPricing={() => setProductsCatalogOpen(true)}
          onOpenCatalog={() => setProductsCatalogOpen(true)}
        />
      )}

      {/* 3D WebGL Canvas Viewport (Active in 3D Mode in Studio) */}
      <div
        ref={containerRef}
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0 ${
          currentPage === 'studio' && viewMode === '3d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Flat Studio View (Active when user chooses 2D mode in Studio) */}
      {currentPage === 'studio' && viewMode === '2d' && (
        <StaticGarmentView
          garmentType={garmentType}
          garmentColor={garmentColor}
          designManager={designManager}
          onSwitchTo3D={() => setViewMode('3d')}
          backdropMode={backdropMode}
        />
      )}

      {/* Loading Overlay (Only shown inside Studio) */}
      {currentPage === 'studio' && !isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121318] z-50 text-white select-none">
          <div className="size-12 rounded-full border-4 border-white/20 border-t-[#4f46e5] animate-spin mb-4" />
          <h2 className="text-base font-bold tracking-wide">Loading 3D Studio...</h2>
          <p className="text-xs text-gray-400 mt-1">Preparing photorealistic streetwear model</p>
        </div>
      )}

      {/* Studio UI Controls (Sidebar, Position Guide, Fullscreen) */}
      {currentPage === 'studio' && (
        <>
          {/* Top Right Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`absolute top-6 ${positionGuideOpen ? 'right-[464px]' : 'right-6'} p-2.5 rounded-2xl bg-studio-900/80 backdrop-blur-md border border-studio-800 text-white shadow-xl hover:bg-studio-800 transition-all z-20`}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>

          {/* Left Floating Menu */}
          <SidebarLeft
            onBackToLanding={() => setCurrentPage('landing')}
            garmentColor={garmentColor}
        onGarmentColorChange={handleGarmentColorChange}
        backdropMode={backdropMode}
        onBackdropModeChange={setBackdropMode}
        animationMode={animationMode}
        onAnimationModeChange={handleAnimationModeChange}
        walkSpeed={walkSpeed}
        onWalkSpeedChange={handleWalkSpeedChange}
        cameraAnimationMode={cameraAnimationMode}
        onCameraAnimationModeChange={handleCameraAnimationModeChange}
        acidWash={acidWash}
        onAcidWashChange={handleAcidWashChange}
        puffPrint={puffPrint}
        onPuffPrintChange={handlePuffPrintChange}
        onTriggerKnit={handleTriggerKnit}
        onCameraChange={handleCameraChange}
        onOpenExport={(tab = 'video') => {
          setExportModalTab(typeof tab === 'string' ? tab : 'video');
          setExportModalOpen(true);
        }}
        onOpenPositionGuide={() => setPositionGuideOpen(!positionGuideOpen)}
        onTriggerUploadFront={handleTriggerUploadFront}
        onTriggerUploadBack={handleTriggerUploadBack}
        designManager={designManager}
        currentGarmentType={garmentType}
        onSelectGarment={handleGarmentTypeChange}
        onOpenProductsCatalog={() => setProductsCatalogOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Right Floating Position Guide */}
      <PositionGuide
        isOpen={positionGuideOpen}
        onClose={() => setPositionGuideOpen(false)}
        designManager={designManager}
        currentGarmentType={garmentType}
        onTriggerUpload={handleTriggerUpload}
        onTriggerUploadFront={handleTriggerUploadFront}
        onTriggerUploadBack={handleTriggerUploadBack}
        onCameraChange={handleCameraChange}
      />
      </>
      )}

      {/* Export Modal (4K Snapshots, 60 FPS Video & 3D GLTF) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        sceneManager={sceneManagerRef.current}
        backdropMode={backdropMode}
        defaultTab={exportModalTab}
      />

      {/* Products & Garment Blanks Catalog Modal (from virtualthreads.io/products) */}
      <ProductsCatalogModal
        isOpen={productsCatalogOpen}
        onClose={() => setProductsCatalogOpen(false)}
        currentGarmentType={garmentType}
        onSelectGarment={handleGarmentTypeChange}
        onGetStarted={() => setGetStartedOpen(true)}
      />

      {/* Get Started Quick Onboarding Modal */}
      <GetStartedModal
        isOpen={getStartedOpen}
        onClose={() => setGetStartedOpen(false)}
        currentGarmentType={garmentType}
        onSelectGarment={handleGarmentTypeChange}
        onTriggerUploadFront={handleTriggerUploadFront}
        onOpenCatalog={() => setProductsCatalogOpen(true)}
      />

    </div>
  );
}
