import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, CheckCircle, Shirt, Video } from 'lucide-react';
import { SidebarLeft } from './components/SidebarLeft';
import { PositionGuide } from './components/PositionGuide';
import { ExportPanel } from './components/ExportPanel';
import { ProductsCatalogModal } from './components/ProductsCatalogModal';
import { GetStartedModal } from './components/GetStartedModal';
import { StaticGarmentView } from './components/StaticGarmentView';
import { LandingPage } from './components/LandingPage';
import { HeaderNav } from './components/HeaderNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SceneManager } from './three/SceneManager';

const garmentNameMap = {
  oversized_tee: 'Oversized Tee',
  regular_tee: 'Classic Tee',
  cropped_tee: 'Cropped Tee',
  polo: 'Polo Shirt',
  sweatshirt: 'Sweatshirt',
  hoodie: 'Hoodie',
  zip_hoodie: 'Zip Hoodie',
  sweatpants: 'Sweatpants',
  cap: 'Streetwear Cap'
};

export default function App() {
  const containerRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadTargetSideRef = useRef('front');
  const artworkCacheRef = useRef({});

  // URL search params support (e.g. ?garment=hoodie or ?page=studio)
  const initialParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialGarment = initialParams.get('garment') || 'oversized_tee';
  const initialPage = initialParams.get('page') || (initialParams.get('garment') ? 'studio' : 'landing');

  // App Page Route State ('landing' | 'studio')
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Garment Blank Type State (9 Streetwear Blanks)
  const [garmentType, setGarmentType] = useState(initialGarment);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [currentCamera, setCurrentCamera] = useState('front');
  const [isZoomed, setIsZoomed] = useState(false); // Default wide view per user request
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
  window.__HANDLE_OPEN_EXPORT__ = handleOpenExport;
  window.__SET_RIGHT_DRAWER_MODE__ = setRightDrawerMode;
  const [mobileFrameGuide, setMobileFrameGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  window.__IS_LOADED__ = isLoaded;
  const [isGarmentLoading, setIsGarmentLoading] = useState(false);
  const [pendingGarmentType, setPendingGarmentType] = useState(null);
  const [designManager, setDesignManager] = useState(null);

  // Global Asynchronous Video Export State (Persists across panel open/close)
  const [asyncExportState, setAsyncExportState] = useState({
    isRecording: false,
    progress: 0,
    elapsedSec: 0,
    duration: 5,
    status: 'idle', // 'idle' | 'recording' | 'complete' | 'error'
    fileName: null
  });

  // Auto-dismiss completed export toast after 4 seconds
  useEffect(() => {
    if (asyncExportState.status === 'complete') {
      const timer = setTimeout(() => {
        setAsyncExportState((prev) => ({ ...prev, status: 'idle' }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [asyncExportState.status]);

  // Initialize Three.js Scene early for instantaneous studio launch (0ms delay)
  useEffect(() => {
    if (!containerRef.current || sceneManagerRef.current) return;

    const sm = new SceneManager(
      containerRef.current,
      () => {
        setIsLoaded(true);
      },
      garmentType
    );

    sm.onGarmentLoading = (loading, type) => {
      setIsGarmentLoading(loading);
      if (type) setPendingGarmentType(type);
      if (!loading) setPendingGarmentType(null);
    };

    sm.onTurntableAutoPause = () => {
      setAnimationMode('static');
    };

    sceneManagerRef.current = sm;
    window.__SCENE_MANAGER__ = sm;
    setDesignManager(sm.designManager);

    if (garmentColor) sm.setGarmentColor(garmentColor);
    if (backdropMode) sm.setupLighting(backdropMode);
    if (animationMode) sm.setAnimationMode(animationMode);
    if (walkSpeed) sm.setWalkSpeed(walkSpeed);
    if (acidWash) sm.setAcidWash(acidWash);
    if (puffPrint) sm.setPuffPrint(puffPrint);

    if (currentPage === 'landing' || viewMode !== '3d') {
      sm.pause();
    }

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
      window.__SCENE_MANAGER__ = null;
      setDesignManager(null);
      setIsLoaded(false);
    };
  }, []);

  // Pause/resume WebGL rendering when switching between landing and studio, or changing viewMode
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    if (currentPage === 'studio' && viewMode === '3d') {
      sceneManagerRef.current.resume();
      setTimeout(() => {
        sceneManagerRef.current?.handleResize();
      }, 40);
    } else {
      sceneManagerRef.current.pause();
    }
  }, [currentPage, viewMode]);

  // Pause WebGL rendering when browser tab is inactive/hidden to eliminate CPU/GPU drain
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!sceneManagerRef.current) return;
      if (document.hidden) {
        sceneManagerRef.current.pause();
      } else if (currentPage === 'studio' && viewMode === '3d') {
        sceneManagerRef.current.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentPage, viewMode]);

  // Global Keyboard Shortcuts (Undo/Redo & WCAG 2.1 AA Keyboard 3D Orbit Navigation)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // 1. Undo / Redo Shortcuts (Ctrl+Z, Cmd+Z, Ctrl+Y, Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            designManager?.redo?.();
          } else {
            designManager?.undo?.();
          }
          return;
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          designManager?.redo?.();
          return;
        }
      }

      // 2. WCAG 2.1 AA 15° Keyboard Orbit Controls for 3D Studio
      if (currentPage === 'studio' && viewMode === '3d' && sceneManagerRef.current && !isInput) {
        const controls = sceneManagerRef.current.controls;
        if (!controls) return;
        const ROTATE_STEP = (15 * Math.PI) / 180; // 15 degrees

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          controls.rotateLeft(ROTATE_STEP);
          controls.update();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          controls.rotateLeft(-ROTATE_STEP);
          controls.update();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          controls.rotateUp(ROTATE_STEP);
          controls.update();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          controls.rotateUp(-ROTATE_STEP);
          controls.update();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [designManager, currentPage, viewMode]);

  // Handlers
  const handleGarmentTypeChange = (type) => {
    if (type === garmentType) return;
    setIsGarmentLoading(true);
    setPendingGarmentType(type);

    // Cache current garment's artwork before switching (Document 2 non-destructive UX)
    if (designManager) {
      artworkCacheRef.current[garmentType] = [...designManager.layers];
    }

    setGarmentType(type);
    setCurrentCamera('front');
    setIsZoomed(false);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setGarmentType(type, () => {
        setIsGarmentLoading(false);
        setPendingGarmentType(null);
      });
      sceneManagerRef.current.setCameraPreset('front', false);
      sceneManagerRef.current.handleResize();
    } else {
      setTimeout(() => {
        setIsGarmentLoading(false);
        setPendingGarmentType(null);
      }, 300);
    }

    // Restore cached artwork for the new garment if previously customized
    if (designManager) {
      const cached = artworkCacheRef.current[type];
      if (cached && cached.length > 0) {
        designManager.layers = [...cached];
        designManager.activeLayerId = cached[0]?.id || null;
        designManager.saveHistory();
        designManager.flush();
      }
    }
  };

  window.__SET_GARMENT_TYPE__ = handleGarmentTypeChange;
  window.__SET_VIEW_MODE__ = setViewMode;

  const handleSelectGarmentFromLanding = (type) => {
    handleGarmentTypeChange(type);
    setPositionGuideOpen(true);
    setRightDrawerMode('design');
    setCurrentCamera('front');
    setIsZoomed(false);
    setCurrentPage('studio');
  };
  window.__SELECT_GARMENT_FROM_LANDING__ = handleSelectGarmentFromLanding;
  window.__SET_CURRENT_PAGE__ = setCurrentPage;
  window.__SET_RIGHT_DRAWER_MODE__ = setRightDrawerMode;

  const handleBackToLanding = () => {
    // Non-destructive: retain custom designs in session so returning to studio keeps work intact
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAnimationMode('static');
      sceneManagerRef.current.setCameraPreset('front', true);
    }
    setAnimationMode('static');
    setInteractionMode('orbit');
    setCurrentPage('landing');
  };
  window.__HANDLE_BACK_TO_LANDING__ = handleBackToLanding;

  const handleToggleZoom = async () => {
    const next = !isZoomed;
    setIsZoomed(next);
    if (sceneManagerRef.current) {
      await sceneManagerRef.current.setZoom(next);
    }
    return next;
  };

  const handleSetZoom = async (zoomed) => {
    const val = Boolean(zoomed);
    setIsZoomed(val);
    if (sceneManagerRef.current) {
      await sceneManagerRef.current.setZoom(val);
    }
    return val;
  };
  window.__TOGGLE_ZOOM__ = handleToggleZoom;
  window.__SET_ZOOM__ = handleSetZoom;
  window.__IS_ZOOMED__ = () => isZoomed;

  const handleZoomIn = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.zoomIn(2.0);
    }
  };

  const handleZoomOut = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.zoomOut(2.0);
    }
  };

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
    if (mode !== 'none') {
      // Requirement 4: When camera animation is activated, garment animation is set to static
      setAnimationMode('static');
      if (sceneManagerRef.current) {
        sceneManagerRef.current.setAnimationMode('static');
      }
    }
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

    // Requirement 4: When animation is on, camera animation should be off.
    // Requirement 5: When static clicked, from the above menu bar, all animation, camera animation should be off.
    setCameraAnimationMode('none');
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraAnimationMode('none');
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
    if (view === 'zoom') {
      handleToggleZoom();
      return;
    }
    const targetSide = (view === 'chest') ? 'front' : view;
    setCurrentCamera(targetSide);
    if (targetSide === 'front' || targetSide === 'back') {
      setActiveSide(targetSide);
    }
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(targetSide, isZoomed);
    }
  };

  const handleSideChange = (side) => {
    setActiveSide(side);
    setCurrentCamera(side);
    if (sceneManagerRef.current && viewMode === '3d') {
      sceneManagerRef.current.setCameraPreset(side, isZoomed);
    }
  };
  window.__SET_ACTIVE_SIDE__ = handleSideChange;

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

    // Security Check 1 (SEC-01): Enforce 15MB file size ceiling
    if (file.size > 15 * 1024 * 1024) {
      alert('File too large (Max 15MB allowed)');
      e.target.value = '';
      return;
    }

    // Security Check 2 (SEC-02): Restrict MIME types to safe raster formats
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid format. Please upload PNG, JPG, or WebP');
      e.target.value = '';
      return;
    }

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
        setRightDrawerMode('design');
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
      
      {/* Hidden Global File Input (SEC-02: Restricted to safe raster images) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
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

      {/* 3D WebGL Canvas Viewport (Active in 3D Mode in Studio - WCAG 2.1 AA Accessible) */}
      <div
        ref={containerRef}
        role="region"
        aria-label="Interactive 3D garment customization studio displaying active streetwear model"
        tabIndex={0}
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0 focus:outline-none ${
          currentPage === 'studio' && viewMode === '3d' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 3D Viewport Mobile Touch Hint Pill (Swipe to rotate • Pinch to zoom) */}
      {currentPage === 'studio' && viewMode === '3d' && (
        <div className="md:hidden absolute top-18 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10 animate-fadeIn">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-studio-900/70 backdrop-blur-md border border-studio-800 text-[10px] font-semibold text-studio-300 shadow-lg">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Swipe to rotate • Pinch to zoom</span>
          </div>
        </div>
      )}

      {/* Flat Studio View (Active when user chooses 2D mode in Studio) */}
      {currentPage === 'studio' && viewMode === '2d' && (
        <StaticGarmentView
          garmentType={garmentType}
          garmentColor={garmentColor}
          designManager={designManager}
          sceneManager={sceneManagerRef.current}
          onSwitchTo3D={() => setViewMode('3d')}
          backdropMode={backdropMode}
          activeSide={activeSide}
          onSideChange={handleSideChange}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenExport={handleOpenExport}
        />
      )}

      {/* Loading Overlay (Initial Studio Load) */}
      {currentPage === 'studio' && !isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121318] z-50 text-white select-none">
          <div className="size-12 rounded-full border-4 border-white/20 border-t-[#4f46e5] animate-spin mb-4" />
          <h2 className="text-base font-bold tracking-wide">Loading {garmentNameMap[garmentType] || '3D Garment'}...</h2>
          <p className="text-xs text-gray-400 mt-1">Preparing photorealistic streetwear model</p>
        </div>
      )}

      {/* Garment Switching Loader Overlay */}
      {currentPage === 'studio' && isLoaded && isGarmentLoading && viewMode === '3d' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-40 text-white select-none pointer-events-auto transition-all duration-200">
          <div className="flex flex-col items-center bg-white/95 dark:bg-studio-900/95 border border-gray-200/90 dark:border-studio-700/80 px-8 py-6 rounded-3xl shadow-2xl backdrop-blur-xl max-w-sm mx-4 text-center animate-fadeIn">
            <div className="relative flex items-center justify-center mb-4">
              <div className="size-16 rounded-full border-3 border-gray-200 dark:border-studio-800 border-t-brand-500 border-r-indigo-500 animate-spin" />
              <div className="absolute size-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Shirt className="size-4 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold tracking-wide uppercase text-gray-900 dark:text-white flex items-center gap-2 justify-center">
                <span>Loading {garmentNameMap[pendingGarmentType || garmentType] || 'Garment'}</span>
                <span className="size-2 rounded-full bg-brand-500 animate-ping" />
              </h3>
              <p className="text-xs text-gray-500 dark:text-studio-400">
                Preparing photorealistic 3D model & fabrics...
              </p>
            </div>

            <div className="w-44 h-1.5 bg-gray-200 dark:bg-studio-800 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full w-full animate-pulse" />
            </div>
          </div>
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
              isZoomed={isZoomed}
              onToggleZoom={handleToggleZoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              animationMode={animationMode}
              onAnimationModeChange={handleAnimationModeChange}
              onToggleTurntable={() => handleAnimationModeChange(animationMode === 'turntable' ? 'static' : 'turntable')}
              cameraAnimationMode={cameraAnimationMode}
              positionGuideOpen={rightDrawerMode === 'design'}
              onTogglePositionGuide={() => setRightDrawerMode(rightDrawerMode === 'design' ? null : 'design')}
              onOpenExport={handleOpenExport}
              onBackToLanding={handleBackToLanding}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              theme={theme}
              onToggleTheme={toggleTheme}
              onUndo={() => designManager?.undo?.()}
              onRedo={() => designManager?.redo?.()}
              canUndo={Boolean(designManager?.canUndo?.())}
              canRedo={Boolean(designManager?.canRedo?.())}
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
            currentCamera={currentCamera}
            onCameraChange={handleCameraChange}
            isZoomed={isZoomed}
            onToggleZoom={handleToggleZoom}
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
        activeSide={activeSide}
        onSideChange={handleSideChange}
        isExportStudioOpen={rightDrawerMode === 'export'}
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

      {/* Right Floating Export Panel (Zero option of Design Studio while exporting) */}
      <ExportPanel
        isOpen={rightDrawerMode === 'export'}
        onClose={() => setRightDrawerMode(null)}
        defaultTab={exportTab}
        sceneManager={sceneManagerRef.current}
        backdropMode={backdropMode}
        asyncExportState={asyncExportState}
        setAsyncExportState={setAsyncExportState}
      />

      {/* Studio Video Capture Loader Overlay (Guarantees unhindered 60 FPS recording) */}
      {asyncExportState.isRecording && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm select-none pointer-events-auto animate-fadeIn text-white">
          <div className="flex flex-col items-center bg-white/95 dark:bg-studio-900/95 border border-gray-200/90 dark:border-studio-700/80 px-8 py-7 rounded-3xl shadow-2xl backdrop-blur-xl max-w-sm sm:max-w-md mx-4 text-center">
            <div className="relative flex items-center justify-center mb-4">
              <div className="size-16 rounded-full border-4 border-gray-200 dark:border-studio-800 border-t-red-500 border-r-rose-500 animate-spin" />
              <div className="absolute size-9 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/40">
                <Video className="size-4 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <span>Recording Studio Video</span>
                <span className="size-2 rounded-full bg-red-500 animate-ping" />
              </h3>
              <p className="text-xs text-gray-500 dark:text-studio-400">
                Preserving active animation, zoom, speed & background at 60 FPS
              </p>
            </div>

            <div className="w-56 sm:w-64 mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-700 dark:text-studio-300">
                <span>{asyncExportState.progress}%</span>
                <span>{asyncExportState.elapsedSec.toFixed(1)}s / {asyncExportState.duration}s</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-studio-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-100"
                  style={{ width: `${asyncExportState.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Async Video Export Download Success Toast */}
      {asyncExportState.status === 'complete' && asyncExportState.fileName && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl animate-fadeIn">
          <CheckCircle className="size-4 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight">Video Export Complete!</span>
            <span className="text-[10px] opacity-90 font-mono truncate max-w-[200px]">{asyncExportState.fileName}</span>
          </div>
        </div>
      )}

      {/* Dedicated Mobile Bottom Action Dock (Persistent across 3D and 2D Studio modes) */}
      {currentPage === 'studio' && (
        <MobileBottomNav
          interactionMode={interactionMode}
          onInteractionModeChange={handleInteractionModeChange}
          currentCamera={currentCamera}
          onCameraChange={handleCameraChange}
          isZoomed={isZoomed}
          onToggleZoom={handleToggleZoom}
          animationMode={animationMode}
          onAnimationModeChange={handleAnimationModeChange}
          rightDrawerMode={rightDrawerMode}
          onToggleDesignGuide={() => setRightDrawerMode(rightDrawerMode === 'design' ? null : 'design')}
          onOpenExport={handleOpenExport}
          garmentType={garmentType}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedSide={activeSide}
          onSideChange={handleSideChange}
        />
      )}

      {/* On-Canvas Graphic Transform HUD (Active when in Drag Design mode in 3D Studio; placed at top on mobile to avoid bottom HUD collision) */}
      {viewMode === '3d' && interactionMode === 'dragDesign' && designManager && (
        <div className="fixed top-20 md:top-auto md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 dark:bg-studio-900/95 backdrop-blur-xl px-4 py-2 rounded-2xl border border-gray-200/90 dark:border-studio-700 shadow-2xl text-xs select-none animate-fadeIn">
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
