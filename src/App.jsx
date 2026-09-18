import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { SidebarLeft } from './components/SidebarLeft';
import { PositionGuide } from './components/PositionGuide';
import { ExportPanel } from './components/ExportPanel';
import { ProductsCatalogModal } from './components/ProductsCatalogModal';
import { GetStartedModal } from './components/GetStartedModal';
import { StaticGarmentView } from './components/StaticGarmentView';
import { LandingPage } from './components/LandingPage';
import { HeaderNav } from './components/HeaderNav';
import { SceneManager } from './three/SceneManager';

export default function App() {
  const containerRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadTargetSideRef = useRef('front');

  // URL search params support (e.g. ?garment=hoodie or ?page=studio)
  const initialParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialGarment = initialParams.get('garment') || 'oversized_tee';
  const initialPage = initialParams.get('page') || (initialParams.get('garment') ? 'studio' : 'landing');

  // App Page Route State ('landing' | 'studio')
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Garment Blank Type State (11 Blanks from virtualthreads.io/products)
  const [garmentType, setGarmentType] = useState(initialGarment);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [currentCamera, setCurrentCamera] = useState('front');
  const [activeSide, setActiveSide] = useState('front');
  const [productsCatalogOpen, setProductsCatalogOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vt_theme');
      if (saved) return saved;
    }
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // States matching official VirtualThreads UI
  const [garmentColor, setGarmentColor] = useState('#ffffff'); // default clean white
  const [backdropMode, setBackdropMode] = useState(theme === 'light' ? 'light' : 'dark');

  // Sync theme changes with DOM and backdrop
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        setBackdropMode('dark');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        setBackdropMode('light');
      }
      localStorage.setItem('vt_theme', theme);
    }
  }, [theme]);

  // Sync backdrop lighting with SceneManager
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setupLighting(backdropMode);
    }
  }, [backdropMode]);
  const [animationMode, setAnimationMode] = useState('static');
  const [walkSpeed, setWalkSpeed] = useState(1.0);
  const [cameraAnimationMode, setCameraAnimationMode] = useState('none'); // 'none' | 'rotate' | 'rotatezoom'
  const [acidWash, setAcidWash] = useState(0); // 0 to 1
  const [puffPrint, setPuffPrint] = useState(0); // 0 to 1
  const [interactionMode, setInteractionMode] = useState('orbit'); // 'orbit' | 'dragDesign'
  // Right Drawer Mode: 'design' (PositionGuide) | 'export' (ExportPanel) | null (closed)
  const [rightDrawerMode, setRightDrawerMode] = useState('design');
  const [exportTab, setExportTab] = useState('video');
  const positionGuideOpen = rightDrawerMode === 'design';
  const setPositionGuideOpen = (open) => {
    setRightDrawerMode(open ? 'design' : null);
  };
  const handleOpenExport = (tab = 'video') => {
    setExportTab(typeof tab === 'string' ? tab : 'video');
    setRightDrawerMode('export');
  };
  const [mobileFrameGuide, setMobileFrameGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  window.__IS_LOADED__ = isLoaded;
  const [designManager, setDesignManager] = useState(null);

  // Initialize Three.js Scene only when entering Studio
  useEffect(() => {
    if (currentPage !== 'studio' || !containerRef.current) return;

    setIsLoaded(false);
    const sm = new SceneManager(
      containerRef.current,
      () => {
        setIsLoaded(true);
      },
      garmentType
    );

    sceneManagerRef.current = sm;
    window.__SCENE_MANAGER__ = sm;
    setDesignManager(sm.designManager);

    if (garmentColor) sm.setGarmentColor(garmentColor);
    if (backdropMode) sm.setupLighting(backdropMode);
    if (animationMode) sm.setAnimationMode(animationMode);
    if (walkSpeed) sm.setWalkSpeed(walkSpeed);
    if (acidWash) sm.setAcidWash(acidWash);
    if (puffPrint) sm.setPuffPrint(puffPrint);

    setTimeout(() => {
      sm.handleResize();
    }, 50);

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
      window.__SCENE_MANAGER__ = null;
      setDesignManager(null);
      setIsLoaded(false);
    };
  }, [currentPage]);

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
    setPositionGuideOpen(true);
    setCurrentPage('studio');
  };
  window.__SELECT_GARMENT_FROM_LANDING__ = handleSelectGarmentFromLanding;
  window.__SET_CURRENT_PAGE__ = setCurrentPage;

  const handleBackToLanding = () => {
    const hasDesigns = designManager && designManager.layers && designManager.layers.length > 0;
    if (hasDesigns) {
      const confirmDiscard = window.confirm("Confirm you want to discard the design");
      if (confirmDiscard) {
        if (designManager) {
          designManager.clearLayers();
        }
        if (sceneManagerRef.current) {
          sceneManagerRef.current.setAnimationMode('static');
          sceneManagerRef.current.setCameraPreset('front');
        }
        setAnimationMode('static');
        setInteractionMode('orbit');
        setCurrentPage('landing');
      }
    } else {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.setAnimationMode('static');
      }
      setAnimationMode('static');
      setInteractionMode('orbit');
      setCurrentPage('landing');
    }
  };
  window.__HANDLE_BACK_TO_LANDING__ = handleBackToLanding;

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
    const normalizedMode = (mode === 'walk') ? 'walking' : (mode === 'none') ? 'static' : (mode === 'wind') ? 'waves' : mode;
    setAnimationMode(normalizedMode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAnimationMode(normalizedMode);
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
    if (mode === 'dragDesign') {
      setPositionGuideOpen(true);
    }
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setInteractionMode(mode);
    }
  };

  const handleCameraChange = (view) => {
    setCurrentCamera(view);
    if (view === 'front' || view === 'back') {
      setActiveSide(view);
    }
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(view);
    }
  };

  const handleSideChange = (side) => {
    setActiveSide(side);
    setCurrentCamera(side);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(side);
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
          printType: 'screen'
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

  // Ensure landing page has active scrollbar, and studio is locked to viewport
  useEffect(() => {
    if (currentPage === 'landing') {
      document.documentElement.style.overflowY = 'auto';
      document.body.style.overflowY = 'auto';
    } else {
      document.documentElement.style.overflowY = 'hidden';
      document.body.style.overflowY = 'hidden';
    }
  }, [currentPage]);

  return (
    <div className={`relative w-full ${currentPage === 'landing' ? 'min-h-screen' : 'h-screen w-screen overflow-hidden'} ${getBackdropClass()}`}>
      
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
          theme={theme}
          onToggleTheme={toggleTheme}
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
          activeSide={activeSide}
          onSideChange={handleSideChange}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenExport={handleOpenExport}
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

      {/* Studio UI Controls (Top Menu Bar, Sidebar, Position Guide) */}
      {currentPage === 'studio' && (
        <>
          {/* Top Menu Bar: Rotate, Design Drag, Camera Presets, Static / 360 Turntable - Strictly in 3D Mode */}
          {viewMode === '3d' && (
            <HeaderNav
              currentGarmentType={garmentType}
              onSelectGarment={handleGarmentTypeChange}
              onOpenProductsCatalog={() => setProductsCatalogOpen(true)}
              interactionMode={interactionMode}
              onInteractionModeChange={handleInteractionModeChange}
              currentCamera={currentCamera}
              onCameraChange={handleCameraChange}
              animationMode={animationMode}
              onAnimationModeChange={handleAnimationModeChange}
              onToggleTurntable={() => handleAnimationModeChange(animationMode === 'turntable' ? 'static' : 'turntable')}
              positionGuideOpen={rightDrawerMode === 'design'}
              onTogglePositionGuide={() => setRightDrawerMode(rightDrawerMode === 'design' ? null : 'design')}
              onOpenExport={handleOpenExport}
              onBackToLanding={handleBackToLanding}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}

          {/* Left Floating Menu */}
          <SidebarLeft
            onBackToLanding={handleBackToLanding}
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
        onOpenExport={handleOpenExport}
        onOpenPositionGuide={() => setRightDrawerMode(rightDrawerMode === 'design' ? null : 'design')}
        onTriggerUploadFront={handleTriggerUploadFront}
        onTriggerUploadBack={handleTriggerUploadBack}
        designManager={designManager}
        currentGarmentType={garmentType}
        onSelectGarment={handleGarmentTypeChange}
        onOpenProductsCatalog={() => setProductsCatalogOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Right Floating Position Guide (Design & Graphics Studio) */}
      <PositionGuide
        isOpen={rightDrawerMode === 'design'}
        onClose={() => setRightDrawerMode(null)}
        onOpenExport={handleOpenExport}
        designManager={designManager}
        currentGarmentType={garmentType}
        selectedSide={activeSide}
        onSideChange={handleSideChange}
        onTriggerUpload={handleTriggerUpload}
        onTriggerUploadFront={handleTriggerUploadFront}
        onTriggerUploadBack={handleTriggerUploadBack}
        onCameraChange={handleCameraChange}
      />

      {/* Right Floating Export Panel (Replaces Design Studio upon clicking Export) */}
      <ExportPanel
        isOpen={rightDrawerMode === 'export'}
        onClose={() => setRightDrawerMode(null)}
        onSwitchToDesign={() => setRightDrawerMode('design')}
        defaultTab={exportTab}
        sceneManager={sceneManagerRef.current}
        backdropMode={backdropMode}
      />

      {/* On-Canvas Graphic Transform HUD (Active when in Drag Design mode in 3D Studio) */}
      {viewMode === '3d' && interactionMode === 'dragDesign' && designManager && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 dark:bg-studio-900/95 backdrop-blur-xl px-4 py-2 rounded-2xl border border-gray-200/90 dark:border-studio-700 shadow-2xl text-xs select-none animate-fadeIn">
          <span className="font-bold text-gray-700 dark:text-gray-200">Graphic Size:</span>
          
          <button
            onClick={() => {
              const active = designManager.getActiveLayer() || designManager.layers[0];
              if (active) {
                const newScale = Math.max(0.2, (active.scale || 1.0) - 0.1);
                designManager.updateLayer(active.id, { scale: parseFloat(newScale.toFixed(2)) });
              }
            }}
            className="size-6 rounded-lg bg-gray-100 dark:bg-studio-800 hover:bg-gray-200 dark:hover:bg-studio-700 flex items-center justify-center font-bold text-gray-800 dark:text-white transition-colors"
            title="Decrease Size"
          >
            -
          </button>

          <input
            type="range"
            min="20"
            max="300"
            value={Math.round(((designManager.getActiveLayer() || designManager.layers[0])?.scale || 1.0) * 100)}
            onChange={(e) => {
              const active = designManager.getActiveLayer() || designManager.layers[0];
              if (active) {
                const newScale = parseInt(e.target.value) / 100;
                designManager.updateLayer(active.id, { scale: newScale });
              }
            }}
            className="w-24 sm:w-32 accent-brand-500 cursor-pointer"
          />

          <button
            onClick={() => {
              const active = designManager.getActiveLayer() || designManager.layers[0];
              if (active) {
                const newScale = Math.min(3.5, (active.scale || 1.0) + 0.1);
                designManager.updateLayer(active.id, { scale: parseFloat(newScale.toFixed(2)) });
              }
            }}
            className="size-6 rounded-lg bg-gray-100 dark:bg-studio-800 hover:bg-gray-200 dark:hover:bg-studio-700 flex items-center justify-center font-bold text-gray-800 dark:text-white transition-colors"
            title="Increase Size"
          >
            +
          </button>

          <span className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400 min-w-[38px] text-right">
            {Math.round(((designManager.getActiveLayer() || designManager.layers[0])?.scale || 1.0) * 100)}%
          </span>

          <span className="text-[10px] text-gray-400 border-l border-gray-200 dark:border-studio-700 pl-2 hidden md:inline">
            Tip: Drag directly on shirt • Alt+Drag or Mouse Wheel to resize
          </span>
        </div>
      )}
      </>
      )}

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
