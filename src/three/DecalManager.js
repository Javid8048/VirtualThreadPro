import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

/**
 * Manages dynamic 2D artwork projection (Decals) onto the 3D garment.
 */
export class DecalManager {
  constructor(scene, apparelMesh, fabricManager) {
    this.scene = scene;
    this.apparelMesh = apparelMesh;
    this.fabricManager = fabricManager;

    this.decalMesh = null;
    this.currentTexture = null;
    this.textureLoader = new THREE.TextureLoader();

    // Default placement settings
    this.state = {
      side: 'front', // 'front' | 'back'
      posX: 0,       // -0.6 to 0.6
      posY: 0.25,    // -0.8 to 0.8
      scale: 0.65,   // 0.2 to 1.4
      rotation: 0,   // degrees
      printType: 'screen' // 'screen' | 'puff'
    };
  }

  /**
   * Load artwork from Image DataURL / file object URL
   */
  loadArtwork(imageUrl) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        imageUrl,
        (texture) => {
          this.currentTexture = texture;
          this.applyDecal();
          resolve(texture);
        },
        undefined,
        (err) => {
          console.error('Failed to load artwork texture:', err);
          reject(err);
        }
      );
    });
  }

  /**
   * Updates decal transformation parameters
   */
  updateSettings(newSettings) {
    this.state = { ...this.state, ...newSettings };
    this.applyDecal();
  }

  /**
   * Re-calculates and projects decal onto the apparel mesh
   */
  applyDecal() {
    if (!this.currentTexture || !this.apparelMesh) return;

    // Remove existing decal mesh if present
    if (this.decalMesh) {
      this.scene.remove(this.decalMesh);
      if (this.decalMesh.geometry) this.decalMesh.geometry.dispose();
      this.decalMesh = null;
    }

    const { side, posX, posY, scale, rotation, printType } = this.state;
    const isFront = side === 'front';

    // Target position on chest/back curve
    // In our apparel geometry, z is ~0.45 at chest front, -0.45 at back
    const targetZ = isFront ? 0.44 : -0.44;
    const position = new THREE.Vector3(posX, posY, targetZ);

    // Orientation: Normal faces outwards from garment
    const orientation = new THREE.Euler(
      0,
      isFront ? 0 : Math.PI,
      THREE.MathUtils.degToRad(rotation)
    );

    // Decal dimensions (width, height, projection depth)
    const aspect = this.currentTexture.image
      ? this.currentTexture.image.width / this.currentTexture.image.height
      : 1;

    let width = scale;
    let height = scale / aspect;

    // Keep within reasonable bounds
    if (height > 1.2) {
      height = 1.2;
      width = height * aspect;
    }

    const size = new THREE.Vector3(width, height, 0.45);

    try {
      const decalGeometry = new DecalGeometry(
        this.apparelMesh,
        position,
        orientation,
        size
      );

      const decalMaterial = this.fabricManager.createDecalMaterial(
        this.currentTexture,
        printType
      );

      this.decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
      this.decalMesh.renderOrder = 1;
      this.scene.add(this.decalMesh);
    } catch (e) {
      console.warn('Decal projection error:', e);
    }
  }

  clearDecal() {
    if (this.decalMesh) {
      this.scene.remove(this.decalMesh);
      if (this.decalMesh.geometry) this.decalMesh.geometry.dispose();
      this.decalMesh = null;
    }
    this.currentTexture = null;
  }
}
