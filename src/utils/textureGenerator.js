import * as THREE from 'three';

/**
 * Procedural cotton weave normal map generator.
 * Creates an ultra-crisp woven fabric texture without external image downloads.
 */
export function createCottonNormalMap(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fill neutral normal (0.5, 0.5, 1.0) -> RGB(128, 128, 255)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  const freq = 0.35; // Weave density
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Weave pattern: cross-thread sine pattern
      const wx = Math.sin(x * freq) * Math.cos(y * freq * 0.5);
      const wy = Math.sin(y * freq) * Math.cos(x * freq * 0.5);
      
      // Perturb normal vectors
      const nx = 128 + Math.round(wx * 28);
      const ny = 128 + Math.round(wy * 28);
      
      data[idx] = Math.min(255, Math.max(0, nx));
      data[idx + 1] = Math.min(255, Math.max(0, ny));
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural cotton roughness map generator
 */
export function createCottonRoughnessMap(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b0b0b0';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 25;
    const val = Math.min(255, Math.max(160, 190 + noise));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Acid / Mineral Wash overlay texture
 */
export function createAcidWashTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Multi-octave organic cloud splatter
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const rad = 25 + Math.random() * 90;
    const alpha = 0.05 + Math.random() * 0.12;
    const isDark = Math.random() > 0.4;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, isDark ? `rgba(180,180,180,${alpha})` : `rgba(255,255,255,${alpha})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Default starter graphic logos for instant preview
 */
export function createDefaultLogos() {
  // 1. Streetwear Heavy Typography
  const c1 = document.createElement('canvas');
  c1.width = 1024;
  c1.height = 1024;
  const ctx1 = c1.getContext('2d');
  
  ctx1.clearRect(0, 0, 1024, 1024);
  ctx1.fillStyle = '#ffffff';
  ctx1.font = '900 108px "Inter", sans-serif';
  ctx1.textAlign = 'center';
  ctx1.fillText('VIRTUAL', 512, 430);
  
  ctx1.fillStyle = '#4258d8';
  ctx1.font = '900 116px "Inter", sans-serif';
  ctx1.fillText('THREADS', 512, 530);

  ctx1.strokeStyle = '#ffffff';
  ctx1.lineWidth = 6;
  ctx1.strokeRect(212, 310, 600, 270);

  ctx1.fillStyle = '#a0a0a0';
  ctx1.font = '600 24px "JetBrains Mono", monospace';
  ctx1.fillText('EST. 2026 // STUDIO ARCHIVE // RAW FIT', 512, 630);

  // 2. Cyber Neon Star
  const c2 = document.createElement('canvas');
  c2.width = 1024;
  c2.height = 1024;
  const ctx2 = c2.getContext('2d');
  
  ctx2.clearRect(0, 0, 1024, 1024);
  
  // Star geometry
  ctx2.save();
  ctx2.translate(512, 460);
  ctx2.fillStyle = '#ff0055';
  ctx2.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 180 : 70;
    const a = (i * Math.PI) / 4;
    if (i === 0) ctx2.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx2.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx2.closePath();
  ctx2.fill();
  ctx2.restore();

  ctx2.fillStyle = '#ffffff';
  ctx2.font = '800 64px "Inter", sans-serif';
  ctx2.textAlign = 'center';
  ctx2.fillText('NEO DISTRICT', 512, 720);

  // 3. Minimalist Acid Face
  const c3 = document.createElement('canvas');
  c3.width = 1024;
  c3.height = 1024;
  const ctx3 = c3.getContext('2d');
  
  ctx3.clearRect(0, 0, 1024, 1024);
  ctx3.strokeStyle = '#e6ff00';
  ctx3.lineWidth = 18;
  ctx3.beginPath();
  ctx3.arc(512, 512, 220, 0, Math.PI * 2);
  ctx3.stroke();

  // Cross eyes
  ctx3.fillStyle = '#e6ff00';
  ctx3.font = 'bold 80px sans-serif';
  ctx3.textAlign = 'center';
  ctx3.fillText('✕', 430, 480);
  ctx3.fillText('✕', 594, 480);

  // Wavy smile
  ctx3.beginPath();
  ctx3.lineWidth = 16;
  ctx3.arc(512, 530, 120, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx3.stroke();

  return [
    {
      id: 'vt-archive',
      name: 'VT Studio Archive',
      dataUrl: c1.toDataURL('image/png')
    },
    {
      id: 'neo-star',
      name: 'Neo District Star',
      dataUrl: c2.toDataURL('image/png')
    },
    {
      id: 'acid-face',
      name: 'Acid Smile Emblem',
      dataUrl: c3.toDataURL('image/png')
    }
  ];
}
