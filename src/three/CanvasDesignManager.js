import * as THREE from 'three';

/**
 * Manages the master 2048x2048 texture canvas that is mapped directly onto the 3D T-shirt.
 * Eliminates floating decals by baking artwork, text, and colors directly into the UV map.
 */
export class CanvasDesignManager {
  constructor(garmentColor = '#ffffff') {
    this.logicalSize = 2048;
    this.scaleFactor = 1; // Native 1:1 mapping for instantaneous 60 FPS GPU uploads
    this.size = 2048;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });

    this.garmentColor = garmentColor;
    this.fabricFinish = 'cotton'; // 'cotton' | 'acid_wash' | 'vintage_fade'
    this.garmentType = 'oversized_tee';

    // Artwork and Text layers
    this.layers = [];
    this.activeLayerId = null;
    this.listeners = [];
    this._rafId = null;

    // Three.js Texture (Razor-sharp with direct LinearFilter without mipmap blur)
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.flipY = false; // Required for GLTF UV coordinates
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.texture.anisotropy = 16;

    // Dedicated Transparent Decal Texture (Zero background patch on 3D meshes)
    this.decalCanvas = document.createElement('canvas');
    this.decalCanvas.width = this.size;
    this.decalCanvas.height = this.size;
    this.decalCtx = this.decalCanvas.getContext('2d', { willReadFrequently: false });

    this.decalTexture = new THREE.CanvasTexture(this.decalCanvas);
    this.decalTexture.flipY = false;
    this.decalTexture.colorSpace = THREE.SRGBColorSpace;
    this.decalTexture.minFilter = THREE.LinearFilter;
    this.decalTexture.magFilter = THREE.LinearFilter;
    this.decalTexture.generateMipmaps = false;
    this.decalTexture.anisotropy = 16;

    // Command Pattern Undo / Redo history engine (Ctrl+Z / Ctrl+Shift+Z)
    this.history = [];
    this.historyIndex = -1;
    this._isUndoRedoing = false;

    // Initial render
    this.render();
    this.saveHistory();
  }

  subscribe(cb) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== cb);
    };
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this);
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  getActiveLayer() {
    return this.layers.find((l) => l.id === this.activeLayerId) || this.layers[0] || null;
  }

  setActiveLayer(id) {
    this.activeLayerId = id;
    this.notify();
  }

  loadGuideImage(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.guideImage = img;
      this.render();
      this.notify();
    };
    img.src = url;
  }

  setGarmentColor(hex) {
    this.garmentColor = hex;
    this.render();
    this.notify();
  }

  setFabricFinish(finish) {
    this.fabricFinish = finish;
    this.render();
    this.notify();
  }

  /**
   * Adds an artwork layer (image or text)
   */
  addLayer(layer) {
    const side = layer.side || 'front';
    const defaultLayer = {
      id: 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: 'image', // 'image' | 'text'
      side: side, // 'front' | 'back'
      image: null, // HTMLImageElement or dataUrl
      text: 'VIRTUAL THREADS',
      textColor: '#000000',
      fontSize: 12,
      fontFamily: 'Roboto',
      x: side === 'back' ? 1528 : 480,
      y: 800,
      scale: 1.0,
      rotation: 0, // degrees
      opacity: 1.0,
      printType: 'screen' // 'screen' | 'puff'
    };

    const newLayer = { ...defaultLayer, ...layer };
    this.layers.push(newLayer);
    this.activeLayerId = newLayer.id;
    this.render();
    this.saveHistory();
    this.notify();
    return newLayer;
  }

  getLayersBySide(side) {
    return this.layers.filter((l) => (l.side || 'front') === side);
  }

  setGarmentType(type) {
    this.garmentType = type;
  }

  updateLayer(id, updates, immediate = false) {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx !== -1) {
      this.layers[idx] = { ...this.layers[idx], ...updates };
      if (immediate) {
        this.saveHistory();
        this.flush();
      } else {
        this.scheduleRender();
      }
    }
  }

  scheduleRender() {
    if (this._rafId) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this.render();
      this.notify();
    });
  }

  flush() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.render();
    this.notify();
  }

  removeLayer(id) {
    this.layers = this.layers.filter((l) => l.id !== id);
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers[0]?.id || null;
    }
    this.saveHistory();
    this.flush();
  }

  clearLayersBySide(side) {
    this.layers = this.layers.filter((l) => (l.side || 'front') !== side);
    if (!this.layers.find((l) => l.id === this.activeLayerId)) {
      this.activeLayerId = this.layers[0]?.id || null;
    }
    this.saveHistory();
    this.flush();
  }

  clearLayers() {
    this.layers = [];
    this.activeLayerId = null;
    this.saveHistory();
    this.flush();
  }

  saveHistory() {
    if (this._isUndoRedoing) return;
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    const snapshot = {
      layers: this.layers.map((l) => ({ ...l })),
      activeLayerId: this.activeLayerId,
      garmentColor: this.garmentColor
    };
    this.history.push(snapshot);
    if (this.history.length > 40) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  }

  canUndo() {
    return this.historyIndex > 0;
  }

  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  undo() {
    if (!this.canUndo()) return false;
    this.historyIndex--;
    this._restoreHistory(this.history[this.historyIndex]);
    return true;
  }

  redo() {
    if (!this.canRedo()) return false;
    this.historyIndex++;
    this._restoreHistory(this.history[this.historyIndex]);
    return true;
  }

  _restoreHistory(snapshot) {
    if (!snapshot) return;
    this._isUndoRedoing = true;
    this.layers = snapshot.layers.map((l) => ({ ...l }));
    this.activeLayerId = snapshot.activeLayerId;
    if (snapshot.garmentColor && snapshot.garmentColor !== this.garmentColor) {
      this.garmentColor = snapshot.garmentColor;
    }
    this.flush();
    this._isUndoRedoing = false;
  }

  initFabricPattern() {
    if (typeof document === 'undefined') return;
    const P = 128;
    const pCanvas = document.createElement('canvas');
    pCanvas.width = P;
    pCanvas.height = P;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;

    pCtx.fillStyle = '#808080';
    pCtx.fillRect(0, 0, P, P);

    const imgData = pCtx.getImageData(0, 0, P, P);
    const data = imgData.data;

    // Realistic fine woven cotton yarn structure
    const freq = 0.45;
    for (let y = 0; y < P; y++) {
      for (let x = 0; x < P; x++) {
        const idx = (y * P + x) * 4;
        const threadX = Math.sin(x * freq) * 0.5 + 0.5;
        const threadY = Math.cos(y * freq) * 0.5 + 0.5;
        const diag = Math.sin((x + y) * freq * 0.75) * 0.2;
        const noise = (Math.random() - 0.5) * 0.1;
        const yarn = threadX * 0.45 + threadY * 0.45 + diag + noise;
        const val = Math.min(255, Math.max(0, Math.round(128 + (yarn - 0.5) * 55)));

        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
    pCtx.putImageData(imgData, 0, 0);

    this.fabricPatternCanvas = pCanvas;
    this.fabricPattern = this.ctx.createPattern(pCanvas, 'repeat');
  }

  render() {
    const ctx = this.ctx;
    const dCtx = this.decalCtx;
    const S = this.size;

    // Enable ultra-high quality smoothing for razor-sharp artwork
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (dCtx) {
      dCtx.imageSmoothingEnabled = true;
      dCtx.imageSmoothingQuality = 'high';
    }

    // 1. Fill base garment color (pure, plain and clean) for t-shirt full UV map
    ctx.fillStyle = this.garmentColor;
    ctx.fillRect(0, 0, S, S);

    // 2. Micro textile weave texture overlay for authentic tactile cotton feel
    if (!this.fabricPattern) {
      this.initFabricPattern();
    }
    if (this.fabricPattern) {
      ctx.save();
      // Subtle weave shading for matte woven cotton depth
      ctx.globalAlpha = this.fabricFinish === 'heavy_terry' ? 0.12 : 0.06;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = this.fabricPattern;
      ctx.fillRect(0, 0, S, S);

      // Soft light diffuse fiber blend (matte, zero shiny highlights)
      ctx.globalAlpha = 0.03;
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = this.fabricPattern;
      ctx.fillRect(0, 0, S, S);

      // Procedural mineral wash / sun fade distress if enabled
      if (this.fabricFinish === 'mineral_wash') {
        ctx.globalAlpha = 0.18;
        ctx.globalCompositeOperation = 'overlay';
        const grad = ctx.createRadialGradient(S * 0.5, S * 0.4, 50, S * 0.5, S * 0.5, S * 0.7);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(0.5, 'rgba(180,180,180,0.1)');
        grad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, S, S);
      }

      ctx.restore();
    }

    // 2. Only render to decalCanvas if the active garment actually uses 3D floating decals (hoodie, pants, cap)
    const isDecalGarment = this.garmentType && (
      this.garmentType === 'hoodie' ||
      this.garmentType === 'zip_hoodie' ||
      this.garmentType === 'hanging_hoodie' ||
      this.garmentType === 'sweatpants' ||
      this.garmentType === 'pants' ||
      this.garmentType === 'cap'
    );

    if (isDecalGarment && dCtx) {
      dCtx.clearRect(0, 0, S, S);
    }

    // 3. Render all design layers to target canvases with authentic print finishes
    const targets = (isDecalGarment && dCtx) ? [ctx, dCtx] : [ctx];

    this.layers.forEach((layer) => {
      targets.forEach((targetCtx) => {
        targetCtx.save();
        targetCtx.globalAlpha = layer.opacity || 1.0;

        // Position center
        targetCtx.translate(layer.x, layer.y);
        if (layer.rotation) {
          targetCtx.rotate((layer.rotation * Math.PI) / 180);
        }

        const pType = layer.printType || 'screen'; // 'screen' | 'puff' | 'embroidery' | 'metallic' | 'gloss'

        if (layer.type === 'image' && layer.image) {
          const img = layer.image;
          const baseW = 420;
          const aspect = img.width && img.height ? img.width / img.height : 1;
          const w = baseW * (layer.scale || 1.0);
          const h = w / aspect;

          if (pType === 'puff') {
            // Tactile 3D raised silicone/rubber puff print: bevel highlight and soft shadow
            targetCtx.save();
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            targetCtx.shadowBlur = 6;
            targetCtx.shadowOffsetX = 0;
            targetCtx.shadowOffsetY = 3;
            targetCtx.drawImage(img, -w / 2, -h / 2, w, h);
            // Top rim highlight for 3D raised dome relief
            targetCtx.shadowColor = 'rgba(255, 255, 255, 0.35)';
            targetCtx.shadowBlur = 2;
            targetCtx.shadowOffsetY = -1.5;
            targetCtx.drawImage(img, -w / 2, -h / 2, w, h);
            targetCtx.restore();
          } else if (pType === 'embroidery') {
            // Tactile threaded embroidery: thread stitch relief + satin thread micro-bevel
            targetCtx.save();
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.38)';
            targetCtx.shadowBlur = 3;
            targetCtx.shadowOffsetY = 1.5;
            targetCtx.drawImage(img, -w / 2, -h / 2, w, h);
            // Embroidered thread micro-stitch overlay
            targetCtx.globalCompositeOperation = 'source-atop';
            targetCtx.globalAlpha = 0.22;
            targetCtx.fillStyle = '#ffffff';
            const stitchStep = Math.max(3, Math.round(4 * (layer.scale || 1.0)));
            for (let sy = -h / 2; sy < h / 2; sy += stitchStep * 2) {
              targetCtx.fillRect(-w / 2, sy, w, stitchStep);
            }
            targetCtx.restore();
          } else if (pType === 'metallic') {
            // Shimmering metallic gold/silver leaf foil finish
            targetCtx.save();
            targetCtx.drawImage(img, -w / 2, -h / 2, w, h);
            targetCtx.globalCompositeOperation = 'source-atop';
            targetCtx.globalAlpha = 0.42;
            const foilGrad = targetCtx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
            foilGrad.addColorStop(0, '#ffd700');
            foilGrad.addColorStop(0.3, '#ffffff');
            foilGrad.addColorStop(0.6, '#d4af37');
            foilGrad.addColorStop(1, '#fff8dc');
            targetCtx.fillStyle = foilGrad;
            targetCtx.fillRect(-w / 2, -h / 2, w, h);
            targetCtx.restore();
          } else if (pType === 'gloss') {
            // High-gloss wet silicone gel print with specular sheen
            targetCtx.save();
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            targetCtx.shadowBlur = 4;
            targetCtx.shadowOffsetY = 2;
            targetCtx.drawImage(img, -w / 2, -h / 2, w, h);
            targetCtx.globalCompositeOperation = 'source-atop';
            targetCtx.globalAlpha = 0.28;
            const glossGrad = targetCtx.createLinearGradient(0, -h / 2, 0, h / 2);
            glossGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
            glossGrad.addColorStop(0.4, 'rgba(255,255,255,0.1)');
            glossGrad.addColorStop(0.7, 'transparent');
            targetCtx.fillStyle = glossGrad;
            targetCtx.fillRect(-w / 2, -h / 2, w, h);
            targetCtx.restore();
          } else {
            // Screen print / direct ink: ultra-crisp render
            targetCtx.drawImage(img, -w / 2, -h / 2, w, h);
          }
        } else if (layer.type === 'text' && layer.text) {
          const fontSize = ((layer.fontSize || 12) * 4) * (layer.scale || 1.0);
          targetCtx.font = `bold ${fontSize}px "${layer.fontFamily || 'Roboto'}", sans-serif`;
          targetCtx.textAlign = 'center';
          targetCtx.textBaseline = 'middle';

          if (pType === 'puff') {
            // Crisp tactile puff print drop shadow + rim highlight
            targetCtx.save();
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            targetCtx.shadowBlur = 6;
            targetCtx.shadowOffsetX = 0;
            targetCtx.shadowOffsetY = 3;
            targetCtx.fillStyle = layer.textColor || '#000000';
            targetCtx.fillText(layer.text, 0, 0);
            targetCtx.shadowColor = 'rgba(255, 255, 255, 0.35)';
            targetCtx.shadowBlur = 2;
            targetCtx.shadowOffsetY = -1.5;
            targetCtx.fillText(layer.text, 0, 0);
            targetCtx.restore();
          } else if (pType === 'embroidery') {
            // Embroidered thread lettering with stitch stroke and relief
            targetCtx.save();
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.38)';
            targetCtx.shadowBlur = 3;
            targetCtx.shadowOffsetY = 1.5;
            targetCtx.fillStyle = layer.textColor || '#000000';
            targetCtx.fillText(layer.text, 0, 0);
            // Satin stitch stroke
            targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            targetCtx.lineWidth = 1.5;
            targetCtx.strokeText(layer.text, 0, 0);
            targetCtx.restore();
          } else if (pType === 'metallic') {
            // Shimmering metallic gold/silver foil lettering
            targetCtx.save();
            const textMetrics = targetCtx.measureText(layer.text);
            const textW = textMetrics.width || 200;
            const textGrad = targetCtx.createLinearGradient(-textW / 2, -fontSize / 2, textW / 2, fontSize / 2);
            textGrad.addColorStop(0, '#ffd700');
            textGrad.addColorStop(0.3, '#ffffff');
            textGrad.addColorStop(0.6, '#d4af37');
            textGrad.addColorStop(1, '#fff8dc');
            targetCtx.fillStyle = textGrad;
            targetCtx.shadowColor = 'rgba(212, 175, 55, 0.4)';
            targetCtx.shadowBlur = 5;
            targetCtx.fillText(layer.text, 0, 0);
            targetCtx.restore();
          } else if (pType === 'gloss') {
            // High-gloss wet silicone gel lettering
            targetCtx.save();
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            targetCtx.shadowBlur = 4;
            targetCtx.shadowOffsetY = 2;
            targetCtx.fillStyle = layer.textColor || '#000000';
            targetCtx.fillText(layer.text, 0, 0);
            targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            targetCtx.lineWidth = 1;
            targetCtx.strokeText(layer.text, 0, -1);
            targetCtx.restore();
          } else {
            targetCtx.fillStyle = layer.textColor || '#000000';
            targetCtx.fillText(layer.text, 0, 0);
          }
        }

        targetCtx.restore();
      });
    });

    // Notify Three.js that the primary garment texture has been updated
    if (this.texture) {
      this.texture.needsUpdate = true;
    }
    // Only upload decalTexture when active garment requires it
    if (isDecalGarment && this.decalTexture) {
      this.decalTexture.needsUpdate = true;
    }
  }

  dispose() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.listeners = [];
  }
}
