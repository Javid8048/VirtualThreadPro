import * as THREE from 'three';

/**
 * Manages the master 2048x2048 texture canvas that is mapped directly onto the 3D T-shirt.
 * Eliminates floating decals by baking artwork, text, and colors directly into the UV map.
 */
export class CanvasDesignManager {
  constructor(garmentColor = '#ffffff') {
    this.size = 2048;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d');

    this.garmentColor = garmentColor;
    this.fabricFinish = 'cotton'; // 'cotton' | 'acid_wash' | 'vintage_fade'

    // Artwork and Text layers
    this.layers = [];
    this.activeLayerId = null;
    this.listeners = [];

    // Three.js Texture (High-resolution with 16x anisotropic filtering to eliminate blur in motion)
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.flipY = false; // Required for GLTF UV coordinates
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = true;
    this.texture.anisotropy = 16;

    // Dedicated Transparent Decal Texture (Zero background patch on 3D meshes)
    this.decalCanvas = document.createElement('canvas');
    this.decalCanvas.width = this.size;
    this.decalCanvas.height = this.size;
    this.decalCtx = this.decalCanvas.getContext('2d');

    this.decalTexture = new THREE.CanvasTexture(this.decalCanvas);
    this.decalTexture.flipY = false;
    this.decalTexture.colorSpace = THREE.SRGBColorSpace;
    this.decalTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.decalTexture.magFilter = THREE.LinearFilter;
    this.decalTexture.generateMipmaps = true;
    this.decalTexture.anisotropy = 16;

    // Initial render
    this.render();
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
      x: side === 'back' ? 1520 : 530,
      y: 800,
      scale: 1.0,
      rotation: 0, // degrees
      opacity: 1.0,
      printType: 'puff' // 'screen' | 'puff'
    };

    const newLayer = { ...defaultLayer, ...layer };
    this.layers.push(newLayer);
    this.activeLayerId = newLayer.id;
    this.render();
    this.notify();
    return newLayer;
  }

  getLayersBySide(side) {
    return this.layers.filter((l) => (l.side || 'front') === side);
  }

  updateLayer(id, updates) {
    const idx = this.layers.findIndex((l) => l.id === id);
    if (idx !== -1) {
      this.layers[idx] = { ...this.layers[idx], ...updates };
      this.render();
      this.notify();
    }
  }

  removeLayer(id) {
    this.layers = this.layers.filter((l) => l.id !== id);
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers[0]?.id || null;
    }
    this.render();
    this.notify();
  }

  clearLayersBySide(side) {
    this.layers = this.layers.filter((l) => (l.side || 'front') !== side);
    if (!this.layers.find((l) => l.id === this.activeLayerId)) {
      this.activeLayerId = this.layers[0]?.id || null;
    }
    this.render();
    this.notify();
  }

  clearLayers() {
    this.layers = [];
    this.activeLayerId = null;
    this.render();
    this.notify();
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

    // 2. Decal canvas is 100% transparent (clear) so non-tshirt 3D meshes show pure cloth
    if (dCtx) {
      dCtx.clearRect(0, 0, S, S);
    }

    // 3. Render all design layers to both the main UV canvas and the transparent decal canvas
    const targets = dCtx ? [ctx, dCtx] : [ctx];

    this.layers.forEach((layer) => {
      targets.forEach((targetCtx) => {
        targetCtx.save();
        targetCtx.globalAlpha = layer.opacity || 1.0;

        // Position center
        targetCtx.translate(layer.x, layer.y);
        if (layer.rotation) {
          targetCtx.rotate((layer.rotation * Math.PI) / 180);
        }

        if (layer.type === 'image' && layer.image) {
          const img = layer.image;
          const baseW = 420;
          const aspect = img.width && img.height ? img.width / img.height : 1;
          const w = baseW * (layer.scale || 1.0);
          const h = w / aspect;

          // Puff print: apply rich 3D embossed depth and subtle drop shadow
          if (layer.printType === 'puff') {
            targetCtx.save();
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.42)';
            targetCtx.shadowBlur = 12;
            targetCtx.shadowOffsetX = 0;
            targetCtx.shadowOffsetY = 6;
            targetCtx.drawImage(img, -w / 2, -h / 2, w, h);
            targetCtx.restore();

            // Crisp top bevel highlight
            targetCtx.save();
            targetCtx.globalCompositeOperation = 'source-atop';
            targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
            targetCtx.lineWidth = 3;
            targetCtx.strokeRect(-w / 2, -h / 2, w, h);
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

          if (layer.printType === 'puff') {
            // Rich puff print drop shadow
            targetCtx.save();
            targetCtx.shadowColor = 'rgba(0, 0, 0, 0.50)';
            targetCtx.shadowBlur = 14;
            targetCtx.shadowOffsetX = 0;
            targetCtx.shadowOffsetY = 6;
            targetCtx.fillStyle = layer.textColor || '#000000';
            targetCtx.fillText(layer.text, 0, 0);
            targetCtx.restore();

            // Bevel edge highlight
            targetCtx.save();
            targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            targetCtx.lineWidth = Math.max(1, fontSize * 0.035);
            targetCtx.strokeText(layer.text, 0, 0);
            targetCtx.restore();
          } else {
            targetCtx.fillStyle = layer.textColor || '#000000';
            targetCtx.fillText(layer.text, 0, 0);
          }
        }

        targetCtx.restore();
      });
    });

    // Notify Three.js that the textures have been updated
    if (this.texture) {
      this.texture.needsUpdate = true;
    }
    if (this.decalTexture) {
      this.decalTexture.needsUpdate = true;
    }
  }
}
