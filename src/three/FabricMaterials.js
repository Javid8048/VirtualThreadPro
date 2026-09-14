import * as THREE from 'three';
import {
  createCottonNormalMap,
  createCottonRoughnessMap,
  createAcidWashTexture
} from '../utils/textureGenerator';

/**
 * Manages realistic garment materials and fabric finishes using standard Three.js materials.
 * Fully compatible across all WebGL devices with zero shader compilation issues.
 */
export class FabricMaterialManager {
  constructor() {
    this.cottonNormalMap = createCottonNormalMap(512);
    this.cottonRoughnessMap = createCottonRoughnessMap(256);
    this.acidWashMap = createAcidWashTexture(512);

    this.currentFinish = 'cotton'; // 'cotton' | 'acid_wash' | 'vintage_fade'
    this.currentColor = '#14161b'; // default vintage washed black

    this.garmentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.currentColor),
      roughness: 0.86,
      metalness: 0.03,
      normalMap: this.cottonNormalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: this.cottonRoughnessMap,
      side: THREE.DoubleSide
    });
  }

  setColor(hex) {
    this.currentColor = hex;
    this.garmentMaterial.color.set(hex);
    this.garmentMaterial.needsUpdate = true;
  }

  setFinish(finishName) {
    this.currentFinish = finishName;

    if (finishName === 'acid_wash') {
      this.garmentMaterial.map = this.acidWashMap;
      this.garmentMaterial.roughness = 0.92;
      this.garmentMaterial.normalScale.set(0.9, 0.9);
    } else if (finishName === 'vintage_fade') {
      this.garmentMaterial.map = this.acidWashMap;
      this.garmentMaterial.roughness = 0.88;
      this.garmentMaterial.normalScale.set(0.75, 0.75);
    } else {
      // standard clean raw cotton
      this.garmentMaterial.map = null;
      this.garmentMaterial.roughness = 0.86;
      this.garmentMaterial.normalScale.set(0.65, 0.65);
    }

    this.garmentMaterial.needsUpdate = true;
  }

  /**
   * Creates material for artwork decals (Screen Print vs 3D Puff Print)
   */
  createDecalMaterial(texture, printType = 'screen') {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    const isPuff = printType === 'puff';

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      roughness: isPuff ? 0.35 : 0.82, // Puff print has tactile rubbery sheen
      metalness: 0.02,
      bumpMap: isPuff ? texture : null,
      bumpScale: isPuff ? 0.085 : 0.005, // 3D raised relief
      side: THREE.DoubleSide
    });

    return mat;
  }
}
