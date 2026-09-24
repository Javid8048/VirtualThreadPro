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
    const centerX = selectedSide === 'back' ? 1520 : 530;
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
      showFeedback('Text decal added');
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

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const centerX = selectedSide === 'back' ? 1520 : 530;
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
          showFeedback('Design uploaded');
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
        imgSrc: l.image?.src || null
      }));

      localStorage.setItem('virtualthreads_saved_layout', JSON.stringify(serialized));
      showFeedback('Layout saved to studio');
    } catch (err) {
      console.warn('Could not save layout:', err);
      showFeedback('Saved locally');
    }
  };

  // Load Layout from localStorage
  const handleLoadLayout = () => {
    if (!designManager) return;

    try {
      const saved = localStorage.getItem('virtualthreads_saved_layout');
      if (!saved) {
        showFeedback('No saved layout found');
        return;
      }

      const layersData = JSON.parse(saved);
      designManager.clearLayers();

      layersData.forEach((layerItem) => {
        if (layerItem.type === 'text') {
          designManager.addLayer({
            type: 'text',
            side: layerItem.side || 'front',
            text: layerItem.text,
            textColor: layerItem.textColor,
            fontSize: layerItem.fontSize,
            fontFamily: layerItem.fontFamily,
            x: layerItem.x,
            y: layerItem.y,
            scale: layerItem.scale,
            rotation: layerItem.rotation,
            printType: layerItem.printType
          });
        } else if (layerItem.type === 'image' && layerItem.imgSrc) {
          const img = new Image();
          img.onload = () => {
            designManager.addLayer({
              type: 'image',
              side: layerItem.side || 'front',
              image: img,
              x: layerItem.x,
              y: layerItem.y,
              scale: layerItem.scale,
              rotation: layerItem.rotation,
              printType: layerItem.printType
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
      className={`absolute right-3 sm:right-6 top-16 sm:top-20 bottom-3 sm:bottom-6 ${
        isExpanded ? 'w-[740px] sm:w-[840px] lg:w-[940px]' : 'w-[540px] sm:w-[600px] lg:w-[660px]'
      } max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden select-none z-30 transition-all duration-300 animate-fadeIn`}
      style={{ maxHeight: 'calc(100vh - 84px)' }}
    >
      
      {/* Hidden File Input for Design Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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

      {/* ========================================================================= */}
      {/* ROW 1: Orange Pill | Pen Icon | Color Swatch | Number Input | Close (x)  */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 bg-[#f8f9fa] border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Orange Vertical Accent Pill */}
          <div className="w-1.5 h-6 rounded-full bg-[#f97316] shrink-0" />

          {/* Pen / Stylus Tool Icon */}
          <button 
            type="button" 
            className="text-gray-800 hover:text-black transition-colors p-0.5"
            title="Garment & Drawing Tools"
          >
            <Pencil className="size-4 stroke-[2.2]" />
          </button>

          {/* Garment / Draw Color Swatch Circle */}
          <button
            type="button"
            onClick={() => garmentColorInputRef.current?.click()}
            className="size-6 rounded-full border border-gray-300 shadow-sm cursor-pointer overflow-hidden shrink-0 hover:scale-105 transition-transform"
            style={{ backgroundColor: garmentColor }}
            title="Change Garment Color"
          />

          {/* Numeric Input Display (Layer / Stroke) */}
          <input
            type="number"
            value={penStrokeWidth}
            onChange={(e) => setPenStrokeWidth(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            className="w-11 h-7 px-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-2xs text-center focus:outline-none focus:border-gray-500"
            title="Stroke Width / Layer Index"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-brand-400 hover:bg-indigo-50 dark:hover:bg-brand-500/20 border border-indigo-200 dark:border-brand-500/30 transition-all flex items-center gap-1 shadow-2xs active:scale-95"
              title="Switch to Export Studio (Video & 4K Snapshots)"
            >
              <Download className="size-3" />
              <span>Export</span>
            </button>
          )}

          {/* Expand / Minimize Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-200/60"
            title={isExpanded ? "Collapse to Standard Width" : "Expand to Wide Canvas"}
          >
            {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>

          {/* Close Button (x) */}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-200/60"
            title="Close Position Guide"
          >
            <X className="size-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: Add Text Button | Text Input Box | Text Color Swatch | Font Size | Font Family Dropdown */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-[#f8f9fa] border-b border-gray-100">
        {/* Add Text Pill Button */}
        <button
          type="button"
          onClick={handleAddText}
          className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-md shadow-2xs hover:bg-gray-50 active:scale-95 transition-all shrink-0"
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
          className="flex-1 min-w-[90px] h-7 px-2.5 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded shadow-2xs placeholder:text-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
          title="Type text to add or edit"
        />

        {/* Circular Text Color Swatch */}
        <button
          type="button"
          onClick={() => textColorInputRef.current?.click()}
          className="size-6 rounded-full border border-gray-300 shadow-sm cursor-pointer overflow-hidden shrink-0 hover:scale-105 transition-transform"
          style={{ backgroundColor: textColor }}
          title="Change Text Color"
        />

        {/* Numeric Font Size Input */}
        <input
          type="number"
          value={fontSize}
          onChange={handleFontSizeChange}
          min="1"
          max="120"
          className="w-11 h-7 px-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-2xs text-center focus:outline-none focus:border-gray-500 shrink-0"
          title="Font Size"
        />

        {/* Font Family Select Dropdown */}
        <select
          value={fontFamily}
          onChange={handleFontFamilyChange}
          className="h-7 px-2 text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded shadow-2xs focus:outline-none focus:border-gray-500 cursor-pointer w-24 shrink-0"
          title="Font Family"
        >
          <option value="Roboto">Roboto</option>
          <option value="Inter">Inter</option>
          <option value="Bebas Neue">Bebas Neue</option>
          <option value="Impact">Impact</option>
          <option value="Montserrat">Montserrat</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: Upload Design Button | Save Layout | Load Layout | Reset            */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#f8f9fa] border-b border-gray-200">
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
          className="px-4 py-1.5 rounded-full bg-[#0a0f1d] hover:bg-[#1a233a] text-white text-xs font-bold shadow transition-all active:scale-95 shrink-0"
        >
          Upload Design
        </button>

        {/* Action Text Links */}
        <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
          <button
            type="button"
            onClick={handleSaveLayout}
            className="hover:text-black transition-colors px-1 py-1"
            title="Save layout layers"
          >
            Save Layout
          </button>
          <button
            type="button"
            onClick={handleLoadLayout}
            className="hover:text-black transition-colors px-1 py-1"
            title="Restore saved layout"
          >
            Load Layout
          </button>
          <button
            type="button"
            onClick={handleResetLayout}
            className="hover:text-red-600 transition-colors px-1 py-1"
            title="Clear all graphics"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Transient Feedback Message Banner */}
      {feedbackMessage && (
        <div className="bg-emerald-50 text-emerald-700 border-b border-emerald-100 px-4 py-1.5 text-center text-xs font-semibold flex items-center justify-center gap-1.5 animate-fadeIn">
          <Check className="size-3.5" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN BODY: Centered Header + Authentic Flat Garment Schematic Canvas      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden p-3 sm:p-4">
        
        {/* Light Gray Uppercase Title */}
        <div className="text-center font-extrabold text-xs sm:text-sm tracking-widest text-[#b8b8c2] uppercase py-1">
          POSITION GUIDE
        </div>

        {/* Interactive Responsive Pattern SVG Viewport */}
        <div 
          ref={containerRef}
          onClick={handleCanvasClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative flex-1 w-full bg-white rounded-2xl overflow-hidden flex items-center justify-center cursor-crosshair border border-gray-100 touch-none select-none"
        >
          
          {/* Base Vector Pattern SVG (Collar Rib, Front Silhouette, Back Silhouette, Sleeves) */}
          <svg
            viewBox="0 0 2048 2048"
            className="w-full h-full object-contain pointer-events-none"
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

            {/* Top Collar Rib Pieces */}
            <path className="pattern-panel" d="M 370 420 C 370 540, 690 540, 690 420 C 690 465, 370 465, 370 420 Z" />
            <path className="pattern-panel" d="M 1360 420 C 1360 480, 1680 480, 1680 420 C 1680 450, 1360 450, 1360 420 Z" />

            {/* FRONT PANEL (Left Silhouette) */}
            <path 
              className="pattern-panel" 
              d="
                M 375 585
                C 450 670, 610 670, 685 585
                L 940 700
                L 870 1020
                L 815 1020
                L 815 1580
                L 245 1580
                L 245 1020
                L 190 1020
                L 120 700
                Z
              " 
            />

            {/* Front Center Line & Safe Area */}
            <line x1="530" y1="730" x2="530" y2="1240" className="pattern-center-dash" />
            <text x="530" y="960" className="pattern-label">FRONT</text>

            {/* BACK PANEL (Right Silhouette) */}
            <path 
              className="pattern-panel" 
              d="
                M 1365 605
                C 1440 645, 1600 645, 1675 605
                L 1930 700
                L 1860 1020
                L 1805 1020
                L 1805 1580
                L 1235 1580
                L 1235 1020
                L 1180 1020
                L 1110 700
                Z
              " 
            />

            {/* Back Center Line & Safe Area */}
            <line x1="1520" y1="730" x2="1520" y2="1240" className="pattern-center-dash" />
            <text x="1520" y="960" className="pattern-label">BACK</text>

            {/* Sleeves at Bottom */}
            <path className="pattern-panel" d="M 230 1710 L 830 1710 L 800 1960 L 260 1960 Z" />
            <path className="pattern-panel" d="M 1220 1710 L 1820 1710 L 1790 1960 L 1250 1960 Z" />
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

        {/* Responsive Help Footer */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 px-1">
          <span>Click to position • Drag to move • Drag corners or scroll to resize</span>
          <span className="font-semibold text-gray-500 uppercase">{selectedSide} Panel</span>
        </div>
      </div>

    </aside>
  );
}
