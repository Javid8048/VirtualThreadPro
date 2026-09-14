import React, { useRef, useState, useEffect } from 'react';
import { Edit2, Type, Upload, UploadCloud, RotateCcw, X, Sliders, ChevronDown, Trash2, Plus, Check } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

export function PositionGuide({
  isOpen,
  onClose,
  designManager,
  currentGarmentType = 'oversized_tee',
  onTriggerUpload,
  onTriggerUploadFront,
  onTriggerUploadBack,
  onCameraChange
}) {
  const [selectedSide, setSelectedSide] = useState('front'); // 'front' | 'back'
  const [activeTab, setActiveTab] = useState('graphic'); // 'graphic' | 'text'
  const [textInput, setTextInput] = useState('VIRTUAL THREADS');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [printType, setPrintType] = useState('puff');
  
  // Transform settings
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [posX, setPosX] = useState(0); // offset from center
  const [posY, setPosY] = useState(0);

  // Layers list and drag state
  const [layers, setLayers] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Sync with designManager updates
  useEffect(() => {
    if (!designManager) return;

    const syncState = () => {
      setLayers([...designManager.layers]);
      const active = designManager.getActiveLayer();
      if (active) {
        setSelectedSide(active.side || 'front');
        setScale(active.scale || 1.0);
        setRotation(active.rotation || 0);
        setPrintType(active.printType || 'puff');
        const centerX = active.side === 'back' ? 1520 : 530;
        setPosX(Math.round(active.x - centerX));
        setPosY(Math.round(active.y - 800));
        if (active.type === 'text') {
          setTextInput(active.text || '');
          setTextColor(active.textColor || '#000000');
          setFontSize(active.fontSize || 48);
          setFontFamily(active.fontFamily || 'Inter');
        }
      }
    };

    syncState();
    const unsubscribe = designManager.subscribe(syncState);
    return () => unsubscribe();
  }, [designManager]);

  const frontLayers = layers.filter((l) => (l.side || 'front') === 'front');
  const backLayers = layers.filter((l) => (l.side || 'front') === 'back');
  const currentSideLayers = selectedSide === 'front' ? frontLayers : backLayers;
  const activeLayer = designManager?.getActiveLayer();

  const handleSideChange = (side) => {
    setSelectedSide(side);
    if (onCameraChange) {
      onCameraChange(side);
    }
    if (designManager) {
      // Pick first layer of the new side if available
      const sideLayer = designManager.layers.find((l) => (l.side || 'front') === side);
      if (sideLayer) {
        designManager.setActiveLayer(sideLayer.id);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !designManager) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const centerX = selectedSide === 'back' ? 1520 : 530;
        designManager.addLayer({
          type: 'image',
          side: selectedSide,
          image: img,
          x: centerX,
          y: 800,
          scale: 1.0,
          rotation: 0,
          printType: printType
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddText = () => {
    if (!designManager) return;
    const centerX = selectedSide === 'back' ? 1520 : 530;
    designManager.addLayer({
      type: 'text',
      side: selectedSide,
      text: textInput || 'CUSTOM TEXT',
      textColor: textColor,
      fontSize: fontSize,
      fontFamily: fontFamily,
      x: centerX,
      y: 800,
      scale: 1.0,
      rotation: 0,
      printType: printType
    });
  };

  const handleTransformChange = (newScale, newRot, newX, newY, newPrintType) => {
    setScale(newScale);
    setRotation(newRot);
    setPosX(newX);
    setPosY(newY);
    if (newPrintType) setPrintType(newPrintType);

    if (designManager && designManager.activeLayerId) {
      const centerX = selectedSide === 'back' ? 1520 : 530;
      designManager.updateLayer(designManager.activeLayerId, {
        scale: newScale,
        rotation: newRot,
        x: centerX + newX,
        y: 800 + newY,
        printType: newPrintType || printType
      });
    }
  };

  const applyPreset = (presetName) => {
    if (!designManager || !designManager.activeLayerId) return;
    let newX = 530, newY = 800, newScale = 1.0;
    if (selectedSide === 'front') {
      if (presetName === 'pocket') { newX = 370; newY = 720; newScale = 0.55; }
      else if (presetName === 'center') { newX = 530; newY = 800; newScale = 1.0; }
      else if (presetName === 'large') { newX = 530; newY = 950; newScale = 1.35; }
    } else {
      if (presetName === 'pocket') { newX = 1520; newY = 560; newScale = 0.5; }
      else if (presetName === 'center') { newX = 1520; newY = 800; newScale = 1.0; }
      else if (presetName === 'large') { newX = 1520; newY = 950; newScale = 1.35; }
    }
    const sideCenterX = selectedSide === 'back' ? 1520 : 530;
    const shiftX = newX - sideCenterX;
    const shiftY = newY - 800;
    setPosX(shiftX);
    setPosY(shiftY);
    setScale(newScale);
    designManager.updateLayer(designManager.activeLayerId, {
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  const handleResetCurrentSide = () => {
    if (designManager) {
      designManager.clearLayersBySide(selectedSide);
      setScale(1.0);
      setRotation(0);
      setPosX(0);
      setPosY(0);
    }
  };

  // Drag Handlers for 2D Pattern Guide
  const handleLayerPointerDown = (e, layerId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!designManager) return;

    designManager.setActiveLayer(layerId);
    const layer = designManager.layers.find((l) => l.id === layerId);
    if (!layer) return;

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

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStart || !designManager || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const scaleFactorX = 2048 / rect.width;
    const scaleFactorY = 2048 / rect.height;

    const deltaX = (e.clientX - dragStart.pointerX) * scaleFactorX;
    const deltaY = (e.clientY - dragStart.pointerY) * scaleFactorY;

    let newX = Math.round(dragStart.layerX + deltaX);
    let newY = Math.round(dragStart.layerY + deltaY);

    // Keep locked strictly to the active side boundary
    if (selectedSide === 'front') {
      newX = Math.max(120, Math.min(940, newX));
    } else {
      newX = Math.max(1110, Math.min(1930, newX));
    }
    newY = Math.max(400, Math.min(1650, newY));

    const sideCenterX = selectedSide === 'back' ? 1520 : 530;
    setPosX(newX - sideCenterX);
    setPosY(newY - 800);

    designManager.updateLayer(dragStart.layerId, {
      x: newX,
      y: newY,
      side: selectedSide
    });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setIsDragging(false);
      setDragStart(null);
    }
  };

  const handleContainerPointerDown = (e) => {
    if (!designManager || !containerRef.current) return;
    const active = designManager.getActiveLayer();
    if (!active || (active.side || 'front') !== selectedSide) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleFactorX = 2048 / rect.width;
    const scaleFactorY = 2048 / rect.height;

    let clickX = Math.round((e.clientX - rect.left) * scaleFactorX);
    let clickY = Math.round((e.clientY - rect.top) * scaleFactorY);

    if (selectedSide === 'front') {
      clickX = Math.max(120, Math.min(940, clickX));
    } else {
      clickX = Math.max(1110, Math.min(1930, clickX));
    }
    clickY = Math.max(400, Math.min(1650, clickY));

    const sideCenterX = selectedSide === 'back' ? 1520 : 530;
    setPosX(clickX - sideCenterX);
    setPosY(clickY - 800);

    designManager.updateLayer(active.id, {
      x: clickX,
      y: clickY,
      side: selectedSide
    });

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    setIsDragging(true);
    setDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      layerX: clickX,
      layerY: clickY,
      layerId: active.id
    });
  };

  if (!isOpen) return null;

  return (
    <aside className="absolute right-6 top-20 bottom-6 w-[440px] bg-white rounded-3xl shadow-2xl border border-gray-150 flex flex-col overflow-hidden select-none z-20 text-gray-800 animate-fadeIn">
      {/* Header Banner */}
      <div className="px-4 py-2.5 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="text-xs font-black tracking-wide uppercase">Graphics Drag & Placement Studio</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          title="Close Graphics Drag Menu"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Top Toolbar: High Visibility Text Decal Controls */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50/90">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              if (designManager && designManager.activeLayerId) {
                designManager.updateLayer(designManager.activeLayerId, { textColor: e.target.value });
              }
            }}
            className="size-7 rounded-full cursor-pointer border-2 border-gray-300 p-0 overflow-hidden shrink-0 shadow-sm"
            title="Text Color Swatch"
          />
          
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type text here..."
            className="flex-1 min-w-0 px-3 py-1.5 text-xs font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-xl shadow-inner placeholder:text-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />

          <button
            onClick={handleAddText}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-all active:scale-95 flex items-center gap-1 shrink-0"
          >
            <Type className="size-3.5" />
            <span>Add Text</span>
          </button>

          <input
            type="number"
            value={fontSize}
            onChange={(e) => {
              const sz = parseInt(e.target.value) || 24;
              setFontSize(sz);
              if (designManager && designManager.activeLayerId) {
                designManager.updateLayer(designManager.activeLayerId, { fontSize: sz });
              }
            }}
            className="w-12 px-1 py-1.5 text-xs font-mono font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-xl text-center shadow-inner focus:outline-none focus:border-brand-500 shrink-0"
            title="Font Size"
          />
        </div>
      </div>

      {/* Prominent Front & Back Upload Buttons on Right Side */}
      <div className="p-3 bg-gray-50/60 border-b border-gray-100 flex flex-col gap-1.5">
        <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center justify-between">
          <span>Upload Custom Graphics</span>
          <span className="text-brand-600 font-bold">Front & Back Decals</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              handleSideChange('front');
              if (onTriggerUploadFront) {
                onTriggerUploadFront();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              selectedSide === 'front'
                ? 'bg-brand-500 border-brand-600 text-white shadow-glow-brand ring-2 ring-brand-500/20'
                : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
            }`}
          >
            <UploadCloud className="size-3.5" />
            <span>Upload Front Design</span>
          </button>

          <button
            onClick={() => {
              handleSideChange('back');
              if (onTriggerUploadBack) {
                onTriggerUploadBack();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              selectedSide === 'back'
                ? 'bg-brand-500 border-brand-600 text-white shadow-glow-brand ring-2 ring-brand-500/20'
                : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
            }`}
          >
            <UploadCloud className="size-3.5" />
            <span>Upload Back Design</span>
          </button>
        </div>
      </div>

      {/* Side Selector Tabs (Front vs Back) */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSideChange('front')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              selectedSide === 'front'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>
              {currentGarmentType === 'sweatpants'
                ? 'LEFT THIGH'
                : currentGarmentType === 'cap'
                ? 'FRONT CROWN'
                : 'FRONT CHEST'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedSide === 'front' ? 'bg-white/20' : 'bg-gray-200 text-gray-800'}`}>
              {frontLayers.length}
            </span>
          </button>

          <button
            onClick={() => handleSideChange('back')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              selectedSide === 'back'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>
              {currentGarmentType === 'sweatpants'
                ? 'BACK POCKET'
                : currentGarmentType === 'cap'
                ? 'SIDE PANEL'
                : 'BACK TORSO'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedSide === 'back' ? 'bg-white/20' : 'bg-gray-200 text-gray-800'}`}>
              {backLayers.length}
            </span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => {
            if (selectedSide === 'front' && onTriggerUploadFront) {
              onTriggerUploadFront();
            } else if (selectedSide === 'back' && onTriggerUploadBack) {
              onTriggerUploadBack();
            } else {
              fileInputRef.current?.click();
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all shadow-sm active:scale-95"
        >
          <Upload className="size-3.5" />
          <span>+ Upload</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
        {/* 2D Pattern Preview Container */}
        <div
          ref={containerRef}
          onPointerDown={handleContainerPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative aspect-square w-full rounded-2xl border border-gray-200 bg-[#f9fafb] overflow-hidden flex items-center justify-center shadow-inner select-none cursor-crosshair"
          title="Click or drag on pattern to position active layer"
        >
          <img
            src={
              currentGarmentType === 'sweatpants' || currentGarmentType === 'cap' || currentGarmentType.includes('hoodie') || currentGarmentType === 'sweatshirt' || currentGarmentType === 'polo'
                ? getAssetUrl(`/garments/${currentGarmentType}.png`)
                : getAssetUrl('/position-guide.svg')
            }
            alt="Position Guide Template"
            className={`w-full h-full object-contain pointer-events-none select-none ${
              currentGarmentType !== 'oversized_tee' && currentGarmentType !== 'regular_tee' && currentGarmentType !== 'cropped_tee'
                ? 'opacity-85 p-3'
                : 'opacity-90'
            }`}
            draggable={false}
          />

          {/* Active Side Highlight Zone */}
          {currentGarmentType === 'oversized_tee' || currentGarmentType === 'regular_tee' || currentGarmentType === 'cropped_tee' ? (
            <div
              className={`absolute top-0 bottom-0 pointer-events-none transition-all duration-300 border-2 border-dashed ${
                selectedSide === 'front'
                  ? 'left-0 w-1/2 border-indigo-400/40 bg-indigo-500/5'
                  : 'left-1/2 w-1/2 border-amber-400/40 bg-amber-500/5'
              }`}
            />
          ) : (
            <div
              className={`absolute pointer-events-none transition-all duration-300 border-2 border-dashed rounded-2xl ${
                selectedSide === 'front'
                  ? 'top-[22%] bottom-[22%] left-[18%] right-[18%] border-indigo-400/50 bg-indigo-500/5'
                  : 'top-[20%] bottom-[25%] left-[20%] right-[20%] border-amber-400/50 bg-amber-500/5'
              }`}
            />
          )}

          {/* Draggable Layer Overlays */}
          {(() => {
            const isSingleGarmentView = currentGarmentType !== 'oversized_tee' && currentGarmentType !== 'regular_tee' && currentGarmentType !== 'cropped_tee';
            const displayedLayers = isSingleGarmentView
              ? layers.filter((l) => (l.side || 'front') === selectedSide)
              : layers;

            return displayedLayers.map((layer) => {
              const isActive = layer.id === (designManager?.activeLayerId);
              const isImage = layer.type === 'image' && layer.image;
              const baseW = 420;
              const aspect = isImage && layer.image.width && layer.image.height
                ? layer.image.width / layer.image.height
                : 1;
              const wPercent = ((baseW * (layer.scale || 1.0)) / 2048) * 100 * (isSingleGarmentView ? 1.6 : 1.0);
              const hPercent = wPercent / aspect;

              let leftPercent, topPercent;
              if (isSingleGarmentView) {
                const sideCenterX = layer.side === 'back' ? 1520 : 530;
                const offsetX = layer.x - sideCenterX;
                const offsetY = layer.y - 800;
                leftPercent = 50 + (offsetX / 2048) * 100 * 2.0;
                topPercent = 42 + (offsetY / 2048) * 100 * 2.0;
              } else {
                leftPercent = (layer.x / 2048) * 100;
                topPercent = (layer.y / 2048) * 100;
              }

              return (
                <div
                  key={layer.id}
                  onPointerDown={(e) => handleLayerPointerDown(e, layer.id)}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${wPercent}%`,
                    height: isImage ? `${hPercent}%` : 'auto',
                    transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg)`,
                  }}
                  className={`absolute touch-none select-none z-20 flex items-center justify-center ${
                    isActive
                      ? 'cursor-grab active:cursor-grabbing ring-2 ring-indigo-600 ring-offset-2 rounded shadow-lg'
                      : 'cursor-pointer hover:ring-2 hover:ring-gray-400/60 rounded opacity-80'
                  }`}
                >
                {isImage ? (
                  <img
                    src={layer.image.src}
                    alt="Layer graphic"
                    className="w-full h-full object-contain pointer-events-none drop-shadow-md select-none"
                    draggable={false}
                  />
                ) : (
                  <div
                    style={{
                      color: layer.textColor || '#000000',
                      fontFamily: layer.fontFamily || 'Inter',
                      fontSize: '12px'
                    }}
                    className="font-bold text-center px-1 whitespace-nowrap drop-shadow select-none pointer-events-none"
                  >
                    {layer.text}
                  </div>
                )}

                {/* Active Handles */}
                {isActive && (
                  <>
                    <div className="absolute -top-1 -left-1 size-2.5 bg-white border-2 border-indigo-600 rounded-sm pointer-events-none shadow" />
                    <div className="absolute -top-1 -right-1 size-2.5 bg-white border-2 border-indigo-600 rounded-sm pointer-events-none shadow" />
                    <div className="absolute -bottom-1 -left-1 size-2.5 bg-white border-2 border-indigo-600 rounded-sm pointer-events-none shadow" />
                    <div className="absolute -bottom-1 -right-1 size-2.5 bg-white border-2 border-indigo-600 rounded-sm pointer-events-none shadow" />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-[8px] font-semibold tracking-wide px-1.5 py-0.2 rounded-full shadow pointer-events-none whitespace-nowrap">
                      Drag to Move
                    </div>
                  </>
                )}
              </div>
            );
          });
        })()}

          {/* Empty hint */}
          {currentSideLayers.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none z-10">
              <span className="text-sm font-extrabold text-gray-800">
                No designs on{' '}
                {selectedSide === 'front'
                  ? currentGarmentType === 'sweatpants'
                    ? 'Left Thigh'
                    : currentGarmentType === 'cap'
                    ? 'Front Crown'
                    : 'Front Chest'
                  : currentGarmentType === 'sweatpants'
                  ? 'Back Pocket'
                  : currentGarmentType === 'cap'
                  ? 'Side Panel'
                  : 'Back Torso'}
              </span>
              <span className="text-xs font-semibold text-gray-600 mt-1 max-w-[200px]">
                Click "Upload Front Design" or "Add Text" above to place your graphic
              </span>
            </div>
          )}
        </div>

        {/* Multi-Layer Selector for the Current Side */}
        <div className="bg-white rounded-2xl border border-gray-200 p-2.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>{selectedSide === 'front' ? 'Front' : 'Back'} Layers ({currentSideLayers.length})</span>
            </span>
            {currentSideLayers.length > 0 && (
              <button
                onClick={handleResetCurrentSide}
                className="text-[10px] text-gray-400 hover:text-red-600 transition-colors"
              >
                Clear {selectedSide}
              </button>
            )}
          </div>

          {currentSideLayers.length === 0 ? (
            <div className="text-[11px] text-gray-400 italic py-1 text-center">
              No design layers on this side.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {currentSideLayers.map((layer, index) => {
                const isActive = layer.id === activeLayer?.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => designManager.setActiveLayer(layer.id)}
                    className={`flex items-center justify-between p-1.5 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-gray-50/80 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {layer.type === 'image' && layer.image ? (
                        <img src={layer.image.src} alt="" className="size-6 rounded object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="size-6 rounded bg-gray-200 flex items-center justify-center font-bold text-xs shrink-0">
                          T
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-gray-800 truncate">
                          {layer.type === 'image' ? `Design #${index + 1}` : layer.text}
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase">
                          {layer.printType === 'puff' ? '3D Puff' : 'Screen'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        designManager.removeLayer(layer.id);
                      }}
                      className="text-gray-400 hover:text-red-600 p-1 rounded"
                      title="Delete this design"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Placement Presets */}
        {activeLayer && (
          <div className="flex items-center justify-between gap-1 text-[10px] bg-gray-50 p-2 rounded-xl border border-gray-100">
            <span className="font-bold text-gray-500 uppercase">Presets:</span>
            <button
              onClick={() => applyPreset('pocket')}
              className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold"
            >
              {selectedSide === 'front' ? 'Left Pocket' : 'Upper Neck'}
            </button>
            <button
              onClick={() => applyPreset('center')}
              className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold"
            >
              Center Chest
            </button>
            <button
              onClick={() => applyPreset('large')}
              className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold"
            >
              Full Coverage
            </button>
          </div>
        )}

        {/* Real-time Transform Controls */}
        {activeLayer && (
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Sliders className="size-3.5 text-indigo-600" />
                <span>Selected Layer Controls</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTransformChange(scale, rotation, posX, posY, 'screen')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    printType === 'screen' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Screen
                </button>
                <button
                  onClick={() => handleTransformChange(scale, rotation, posX, posY, 'puff')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    printType === 'puff' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  3D Puff
                </button>
              </div>
            </div>

            {/* Scale Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5 font-medium text-gray-500">
                <span>Scale Size</span>
                <span className="font-mono">{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={scale}
                onChange={(e) =>
                  handleTransformChange(parseFloat(e.target.value), rotation, posX, posY)
                }
                className="w-full accent-black cursor-pointer"
              />
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-0.5 font-medium text-gray-500">
                <span>Rotation</span>
                <span className="font-mono">{rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={rotation}
                onChange={(e) =>
                  handleTransformChange(scale, parseInt(e.target.value), posX, posY)
                }
                className="w-full accent-black cursor-pointer"
              />
            </div>

            {/* Horizontal & Vertical Position Sliders */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] mb-0.5 font-medium text-gray-500">
                  <span>Shift X</span>
                  <span className="font-mono">{posX}px</span>
                </div>
                <input
                  type="range"
                  min="-300"
                  max="300"
                  step="5"
                  value={posX}
                  onChange={(e) =>
                    handleTransformChange(scale, rotation, parseInt(e.target.value), posY)
                  }
                  className="w-full accent-black cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-0.5 font-medium text-gray-500">
                  <span>Shift Y</span>
                  <span className="font-mono">{posY}px</span>
                </div>
                <input
                  type="range"
                  min="-350"
                  max="350"
                  step="5"
                  value={posY}
                  onChange={(e) =>
                    handleTransformChange(scale, rotation, posX, parseInt(e.target.value))
                  }
                  className="w-full accent-black cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
