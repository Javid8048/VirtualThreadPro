import * as THREE from 'three';

/**
 * Handles turntable 360, wind flutter physics, walking bounce, and showroom floating.
 */
export class AnimationController {
  constructor(garmentGroup, apparelMesh) {
    this.group = garmentGroup;
    this.mesh = apparelMesh;

    // Cache original vertex positions for wind physics
    if (this.mesh && this.mesh.geometry) {
      this.basePositions = this.mesh.geometry.attributes.position.clone();
    }

    this.mode = 'turntable'; // 'turntable' | 'wind' | 'walk' | 'float' | 'none'
    this.turntableSpeed = 0.8;
    this.windIntensity = 1.0;
    this.time = 0;
  }

  setMode(mode) {
    this.mode = mode;
    // Reset positions if switching away from wind
    if (mode !== 'wind' && this.basePositions && this.mesh) {
      const pos = this.mesh.geometry.attributes.position;
      pos.copy(this.basePositions);
      pos.needsUpdate = true;
      this.mesh.geometry.computeVertexNormals();
    }
  }

  update(delta) {
    this.time += delta;

    if (this.mode === 'none') {
      // Return to center gently
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, 0, 0.05);
      this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, 0, 0.05);
      this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, 0, 0.05);
      return;
    }

    // 1. Turntable 360 rotation
    if (this.mode === 'turntable') {
      this.group.rotation.y += delta * this.turntableSpeed;
      this.group.position.y = Math.sin(this.time * 1.5) * 0.03; // subtle floating feel
      this.group.rotation.z = 0;
    }

    // 2. Wind Flutter Cloth Simulation (Vertex wave harmonics)
    else if (this.mode === 'wind') {
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, 0.35, 0.04);
      this.group.position.y = Math.sin(this.time * 2.0) * 0.02;

      if (this.mesh && this.basePositions) {
        const pos = this.mesh.geometry.attributes.position;
        const base = this.basePositions;
        const count = pos.count;
        const t = this.time * 6.5;

        for (let i = 0; i < count; i++) {
          const bx = base.getX(i);
          const by = base.getY(i);
          const bz = base.getZ(i);

          // Folds flutter more toward the bottom hem (by < 0)
          const bottomFactor = THREE.MathUtils.clamp(1.0 - (by + 1.3) / 2.7, 0.15, 1.0);
          
          // Progressive aerodynamic traveling sine wave
          const waveZ = Math.sin(t + by * 4.5 + bx * 2.0) * 0.035 * bottomFactor * this.windIntensity;
          const waveX = Math.cos(t * 0.8 + by * 3.0) * 0.015 * bottomFactor * this.windIntensity;

          pos.setXYZ(i, bx + waveX, by, bz + waveZ);
        }

        pos.needsUpdate = true;
      }
    }

    // 3. Invisible Model Walking Bounce
    else if (this.mode === 'walk') {
      const stepFreq = 4.8;
      // Vertical walking rhythm (bounces twice per stride)
      this.group.position.y = Math.abs(Math.sin(this.time * stepFreq)) * 0.07 - 0.03;
      // Hip sway & roll
      this.group.rotation.z = Math.sin(this.time * (stepFreq * 0.5)) * 0.045;
      // Slight forward/backward stride pitch
      this.group.rotation.x = Math.sin(this.time * stepFreq) * 0.025;
      // Slow rotation so the walk is viewable from angles
      this.group.rotation.y += delta * 0.25;
    }

    // 4. Floating Showroom Sway
    else if (this.mode === 'float') {
      this.group.position.y = Math.sin(this.time * 1.8) * 0.08;
      this.group.rotation.z = Math.sin(this.time * 1.2) * 0.03;
      this.group.rotation.y = Math.sin(this.time * 0.7) * 0.35;
    }
  }

  setTurntableSpeed(speed) {
    this.turntableSpeed = speed;
  }
}
