import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, X, Check, Download, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

export function PositionGuide({
  isOpen,
  onClose,
  onOpenExport,
  designManager,
  currentGarmentType = 'oversized_tee',
  selectedSide: propSide = 'front',
  onSideChange,
  onTriggerUpload,
  onTriggerUploadFront,
  onTriggerUploadBack,
  onCameraChange
}) {
  const [selectedSide, setSelectedSide] = useState(propSide || 'front'); // 'front' | 'back'
  const [garmentColor, setGarmentColor] = useState('#ffffff');
  const [penStrokeWidth, setPenStrokeWidth] = useState(1);
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('Roboto');
  const [textInput, setTextInput] = useState('VIRTUAL THREADS');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Layers list and drag/resize state
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mobile 3-Stage Draggable Bottom Sheet: 'peek' (18vh), 'half' (46vh default), 'full' (85vh)
  const [sheetStage, setSheetStage] = useState('half');
  window.__SET_SHEET_STAGE__ = setSheetStage;
  const touchStartYRef = useRef(null);
  const touchCurrentYRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSheetStage('half');
    }
  }, [isOpen]);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartYRef.current = e.touches[0].clientY;
      touchCurrentYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      touchCurrentYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null || touchCurrentYRef.current === null) return;
    const deltaY = touchCurrentYRef.current - touchStartYRef.current;
    const threshold = 35;

    if (deltaY > threshold) {
      // Swiped downward
      if (sheetStage === 'full') {
        setSheetStage('half');
      } else if (sheetStage === 'half') {
        setSheetStage('peek');
      } else if (sheetStage === 'peek') {
        onClose();
      }
    } else if (deltaY < -threshold) {
      // Swiped upward
      if (sheetStage === 'peek') {
        setSheetStage('half');
      } else if (sheetStage === 'half') {
        setSheetStage('full');
      }
    }
    touchStartYRef.current = null;
    touchCurrentYRef.current = null;
  };

  // Synchronize with external propSide changes
  useEffect(() => {
    if (propSide && propSide !== selectedSide) {
      setSelectedSide(propSide);
    }
  }, [propSide]);

  const fileInputRef = useRef(null);
  const garmentColorInputRef = useRef(null);
  const textColorInputRef = useRef(null);
  const textInputRef = useRef(null);
  const containerRef = useRef(null);
  const activeIdRef = useRef(null);

  // Sync state with designManager
  useEffect(() => {
    if (!designManager) return;

    const syncState = () => {
      setLayers([...designManager.layers]);
      if (designManager.garmentColor) {
        setGarmentColor(designManager.garmentColor);
      }
      const active = designManager.getActiveLayer();
      if (active) {
        setActiveLayerId(active.id);
        setSelectedSide(active.side || 'front');
        if (active.id !== activeIdRef.current) {
          activeIdRef.current = active.id;
          if (active.type === 'text') {
            setTextInput(active.text || 'VIRTUAL THREADS');
            setTextColor(active.textColor || '#000000');
            setFontSize(active.fontSize || 12);
            setFontFamily(active.fontFamily || 'Roboto');
          }
        }
      } else {
        setActiveLayerId(null);
        activeIdRef.current = null;
      }
    };

    syncState();
    const unsubscribe = designManager.subscribe(syncState);
    return () => unsubscribe();
  }, [designManager]);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || null;

  // Trigger feedback banner
  const showFeedback = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(''), 2500);
  };

  // Garment base color handler
  const handleGarmentColorChange = (e) => {
    const color = e.target.value;
    setGarmentColor(color);
    if (designManager) {
      designManager.setGarmentColor(color);
    }
  };

  // Text layer handler
  const handleAddText = () => {
    if (!designManager) return;
    const centerX = selectedSide === 'back' ? 1528 : 480;
    const textToAdd = textInput.trim() || 'CUSTOM TEXT';
    const newLayer = designManager.addLayer({
      type: 'text',
      side: selectedSide,
      text: textToAdd,
      textColor: textColor,
      fontSize: fontSize || 12,
      fontFamily: fontFamily,
      x: centerX,
      y: 920,
      scale: 1.0,
      rotation: 0,
      printType: 'screen'
    });
    if (newLayer) {
      setActiveLayerId(newLayer.id);
      showFeedback('Text decal added • Double click design on garment to move/resize');
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  };

  // Live text input editing for selected text layer
  const handleTextChange = (e) => {
    const val = e.target.value;
    setTextInput(val);
    if (designManager && activeLayerId) {
      const active = designManager.getActiveLayer();
      if (active && active.type === 'text') {
        designManager.updateLayer(activeLayerId, { text: val });
      }
    }
  };

  const handleTextColorChange = (e) => {
    const color = e.target.value;
    setTextColor(color);
    if (designManager && activeLayerId) {
      designManager.updateLayer(activeLayerId, { textColor: color });
    }
  };

  // Font size handler: exact point size without jumping
  const handleFontSizeChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setFontSize('');
      return;
    }
    const sz = Math.max(1, Math.min(120, parseInt(raw, 10) || 12));
    setFontSize(sz);
    if (designManager && activeLayerId) {
      const active = designManager.getActiveLayer();
      if (active && active.type === 'text') {
        designManager.updateLayer(activeLayerId, { fontSize: sz });
      }
    }
  };

  const handleFontFamilyChange = (e) => {
    const family = e.target.value;
    setFontFamily(family);
    if (designManager && activeLayerId) {
      designManager.updateLayer(activeLayerId, { fontFamily: family });
    }
  };

  // File Upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !designManager) return;

    // Security Check 1 (SEC-01): Enforce 15MB file size ceiling (Client DoS defense)
    if (file.size > 15 * 1024 * 1024) {
      showFeedback('File too large (Max 15MB allowed)');
      e.target.value = '';
      return;
    }

    // Security Check 2 (SEC-02): Restrict MIME types to safe raster formats (SVG/XSS defense)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showFeedback('Invalid format. Please upload PNG, JPG, or WebP');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const centerX = selectedSide === 'back' ? 1528 : 480;
        const newLayer = designManager.addLayer({
          type: 'image',
          side: selectedSide,
          image: img,
          x: centerX,
          y: 920,
          scale: 1.0,
          rotation: 0,
          printType: 'screen'
        });
        if (newLayer) {
          setActiveLayerId(newLayer.id);
          showFeedback('Design uploaded • Double click design on garment to move/resize');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save Layout to localStorage
  const handleSaveLayout = () => {
    if (!designManager || designManager.layers.length === 0) {
      showFeedback('No design layers to save');
      return;
    }

    try {
      const serialized = designManager.layers.map((l) => ({
        id: l.id,
        type: l.type,
        side: l.side,
        text: l.text,
        textColor: l.textColor,
        fontSize: l.fontSize,
        fontFamily: l.fontFamily,
        x: l.x,
        y: l.y,
        scale: l.scale,
        rotation: l.rotation,
        opacity: l.opacity,
        printType: l.printType,
        imgSrc: typeof l.image === 'string' ? l.image : (l.image?.src || null)
      }));

      localStorage.setItem('virtualthreads_saved_layout', JSON.stringify(serialized));
      showFeedback('Layout saved to studio');
    } catch (err) {
      console.warn('Could not save layout:', err);
      const isQuota = err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014;
      showFeedback(isQuota ? 'Storage quota exceeded (image too large)' : 'Failed to save layout locally');
    }
  };

  // Load Layout from localStorage with Schema Validation & Bounds-Checking (SEC-05)
  const handleLoadLayout = () => {
    if (!designManager) return;

    try {
      const saved = localStorage.getItem('virtualthreads_saved_layout');
      if (!saved) {
        showFeedback('No saved layout found');
        return;
      }

      let layersData;
      try {
        layersData = JSON.parse(saved);
      } catch (parseErr) {
        showFeedback('Corrupt saved layout data');
        return;
      }

      if (!Array.isArray(layersData)) {
        showFeedback('Invalid layout format');
        return;
      }

      // Security Schema Validation & Bounds-Checking (SEC-05)
      const validLayers = layersData.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        if (item.type !== 'text' && item.type !== 'image') return false;
        const validSide = item.side === 'front' || item.side === 'back';
        if (!validSide) return false;
        if (typeof item.x === 'number' && !Number.isFinite(item.x)) return false;
        if (typeof item.y === 'number' && !Number.isFinite(item.y)) return false;
        if (typeof item.scale === 'number' && (item.scale < 0.05 || item.scale > 10 || !Number.isFinite(item.scale))) return false;
        if (typeof item.rotation === 'number' && !Number.isFinite(item.rotation)) return false;
        if (item.type === 'text' && (typeof item.text !== 'string' || item.text.length > 500)) return false;
        if (item.type === 'image' && item.imgSrc && typeof item.imgSrc === 'string') {
          if (!item.imgSrc.startsWith('data:image/') && !item.imgSrc.startsWith('blob:') && !item.imgSrc.startsWith('http://') && !item.imgSrc.startsWith('https://') && !item.imgSrc.startsWith('/')) {
            return false;
          }
        }
        return true;
      });

      if (validLayers.length === 0 && layersData.length > 0) {
        showFeedback('Layout failed security validation');
        return;
      }

      designManager.clearLayers();

      validLayers.forEach((layerItem) => {
        const side = layerItem.side || 'front';
        const x = Number.isFinite(layerItem.x) ? Math.max(0, Math.min(2048, layerItem.x)) : (side === 'back' ? 1528 : 480);
        const y = Number.isFinite(layerItem.y) ? Math.max(0, Math.min(2048, layerItem.y)) : 800;
        const scale = Number.isFinite(layerItem.scale) ? Math.max(0.1, Math.min(5.0, layerItem.scale)) : 1.0;
        const rotation = Number.isFinite(layerItem.rotation) ? layerItem.rotation % 360 : 0;

        if (layerItem.type === 'text') {
          designManager.addLayer({
            type: 'text',
            side: side,
            text: String(layerItem.text || 'VIRTUAL THREADS').slice(0, 100),
            textColor: String(layerItem.textColor || '#000000').slice(0, 30),
            fontSize: Math.max(1, Math.min(120, parseInt(layerItem.fontSize, 10) || 12)),
            fontFamily: String(layerItem.fontFamily || 'Roboto').slice(0, 50),
            x: x,
            y: y,
            scale: scale,
            rotation: rotation,
            printType: layerItem.printType === 'puff' ? 'puff' : 'screen'
          });
        } else if (layerItem.type === 'image' && layerItem.imgSrc) {
          const img = new Image();
          img.onload = () => {
            designManager.addLayer({
              type: 'image',
              side: side,
              image: img,
              x: x,
              y: y,
              scale: scale,
              rotation: rotation,
              printType: layerItem.printType === 'puff' ? 'puff' : 'screen'
            });
          };
          img.src = layerItem.imgSrc;
        }
      });

      showFeedback('Layout restored');
    } catch (err) {
      console.error('Error loading layout:', err);
      showFeedback('Could not load layout');
    }
  };

  // Reset Canvas Layout
  const handleResetLayout = () => {
    if (!designManager) return;
    designManager.clearLayers();
    setActiveLayerId(null);
    showFeedback('Canvas cleared');
  };

  // Drag interaction handlers mapped to 2048x2048 coordinate space
  const handlePointerDownLayer = (e, layerId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!designManager) return;

    designManager.setActiveLayer(layerId);
    setActiveLayerId(layerId);

    const layer = designManager.layers.find((l) => l.id === layerId);
    if (!layer) return;

    if (layer.side && layer.side !== selectedSide) {
      setSelectedSide(layer.side);
      if (onCameraChange) onCameraChange(layer.side);
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    setIsDragging(true);
    setDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
      layerId: layerId
    });
  };

  // Resize interaction handlers for corner handles
  const handlePointerDownResize = (e, layerId, corner) => {
    e.preventDefault();
    e.stopPropagation();
    if (!designManager) return;

    const layer = designManager.layers.find((l) => l.id === layerId);
    if (!layer) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    setIsResizing(true);
    setResizeStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      startScale: layer.scale || 1.0,
      layerId: layerId,
      corner: corner
    });
  };

  const handlePointerMove = useCallback((e) => {
    if (isResizing && resizeStart && designManager) {
      e.preventDefault();
      const deltaX = e.clientX - resizeStart.pointerX;
      const deltaY = e.clientY - resizeStart.pointerY;

      let factor = 0;
      if (resizeStart.corner === 'br') factor = deltaX + deltaY;
      else if (resizeStart.corner === 'tl') factor = -deltaX - deltaY;
      else if (resizeStart.corner === 'tr') factor = deltaX - deltaY;
      else if (resizeStart.corner === 'bl') factor = -deltaX + deltaY;

      const scaleChange = factor * 0.008;
      const newScale = Math.max(0.2, Math.min(3.5, resizeStart.startScale + scaleChange));

      designManager.updateLayer(resizeStart.layerId, {
        scale: parseFloat(newScale.toFixed(2))
      });
      return;
    }

    if (!isDragging || !dragStart || !designManager || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const scaleFactorX = 2048 / rect.width;
    const scaleFactorY = 2048 / rect.height;

    const deltaX = (e.clientX - dragStart.pointerX) * scaleFactorX;
    const deltaY = (e.clientY - dragStart.pointerY) * scaleFactorY;

    let newX = Math.round(dragStart.layerX + deltaX);
    let newY = Math.round(dragStart.layerY + deltaY);

    // Keep coordinates within garment SVG bounds
    newX = Math.max(100, Math.min(1948, newX));
    newY = Math.max(400, Math.min(1948, newY));

    // Determine side automatically based on X coordinate
    const targetSide = newX > 1024 ? 'back' : 'front';

    designManager.updateLayer(dragStart.layerId, {
      x: newX,
      y: newY,
      side: targetSide
    });
  }, [isDragging, dragStart, isResizing, resizeStart, designManager]);

  const handlePointerUp = useCallback((e) => {
    if (isResizing) {
      try {
        e.currentTarget?.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setIsResizing(false);
      setResizeStart(null);
      if (designManager && designManager.flush) {
        designManager.flush();
      }
    }
    if (isDragging) {
      try {
        e.currentTarget?.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setIsDragging(false);
      setDragStart(null);
      if (designManager && designManager.flush) {
        designManager.flush();
      }
    }
  }, [isDragging, isResizing, designManager]);

  // Click on canvas to move or place active layer
  const handleCanvasClick = (e) => {
    if (!designManager || !containerRef.current || isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleFactorX = 2048 / rect.width;
    const scaleFactorY = 2048 / rect.height;

    const clickX = Math.round((e.clientX - rect.left) * scaleFactorX);
    const clickY = Math.round((e.clientY - rect.top) * scaleFactorY);

    const targetSide = clickX > 1024 ? 'back' : 'front';
    setSelectedSide(targetSide);
    if (onCameraChange) onCameraChange(targetSide);

    if (activeLayerId) {
      designManager.updateLayer(activeLayerId, {
        x: clickX,
        y: clickY,
        side: targetSide
      });
    }
  };

  if (!isOpen) return null;

  return (
    <aside 
      id="position-guide-sheet"
      className={`fixed bottom-20 left-0 right-0 sm:absolute sm:right-6 sm:top-20 sm:bottom-6 sm:left-auto ${
        isExpanded ? 'w-full sm:w-[480px] md:w-[520px]' : 'w-full sm:w-[330px] md:w-[350px]'
      } max-w-full sm:max-w-[calc(100vw-24px)] ${
        sheetStage === 'peek'
          ? 'h-[16vh] max-h-[16vh]'
          : sheetStage === 'half'
          ? 'h-[44vh] max-h-[44vh]'
          : 'h-[calc(100vh-140px)] max-h-[calc(100vh-140px)]'
      } sm:h-auto sm:max-h-[calc(100vh-84px)] bg-white dark:bg-studio-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/90 dark:border-studio-700/80 mx-2 sm:mx-0 flex flex-col overflow-hidden select-none z-30 transition-all duration-300 animate-fadeIn`}
    >
      {/* Mobile Draggable Gesture Target Handle */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full pt-2 pb-1.5 px-4 sm:hidden flex flex-col items-center justify-center shrink-0 cursor-grab active:cursor-grabbing bg-[#f8f9fa] dark:bg-studio-850 border-b border-gray-100 dark:border-studio-800 touch-none select-none"
      >
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-studio-600 rounded-full mx-auto mb-1.5" />
        <div className="flex items-center justify-between w-full text-[10px] font-bold text-gray-400 dark:text-studio-400">
          <span className="flex items-center gap-1.5 text-gray-700 dark:text-studio-200 font-extrabold uppercase">
            <span>Design Studio</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-500 font-mono">
              {sheetStage.toUpperCase()}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSheetStage('peek')}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${
                sheetStage === 'peek' ? 'bg-brand-500 text-white' : 'bg-gray-200/80 dark:bg-studio-750 text-gray-600 dark:text-studio-300'
              }`}
            >
              Peek 18%
            </button>
            <button
              type="button"
              onClick={() => setSheetStage('half')}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${
                sheetStage === 'half' ? 'bg-brand-500 text-white' : 'bg-gray-200/80 dark:bg-studio-750 text-gray-600 dark:text-studio-300'
              }`}
            >
              Half 45%
            </button>
            <button
              type="button"
              onClick={() => setSheetStage('full')}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${
                sheetStage === 'full' ? 'bg-brand-500 text-white' : 'bg-gray-200/80 dark:bg-studio-750 text-gray-600 dark:text-studio-300'
              }`}
            >
              Full 85%
            </button>
          </div>
        </div>
      </div>
      
      {/* Hidden File Input for Design Upload (SEC-02: Restricted to safe raster images) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden Color Picker Inputs */}
      <input
        ref={garmentColorInputRef}
        type="color"
        value={garmentColor}
        onChange={handleGarmentColorChange}
        className="hidden"
      />
      <input
        ref={textColorInputRef}
        type="color"
        value={textColor}
        onChange={handleTextColorChange}
        className="hidden"
      />

      {/* Stage 1 Peek View (18% height on mobile): Quick layer switch & garment color while seeing 82% of 3D model */}
      {sheetStage === 'peek' && (
        <div className="flex-1 flex items-center justify-between px-3.5 py-1 overflow-x-auto gap-2 sm:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => garmentColorInputRef.current?.click()}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              title="Change Garment Color"
            >
              <div
                className="size-7 rounded-full border border-gray-300 dark:border-studio-600 shadow-sm"
                style={{ backgroundColor: garmentColor }}
              />
            </button>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setActiveLayerId(l.id);
                    if (designManager) designManager.setActiveLayer(l.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    l.id === activeLayerId
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-studio-800 text-gray-700 dark:text-studio-300'
                  }`}
                >
                  {l.type === 'text' ? (l.text || 'Text') : 'Graphic'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSheetStage('half')}
              className="px-3 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold shadow-sm"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Toolbar Rows (Always rendered in Half and Full stages, and on desktop) */}
      <div className={`flex flex-col shrink-0 ${sheetStage === 'peek' ? 'hidden sm:flex' : 'flex'}`}>
        {/* ROW 1: Orange Pill | Pen Icon | Color Swatch (44px target) | Number Input (44px target) | Close (x) */}
        <div className="flex items-center justify-between px-3.5 pt-2.5 pb-2 bg-[#f8f9fa] dark:bg-studio-850 border-b border-gray-100 dark:border-studio-750">
          <div className="flex items-center gap-2">
            {/* Orange Vertical Accent Pill */}
            <div className="w-1.5 h-6 rounded-full bg-[#f97316] shrink-0" />

            {/* Stylus Tool Icon (Min 44px hit target on mobile) */}
            <button 
              type="button" 
              className="min-w-[36px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-0.5 text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors flex items-center justify-center"
              title="Garment & Drawing Tools"
            >
              <Pencil className="size-4 sm:size-3.5 stroke-[2.2]" />
            </button>

            {/* Garment / Draw Color Swatch (Min 44px x 44px tap zone per Apple/Google guidelines) */}
            <button
              type="button"
              onClick={() => garmentColorInputRef.current?.click()}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer shrink-0 group"
              title="Change Garment Color"
            >
              <div
                className="size-6 sm:size-5.5 rounded-full border border-gray-300 dark:border-studio-600 shadow-sm overflow-hidden group-hover:scale-110 transition-transform"
                style={{ backgroundColor: garmentColor }}
              />
            </button>

            {/* Numeric Input Display (Layer / Stroke - Min 44px height tap target on mobile) */}
            <input
              type="number"
              value={penStrokeWidth}
              onChange={(e) => setPenStrokeWidth(parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              className="w-11 h-11 sm:w-9 sm:h-6.5 px-1 text-xs sm:text-[11px] font-semibold text-gray-800 dark:text-white bg-white dark:bg-studio-800 border border-gray-300 dark:border-studio-700 rounded-lg sm:rounded shadow-2xs text-center focus:outline-none focus:border-gray-500"
              title="Stroke Width / Layer Index"
            />
          </div>

          <div className="flex items-center gap-1">
            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="min-h-[44px] sm:min-h-0 sm:h-6 px-2.5 py-1 sm:py-0.5 rounded-xl sm:rounded-md text-xs sm:text-[11px] font-bold text-indigo-600 dark:text-brand-400 hover:bg-indigo-50 dark:hover:bg-brand-500/20 border border-indigo-200 dark:border-brand-500/30 transition-all flex items-center gap-1 shadow-2xs active:scale-95"
                title="Switch to Export Studio (Video & 4K Snapshots)"
              >
                <Download className="size-3 sm:size-2.5" />
                <span>Export</span>
              </button>
            )}

            {/* Expand / Minimize Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="min-w-[40px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1 rounded-lg sm:rounded-md hover:bg-gray-200/60 dark:hover:bg-studio-800 flex items-center justify-center"
              title={isExpanded ? "Collapse to Standard Width" : "Expand to Wide Canvas"}
            >
              {isExpanded ? <Minimize2 className="size-4 sm:size-3.5" /> : <Maximize2 className="size-4 sm:size-3.5" />}
            </button>

            {/* Close Button (x) (Min 44px tap zone on mobile) */}
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1 rounded-lg sm:rounded-md hover:bg-gray-200/60 dark:hover:bg-studio-800 flex items-center justify-center"
              title="Close Position Guide"
            >
              <X className="size-4 sm:size-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ROW 2: Add Text Button | Text Input Box | Text Color Swatch | Font Size | Font Family Dropdown */}
        <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f8f9fa] dark:bg-studio-850 border-b border-gray-100 dark:border-studio-750 flex-nowrap">
          {/* Add Text Pill Button */}
          <button
            type="button"
            onClick={handleAddText}
            className="min-h-[44px] sm:min-h-0 sm:h-6.5 px-3 sm:px-2.5 py-1 text-xs sm:text-[11px] font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-studio-800 border border-gray-300 dark:border-studio-700 rounded-xl sm:rounded shadow-2xs hover:bg-gray-50 dark:hover:bg-studio-750 active:scale-95 transition-all shrink-0 flex items-center justify-center"
          >
            Add Text
          </button>

          {/* Input box for typing custom text */}
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddText();
            }}
            placeholder="Enter text..."
            className="flex-1 min-w-[70px] min-h-[44px] sm:min-h-0 sm:h-6.5 px-2.5 sm:px-2 text-xs sm:text-[11px] font-medium text-gray-900 dark:text-white bg-white dark:bg-studio-800 border border-gray-300 dark:border-studio-700 rounded-xl sm:rounded shadow-2xs placeholder:text-gray-400 dark:placeholder:text-studio-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
            title="Type text to add or edit"
          />

          {/* Circular Text Color Swatch (Min 44px tap target) */}
          <button
            type="button"
            onClick={() => textColorInputRef.current?.click()}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer shrink-0 group"
            title="Change Text Color"
          >
            <div
              className="size-6 sm:size-5.5 rounded-full border border-gray-300 dark:border-studio-600 shadow-sm overflow-hidden group-hover:scale-110 transition-transform"
              style={{ backgroundColor: textColor }}
            />
          </button>

          {/* Numeric Font Size Input */}
          <input
            type="number"
            value={fontSize}
            onChange={handleFontSizeChange}
            min="1"
            max="120"
            className="w-11 h-11 sm:w-9 sm:h-6.5 px-0.5 text-xs sm:text-[11px] font-semibold text-gray-800 dark:text-white bg-white dark:bg-studio-800 border border-gray-300 dark:border-studio-700 rounded-lg sm:rounded shadow-2xs text-center focus:outline-none focus:border-gray-500 shrink-0"
            title="Font Size"
          />

          {/* Font Family Select Dropdown */}
          <select
            value={fontFamily}
            onChange={handleFontFamilyChange}
            className="h-11 sm:h-6.5 px-2 sm:px-1 text-xs sm:text-[11px] font-medium text-gray-800 dark:text-white bg-white dark:bg-studio-800 border border-gray-300 dark:border-studio-700 rounded-lg sm:rounded shadow-2xs focus:outline-none focus:border-gray-500 cursor-pointer w-22 sm:w-20 shrink-0"
            title="Font Family"
          >
            <option value="Roboto">Roboto</option>
            <option value="Inter">Inter</option>
            <option value="Bebas Neue">Bebas</option>
            <option value="Impact">Impact</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Courier New">Courier</option>
          </select>
        </div>

        {/* ROW 3: Upload Design Button | Save Layout | Load Layout | Reset */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#f8f9fa] dark:bg-studio-850 border-b border-gray-200 dark:border-studio-750">
          {/* Solid Dark Navy Pill Upload Button */}
          <button
            type="button"
            onClick={() => {
              if (onTriggerUpload) {
                onTriggerUpload();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="min-h-[44px] sm:min-h-0 sm:h-7 px-4 sm:px-3 rounded-full bg-[#0a0f1d] hover:bg-[#1a233a] dark:bg-brand-600 dark:hover:bg-brand-500 text-white text-xs sm:text-[11px] font-bold shadow transition-all active:scale-95 shrink-0 flex items-center justify-center"
          >
            Upload Design
          </button>

          {/* Action Text Links & History Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-[11px] font-medium text-gray-600 dark:text-studio-400">
            <button
              type="button"
              disabled={!designManager?.canUndo?.()}
              onClick={() => {
                if (designManager?.undo?.()) {
                  showFeedback('Undone (Ctrl+Z)');
                }
              }}
              className="min-w-[36px] min-h-[44px] sm:min-w-0 sm:min-h-0 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors px-1 py-0.5 font-bold flex items-center justify-center"
              title="Undo last change (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              type="button"
              disabled={!designManager?.canRedo?.()}
              onClick={() => {
                if (designManager?.redo?.()) {
                  showFeedback('Redone (Ctrl+Shift+Z)');
                }
              }}
              className="min-w-[36px] min-h-[44px] sm:min-w-0 sm:min-h-0 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors px-1 py-0.5 font-bold flex items-center justify-center"
              title="Redo change (Ctrl+Shift+Z)"
            >
              Redo
            </button>
            <span className="text-gray-300 dark:text-studio-700">|</span>
            <button
              type="button"
              onClick={handleSaveLayout}
              className="min-w-[34px] min-h-[44px] sm:min-w-0 sm:min-h-0 hover:text-black dark:hover:text-white transition-colors px-1 py-0.5 flex items-center justify-center"
              title="Save layout layers"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleLoadLayout}
              className="min-w-[34px] min-h-[44px] sm:min-w-0 sm:min-h-0 hover:text-black dark:hover:text-white transition-colors px-1 py-0.5 flex items-center justify-center"
              title="Restore saved layout"
            >
              Load
            </button>
            <button
              type="button"
              onClick={handleResetLayout}
              className="min-w-[34px] min-h-[44px] sm:min-w-0 sm:min-h-0 hover:text-red-600 dark:hover:text-red-400 transition-colors px-1 py-0.5 flex items-center justify-center"
              title="Clear all graphics"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Transient Feedback Message Banner */}
        {feedbackMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-800/40 px-4 py-1.5 text-center text-xs font-semibold flex items-center justify-center gap-1.5 animate-fadeIn">
            <Check className="size-3.5" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* Stage 2 (Half - 45%): Live 3D Decal Adjustment Panel on mobile */}
      {sheetStage === 'half' && (
        <div className="flex-1 flex flex-col p-3 overflow-y-auto sm:hidden gap-2 bg-gray-50/70 dark:bg-studio-900/50">
          {/* Active Layer Quick Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Layer:</span>
            {layers.length === 0 ? (
              <span className="text-xs text-gray-400 italic">No decals added yet. Tap Add Text or Upload.</span>
            ) : (
              layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setActiveLayerId(l.id);
                    if (designManager) designManager.setActiveLayer(l.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    l.id === activeLayerId
                      ? 'bg-brand-500 text-white shadow-sm ring-1 ring-brand-400/40'
                      : 'bg-white dark:bg-studio-800 text-gray-700 dark:text-studio-300 border border-gray-200 dark:border-studio-700'
                  }`}
                >
                  {l.type === 'text' ? (l.text || 'Text') : 'Graphic'} ({l.side || 'front'})
                </button>
              ))
            )}
          </div>

          {activeLayer && (
            <div className="bg-white dark:bg-studio-800 p-2.5 rounded-2xl border border-gray-200/90 dark:border-studio-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300">Live Coordinate & Scale:</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono text-[11px]">
                  X: {activeLayer.x} | Y: {activeLayer.y} | {Math.round((activeLayer.scale || 1.0) * 100)}%
                </span>
              </div>

              {/* Nudge & Scale Buttons with full 44px tap targets */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (designManager && activeLayerId) {
                      const newX = (activeLayer.x || 1024) - 25;
                      designManager.updateLayer(activeLayerId, { x: newX });
                    }
                  }}
                  className="h-11 rounded-xl bg-gray-100 dark:bg-studio-700 hover:bg-gray-200 dark:hover:bg-studio-600 flex items-center justify-center font-bold text-xs"
                >
                  ← Left
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (designManager && activeLayerId) {
                      const newX = (activeLayer.x || 1024) + 25;
                      designManager.updateLayer(activeLayerId, { x: newX });
                    }
                  }}
                  className="h-11 rounded-xl bg-gray-100 dark:bg-studio-700 hover:bg-gray-200 dark:hover:bg-studio-600 flex items-center justify-center font-bold text-xs"
                >
                  Right →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (designManager && activeLayerId) {
                      const newY = (activeLayer.y || 1024) - 25;
                      designManager.updateLayer(activeLayerId, { y: newY });
                    }
                  }}
                  className="h-11 rounded-xl bg-gray-100 dark:bg-studio-700 hover:bg-gray-200 dark:hover:bg-studio-600 flex items-center justify-center font-bold text-xs"
                >
                  ↑ Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (designManager && activeLayerId) {
                      const newY = (activeLayer.y || 1024) + 25;
                      designManager.updateLayer(activeLayerId, { y: newY });
                    }
                  }}
                  className="h-11 rounded-xl bg-gray-100 dark:bg-studio-700 hover:bg-gray-200 dark:hover:bg-studio-600 flex items-center justify-center font-bold text-xs"
                >
                  Down ↓
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const targetSide = activeLayer.side === 'front' ? 'back' : 'front';
                    if (designManager && activeLayerId) {
                      designManager.updateLayer(activeLayerId, { side: targetSide });
                    }
                    setSelectedSide(targetSide);
                    if (onCameraChange) onCameraChange(targetSide);
                  }}
                  className="h-10 px-3 rounded-xl bg-gray-100 dark:bg-studio-700 text-xs font-bold text-gray-700 dark:text-studio-200 hover:bg-gray-200 dark:hover:bg-studio-600 flex items-center justify-center"
                >
                  Flip to {activeLayer.side === 'front' ? 'Back' : 'Front'}
                </button>
                <button
                  type="button"
                  onClick={() => setSheetStage('full')}
                  className="h-10 px-3 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-bold hover:bg-brand-500/25 flex items-center justify-center"
                >
                  Open 2D Schematic ↗
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN BODY: Centered Header + Authentic Flat Garment Schematic Canvas      */}
      {/* ========================================================================= */}
      <div className={`flex-1 flex-col bg-white dark:bg-studio-900 overflow-hidden p-3 sm:p-4 ${sheetStage === 'full' ? 'flex' : 'hidden sm:flex'}`}>
        
        {/* Light Gray Uppercase Title */}
        <div className="text-center font-extrabold text-xs sm:text-sm tracking-widest text-[#b8b8c2] dark:text-studio-500 uppercase py-1">
          POSITION GUIDE
        </div>

        {/* Responsive Pattern Viewport Outer Frame */}
        <div className="relative flex-1 w-full min-h-0 bg-white dark:bg-studio-850 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 dark:border-studio-750 p-1">
          <div 
            ref={containerRef}
            onClick={handleCanvasClick}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative aspect-square w-full h-full max-w-full max-h-full flex items-center justify-center cursor-crosshair touch-none select-none"
          >
            {/* Base Vector Pattern SVG (Collar Rib, Front Silhouette, Back Silhouette, Sleeves) */}
            <svg
              viewBox="0 0 2048 2048"
              className="w-full h-full block pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <style>{`
                  .pattern-panel { fill: #f5f5f7; stroke: #e0e0e6; stroke-width: 3.5; }
                  .pattern-label { fill: #b8b8c2; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 54px; font-weight: 800; letter-spacing: 5px; text-anchor: middle; dominant-baseline: middle; }
                  .pattern-sub { fill: #d0d0d8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 26px; font-weight: 600; letter-spacing: 3px; text-anchor: middle; dominant-baseline: middle; }
                  .pattern-center-dash { stroke: #dcdce2; stroke-width: 2.5; stroke-dasharray: 10,10; }
                `}</style>
              </defs>

              {/* Top Collar Rib Pieces (Calibrated: Front 480, Back 1528) */}
              <path className="pattern-panel" d="M 320 420 C 320 540, 640 540, 640 420 C 640 465, 320 465, 320 420 Z" />
              <path className="pattern-panel" d="M 1368 420 C 1368 480, 1688 480, 1688 420 C 1688 450, 1368 450, 1368 420 Z" />

              {/* FRONT PANEL (Calibrated 3D Seam Centerline at x=480) */}
              <path 
                className="pattern-panel" 
                d="
                  M 325 585
                  C 400 670, 560 670, 635 585
                  L 890 700
                  L 820 1020
                  L 765 1020
                  L 765 1580
                  L 195 1580
                  L 195 1020
                  L 140 1020
                  L 70 700
                  Z
                " 
              />

              {/* Front Center Line & Safe Area */}
              <line x1="480" y1="730" x2="480" y2="1240" className="pattern-center-dash" />
              <text x="480" y="960" className="pattern-label">FRONT</text>

              {/* BACK PANEL (Calibrated 3D Seam Centerline at x=1528) */}
              <path 
                className="pattern-panel" 
                d="
                  M 1373 605
                  C 1448 645, 1608 645, 1683 605
                  L 1938 700
                  L 1868 1020
                  L 1813 1020
                  L 1813 1580
                  L 1243 1580
                  L 1243 1020
                  L 1188 1020
                  L 1118 700
                  Z
                " 
              />

              {/* Back Center Line & Safe Area */}
              <line x1="1528" y1="730" x2="1528" y2="1240" className="pattern-center-dash" />
              <text x="1528" y="960" className="pattern-label">BACK</text>

              {/* Sleeves at Bottom (Calibrated Centers) */}
              <path className="pattern-panel" d="M 180 1710 L 780 1710 L 750 1960 L 210 1960 Z" />
              <path className="pattern-panel" d="M 1228 1710 L 1828 1710 L 1798 1960 L 1258 1960 Z" />
            </svg>

          {/* Interactive Decal Layers Rendered on top of 2048x2048 schematic */}
          <div className="absolute inset-0 pointer-events-none">
            {layers.map((layer) => {
              // Convert 2048-space coordinate into percentage
              const leftPercent = (layer.x / 2048) * 100;
              const topPercent = (layer.y / 2048) * 100;
              const isSelected = layer.id === activeLayerId;

              return (
                <div
                  key={layer.id}
                  onPointerDown={(e) => handlePointerDownLayer(e, layer.id)}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg) scale(${layer.scale || 1})`,
                    transformOrigin: 'center center'
                  }}
                  className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing group ${
                    isSelected ? 'ring-2 ring-brand-500 ring-offset-1 rounded' : 'hover:ring-1 hover:ring-gray-400 rounded'
                  }`}
                >
                  {layer.type === 'text' ? (
                    <div
                      style={{
                        color: layer.textColor || '#000000',
                        fontSize: `${Math.max(9, (layer.fontSize || 12) * 1.15)}px`,
                        fontFamily: layer.fontFamily || 'Roboto',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                      }}
                      className="px-2 py-0.5 select-none font-bold"
                    >
                      {layer.text || 'CUSTOM TEXT'}
                    </div>
                  ) : layer.image ? (
                    <img
                      src={layer.image.src}
                      alt="Decal"
                      style={{
                        width: 'clamp(50px, 12vw, 90px)',
                        height: 'clamp(50px, 12vw, 90px)',
                        objectFit: 'contain'
                      }}
                      className="pointer-events-none drop-shadow-md select-none"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-black/10 rounded flex items-center justify-center text-[10px] font-bold">
                      Decal
                    </div>
                  )}

                  {/* Transform Bounding Box & Interactive Corner Resize Handles */}
                  {isSelected && (
                    <div className="absolute -inset-2 border border-dashed border-brand-500 rounded pointer-events-none">
                      {/* Top-Left Resize Handle */}
                      <div
                        onPointerDown={(e) => handlePointerDownResize(e, layer.id, 'tl')}
                        className="absolute -top-1.5 -left-1.5 size-3 bg-white border-2 border-brand-500 rounded-full shadow-md cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
                        title="Drag to resize graphic"
                      />
                      {/* Top-Right Resize Handle */}
                      <div
                        onPointerDown={(e) => handlePointerDownResize(e, layer.id, 'tr')}
                        className="absolute -top-1.5 -right-1.5 size-3 bg-white border-2 border-brand-500 rounded-full shadow-md cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
                        title="Drag to resize graphic"
                      />
                      {/* Bottom-Left Resize Handle */}
                      <div
                        onPointerDown={(e) => handlePointerDownResize(e, layer.id, 'bl')}
                        className="absolute -bottom-1.5 -left-1.5 size-3 bg-white border-2 border-brand-500 rounded-full shadow-md cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
                        title="Drag to resize graphic"
                      />
                      {/* Bottom-Right Resize Handle */}
                      <div
                        onPointerDown={(e) => handlePointerDownResize(e, layer.id, 'br')}
                        className="absolute -bottom-1.5 -right-1.5 size-3 bg-white border-2 border-brand-500 rounded-full shadow-md cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
                        title="Drag to resize graphic"
                      />

                      {/* Live Scale Badge */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
                        {Math.round((layer.scale || 1.0) * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

        {/* Responsive Help Footer */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 px-1">
          <span>Click to position • Drag to move • Drag corners or scroll to resize</span>
          <span className="font-semibold text-gray-500 uppercase">{selectedSide} Panel</span>
        </div>
      </div>

    </aside>
  );
}
