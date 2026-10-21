import * as THREE from 'three';
import { isGarmentDark, getContrastedSvg, svgToImage } from '../utils/presetGraphics';

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
    const isHoodie = this.garmentType === 'hoodie' || this.garmentType === 'zip_hoodie';
    let defaultX = 480;
    let defaultY = 720;

    if (side === 'back') {
      defaultX = isHoodie ? 416 : 1528;
      defaultY = isHoodie ? 1530 : 1528;
    } else if (side === 'left_sleeve') {
      defaultX = 1660;
      defaultY = 770;
    } else if (side === 'right_sleeve') {
      defaultX = 1660;
      defaultY = 1520;
    } else {
      defaultX = isHoodie ? 430 : 480;
      defaultY = isHoodie ? 730 : 720;
    }

    // Auto-contrast default text/shape color for dark garment shades
    const defaultTextColor = isGarmentDark(this.garmentColor) ? '#ffffff' : '#000000';
    const defaultShapeFill = isGarmentDark(this.garmentColor) ? '#ffffff' : '#111827';
    const defaultShapeStroke = isGarmentDark(this.garmentColor) ? '#374151' : '#e5e7eb';

    const defaultLayer = {
      id: 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: 'image', // 'image' | 'text' | 'shape'
      side: side, // 'front' | 'back' | 'left_sleeve' | 'right_sleeve'
      image: null, // HTMLImageElement or dataUrl
      text: 'VIRTUAL THREADS',
      textColor: defaultTextColor,
      fontSize: 12,
      fontFamily: 'Roboto',
      shapeType: 'rectangle', // 'rectangle' | 'circle' | 'star' | 'triangle' | 'badge'
      fillColor: defaultShapeFill,
      strokeColor: defaultShapeStroke,
      strokeWidth: 2,
      width: 280,
      height: 180,
      x: defaultX,
      y: defaultY,
      scale: 1.0,
      rotation: 0, // degrees
      opacity: 1.0,
      printType: 'screen' // 'screen' | 'puff' | 'embroidery' | 'metallic' | 'gloss'
    };

    const newLayer = { ...defaultLayer, ...layer };

    // If layer has a preset SVG and is placed on dark garment, ensure light contrasted print
    if (newLayer.presetSvg && isGarmentDark(this.garmentColor) && !newLayer._hasContrasted) {
      newLayer._hasContrasted = true;
      svgToImage(newLayer.presetSvg, this.garmentColor).then(({ img, dataUrl }) => {
        newLayer.image = img;
        newLayer.dataUrl = dataUrl;
        this.scheduleRender();
        this.notify();
      }).catch(console.error);
    }

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
    if (this.garmentType !== type) {
      this.garmentType = type;
      this.render();
      this.notify();
    }
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

  /**
   * Renders the authentic Polo Shirt 3 design from Sketchfab reference:
   * Deep navy shoulder yoke, 5 bold chest rugby block stripes (white, navy, yellow, navy, yellow),
   * clean white body with alternating navy & yellow pinstripes, and matching sleeve stripes with white cuffs.
   */
  drawPoloDesign(ctx, S) {
    const navy = '#1a243f';
    const yellow = '#ffd000';
    const bodyBase = this.garmentColor || '#ffffff';

    // 1. Solid base body fill
    ctx.fillStyle = bodyBase;
    ctx.fillRect(0, 0, S, S);

    // 2. Deep navy shoulder yoke and collar base (Y: 0 to 720)
    ctx.fillStyle = navy;
    ctx.fillRect(0, 0, S, 720);

    // 3. Bold rugby chest block stripes across front & back (Y: 720 to 1100)
    // White / bodyBase band
    ctx.fillStyle = bodyBase;
    ctx.fillRect(0, 720, S, 75);
    // Navy band
    ctx.fillStyle = navy;
    ctx.fillRect(0, 795, S, 75);
    // Vibrant Golden Yellow band
    ctx.fillStyle = yellow;
    ctx.fillRect(0, 870, S, 75);
    // Navy band
    ctx.fillStyle = navy;
    ctx.fillRect(0, 945, S, 75);
    // Vibrant Golden Yellow band
    ctx.fillStyle = yellow;
    ctx.fillRect(0, 1020, S, 80);

    // 4. Alternating thin pinstripes on lower body & back (Y: 1100 to 1660)
    const pinstripes = [
      { y: 1180, color: navy },
      { y: 1255, color: yellow },
      { y: 1330, color: navy },
      { y: 1405, color: yellow },
      { y: 1480, color: navy },
      { y: 1555, color: yellow },
      { y: 1630, color: navy }
    ];
    pinstripes.forEach((stripe) => {
      ctx.fillStyle = stripe.color;
      ctx.fillRect(0, stripe.y, S, 14);
    });

    // 5. Sleeves (Y: 1720 to 2048)
    // Sleeve cap / upper sleeve (Navy continuous with shoulder yoke)
    ctx.fillStyle = navy;
    ctx.fillRect(0, 1720, S, 50);
    // Matching block stripes down the sleeves
    ctx.fillStyle = bodyBase;
    ctx.fillRect(0, 1770, S, 40);
    ctx.fillStyle = navy;
    ctx.fillRect(0, 1810, S, 40);
    ctx.fillStyle = yellow;
    ctx.fillRect(0, 1850, S, 40);
    ctx.fillStyle = navy;
    ctx.fillRect(0, 1890, S, 40);
    ctx.fillStyle = yellow;
    ctx.fillRect(0, 1930, S, 45);
    // Crisp white ribbed sleeve cuffs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 1975, S, S - 1975);
  }

  /**
   * Renders athletic French terry sweat t-shirt / sweatshirt details:
   * Authentic athletic V-notch triangle twin-stitch at front center neckline.
   */
  drawSweatshirtDetails(ctx, S) {
    ctx.save();
    const vx = 488;
    const vy = 605;
    const vw = 38;
    const vh = 60;

    // Outer V stitch groove
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(vx - vw, vy);
    ctx.lineTo(vx, vy + vh);
    ctx.lineTo(vx + vw, vy);
    ctx.stroke();

    // Inner parallel stitch
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(vx - vw + 6, vy);
    ctx.lineTo(vx, vy + vh - 8);
    ctx.lineTo(vx + vw - 6, vy);
    ctx.stroke();

    // Subtle highlight stitch for 3D ridge depth
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(vx - vw + 2, vy + 2);
    ctx.lineTo(vx, vy + vh + 2);
    ctx.lineTo(vx + vw - 2, vy + 2);
    ctx.stroke();

    ctx.restore();
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

    // 1. Fill base garment color
    ctx.fillStyle = this.garmentColor;
    ctx.fillRect(0, 0, S, S);

    // 2. Micro textile weave texture overlay for authentic tactile cotton feel
    if (!this.fabricPattern) {
      this.initFabricPattern();
    }
    if (this.fabricPattern) {
      ctx.save();
      // Subtle weave shading for matte woven cotton depth
      ctx.globalAlpha = (this.fabricFinish === 'heavy_terry' || this.garmentType === 'sweatshirt' || this.garmentType === 'sweat_tshirt') ? 0.12 : 0.06;
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

    // 2. Only render to decalCanvas if the active garment actually uses 3D floating decals (hoodie, pants, cap, regular tee)
    const isDecalGarment = this.garmentType && (
      this.garmentType === 'hoodie' ||
      this.garmentType === 'zip_hoodie' ||
      this.garmentType === 'hanging_hoodie' ||
      this.garmentType === 'regular_tee'
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
        } else if (layer.type === 'shape') {
          const w = (layer.width || 300) * (layer.scale || 1.0);
          const h = (layer.height || (layer.shapeType === 'circle' ? w : 200)) * (layer.scale || 1.0);
          const shape = layer.shapeType || 'rectangle';
          const fill = layer.fillColor || '#ffffff';
          const stroke = layer.strokeColor || '#000000';
          const strokeW = (layer.strokeWidth || 0) * (layer.scale || 1.0);

          targetCtx.save();
          targetCtx.fillStyle = fill;
          targetCtx.strokeStyle = stroke;
          targetCtx.lineWidth = strokeW;

          if (shape === 'rectangle') {
            targetCtx.beginPath();
            targetCtx.rect(-w / 2, -h / 2, w, h);
            targetCtx.fill();
            if (strokeW > 0) targetCtx.stroke();
          } else if (shape === 'circle') {
            targetCtx.beginPath();
            targetCtx.arc(0, 0, w / 2, 0, Math.PI * 2);
            targetCtx.fill();
            if (strokeW > 0) targetCtx.stroke();
          } else if (shape === 'star') {
            targetCtx.beginPath();
            const spikes = 5;
            const outerRadius = w / 2;
            const innerRadius = outerRadius * 0.45;
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;
            targetCtx.moveTo(0, -outerRadius);
            for (let i = 0; i < spikes; i++) {
              targetCtx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
              rot += step;
              targetCtx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
              rot += step;
            }
            targetCtx.lineTo(0, -outerRadius);
            targetCtx.closePath();
            targetCtx.fill();
            if (strokeW > 0) targetCtx.stroke();
          } else if (shape === 'triangle') {
            targetCtx.beginPath();
            targetCtx.moveTo(0, -h / 2);
            targetCtx.lineTo(w / 2, h / 2);
            targetCtx.lineTo(-w / 2, h / 2);
            targetCtx.closePath();
            targetCtx.fill();
            if (strokeW > 0) targetCtx.stroke();
          } else if (shape === 'badge') {
            targetCtx.beginPath();
            targetCtx.moveTo(0, -h / 2);
            targetCtx.lineTo(w / 2, -h / 3);
            targetCtx.lineTo(w / 2, h / 6);
            targetCtx.quadraticCurveTo(w / 2, h / 2, 0, h / 2);
            targetCtx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 6);
            targetCtx.lineTo(-w / 2, -h / 3);
            targetCtx.closePath();
            targetCtx.fill();
            if (strokeW > 0) targetCtx.stroke();
          }
          targetCtx.restore();
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

  /**
   * Generates a high-resolution, print-ready isolated artwork PNG on transparent background
   * containing only the designs (front, back, or sleeves) without the garment background.
   */
  exportPrintReadyArtwork(side = 'front') {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.size;
    exportCanvas.height = this.size;
    const expCtx = exportCanvas.getContext('2d');
    if (!expCtx) return null;

    expCtx.imageSmoothingEnabled = true;
    expCtx.imageSmoothingQuality = 'high';

    const sideLayers = this.layers.filter((l) => (l.side || 'front') === side);

    sideLayers.forEach((layer) => {
      expCtx.save();
      expCtx.globalAlpha = layer.opacity || 1.0;
      expCtx.translate(layer.x, layer.y);
      if (layer.rotation) {
        expCtx.rotate((layer.rotation * Math.PI) / 180);
      }

      if (layer.type === 'image' && layer.image) {
        const img = layer.image;
        const baseW = 420;
        const aspect = img.width && img.height ? img.width / img.height : 1;
        const w = baseW * (layer.scale || 1.0);
        const h = w / aspect;
        expCtx.drawImage(img, -w / 2, -h / 2, w, h);
      } else if (layer.type === 'text' && layer.text) {
        const fontSize = ((layer.fontSize || 12) * 4) * (layer.scale || 1.0);
        expCtx.font = `bold ${fontSize}px "${layer.fontFamily || 'Roboto'}", sans-serif`;
        expCtx.textAlign = 'center';
        expCtx.textBaseline = 'middle';
        expCtx.fillStyle = layer.textColor || '#000000';
        expCtx.fillText(layer.text, 0, 0);
      } else if (layer.type === 'shape') {
        const w = (layer.width || 300) * (layer.scale || 1.0);
        const h = (layer.height || (layer.shapeType === 'circle' ? w : 200)) * (layer.scale || 1.0);
        const shape = layer.shapeType || 'rectangle';
        const fill = layer.fillColor || '#ffffff';
        const stroke = layer.strokeColor || '#000000';
        const strokeW = (layer.strokeWidth || 0) * (layer.scale || 1.0);

        expCtx.fillStyle = fill;
        expCtx.strokeStyle = stroke;
        expCtx.lineWidth = strokeW;

        if (shape === 'rectangle') {
          expCtx.beginPath();
          expCtx.rect(-w / 2, -h / 2, w, h);
          expCtx.fill();
          if (strokeW > 0) expCtx.stroke();
        } else if (shape === 'circle') {
          expCtx.beginPath();
          expCtx.arc(0, 0, w / 2, 0, Math.PI * 2);
          expCtx.fill();
          if (strokeW > 0) expCtx.stroke();
        } else if (shape === 'star') {
          expCtx.beginPath();
          const spikes = 5;
          const outerRadius = w / 2;
          const innerRadius = outerRadius * 0.45;
          let rot = (Math.PI / 2) * 3;
          const step = Math.PI / spikes;
          expCtx.moveTo(0, -outerRadius);
          for (let i = 0; i < spikes; i++) {
            expCtx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
            rot += step;
            expCtx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
            rot += step;
          }
          expCtx.lineTo(0, -outerRadius);
          expCtx.closePath();
          expCtx.fill();
          if (strokeW > 0) expCtx.stroke();
        } else if (shape === 'triangle') {
          expCtx.beginPath();
          expCtx.moveTo(0, -h / 2);
          expCtx.lineTo(w / 2, h / 2);
          expCtx.lineTo(-w / 2, h / 2);
          expCtx.closePath();
          expCtx.fill();
          if (strokeW > 0) expCtx.stroke();
        } else if (shape === 'badge') {
          expCtx.beginPath();
          expCtx.moveTo(0, -h / 2);
          expCtx.lineTo(w / 2, -h / 3);
          expCtx.lineTo(w / 2, h / 6);
          expCtx.quadraticCurveTo(w / 2, h / 2, 0, h / 2);
          expCtx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 6);
          expCtx.lineTo(-w / 2, -h / 3);
          expCtx.closePath();
          expCtx.fill();
          if (strokeW > 0) expCtx.stroke();
        }
      }

      expCtx.restore();
    });

    return exportCanvas.toDataURL('image/png');
  }

  dispose() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.listeners = [];
  }
}
