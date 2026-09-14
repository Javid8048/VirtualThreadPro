import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Procedural 3D Apparel Geometry Generator.
 * Generates realistic streetwear clothing meshes with natural draping folds,
 * seams, collar ribbing, and clean UV unwrapping.
 */
export class ApparelMeshBuilder {
  /**
   * Builds an oversized/boxy streetwear t-shirt geometry.
   */
  static createTShirtGeometry(fit = 'oversized') {
    const uSegments = 64;
    const vSegments = 72;

    const positions = [];
    const uvs = [];
    const normals = [];
    const indices = [];

    const isBoxy = fit === 'oversized';
    const shoulderWidth = isBoxy ? 2.3 : 1.95;
    const chestWidth = isBoxy ? 2.1 : 1.8;
    const hemWidth = isBoxy ? 2.05 : 1.75;
    const totalHeight = 2.5;
    const depth = isBoxy ? 0.8 : 0.7;

    // Generate torso vertices
    for (let j = 0; j <= vSegments; j++) {
      const v = j / vSegments;
      const baseY = (v - 0.5) * totalHeight;

      // Width varies from bottom hem to chest to shoulder
      let currentW;
      if (v < 0.65) {
        currentW = THREE.MathUtils.lerp(hemWidth, chestWidth, v / 0.65);
      } else {
        currentW = THREE.MathUtils.lerp(chestWidth, shoulderWidth, (v - 0.65) / 0.35);
      }

      const currentD = depth * (1.0 - Math.pow(v - 0.5, 2) * 0.2);

      for (let i = 0; i <= uSegments; i++) {
        const u = i / uSegments;
        const angle = u * Math.PI * 2;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Superellipse cross-section (boxy streetwear silhouette)
        const n = isBoxy ? 2.8 : 2.2;
        const signX = Math.sign(sinA);
        const signZ = Math.sign(cosA);
        let x = signX * Math.pow(Math.abs(sinA), 2 / n) * (currentW * 0.5);
        let y = baseY;
        let z = signZ * Math.pow(Math.abs(cosA), 2 / n) * (currentD * 0.5);

        // Collar cutout at top
        if (v > 0.82) {
          const collarFactor = (v - 0.82) / 0.18;
          const neckDrop = Math.max(0, 1.0 - Math.abs(x) / 0.52);
          if (z > 0) {
            // Front neckline drops lower
            y -= collarFactor * neckDrop * 0.32;
            z -= collarFactor * neckDrop * 0.14;
          } else {
            // Back neckline is higher
            y -= collarFactor * neckDrop * 0.12;
            z += collarFactor * neckDrop * 0.08;
          }
        }

        // Natural cloth drape & subtle folds
        const sideFold = Math.sin(v * Math.PI * 5 + angle * 2) * 0.018 * (1.0 - v * 0.5);
        const frontHang = (z > 0 ? Math.sin(v * Math.PI * 2) * 0.035 : 0);
        const waistCrease = Math.sin(v * 12.0) * Math.cos(angle * 2) * 0.01;

        x += Math.sin(angle) * sideFold;
        z += Math.abs(cosA) * (sideFold + waistCrease) + frontHang;

        // Bottom hem ripple
        if (v < 0.06) {
          const hemFactor = 1.0 - v / 0.06;
          z += Math.cos(angle * 10) * 0.012 * hemFactor;
        }

        positions.push(x, y, z);
        uvs.push(u, v);

        const nx = sinA;
        const ny = (v > 0.85 ? 0.5 : 0);
        const nz = cosA;
        const norm = new THREE.Vector3(nx, ny, nz).normalize();
        normals.push(norm.x, norm.y, norm.z);
      }
    }

    // Connect indices for torso
    for (let j = 0; j < vSegments; j++) {
      for (let i = 0; i < uSegments; i++) {
        const a = j * (uSegments + 1) + i;
        const b = (j + 1) * (uSegments + 1) + i;
        const c = (j + 1) * (uSegments + 1) + (i + 1);
        const d = j * (uSegments + 1) + (i + 1);

        // Counter-clockwise triangle winding
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }

    const torsoGeo = new THREE.BufferGeometry();
    torsoGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    torsoGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    torsoGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    torsoGeo.setIndex(indices);
    torsoGeo.computeVertexNormals();

    // Sleeves
    const leftSleeveGeo = this.createSleeveGeometry(1, isBoxy);
    const rightSleeveGeo = this.createSleeveGeometry(-1, isBoxy);

    // Collar
    const collarGeo = this.createCollarGeometry();

    // Merge into single seamless geometry
    const merged = mergeGeometries([torsoGeo, leftSleeveGeo, rightSleeveGeo, collarGeo], false);
    merged.computeVertexNormals();
    return merged;
  }

  /**
   * Creates dropped-shoulder streetwear sleeve
   */
  static createSleeveGeometry(side = 1, isBoxy = true) {
    const segmentsR = 24;
    const segmentsH = 20;
    const sleeveLength = isBoxy ? 0.95 : 0.8;
    const topRadius = isBoxy ? 0.52 : 0.44;
    const cuffRadius = isBoxy ? 0.45 : 0.38;

    const geo = new THREE.CylinderGeometry(
      topRadius,
      cuffRadius,
      sleeveLength,
      segmentsR,
      segmentsH,
      true
    );

    // Rotate and translate sleeve into shoulder position
    geo.rotateZ(side * (-Math.PI / 3.4));
    geo.rotateY(side * 0.12);
    geo.translate(side * (isBoxy ? 1.45 : 1.25), 0.65, 0.02);

    // Natural arm crease displacement
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      if (y < 0.65 && Math.abs(x) < 1.3) {
        y -= 0.035 * Math.sin(z * 4.0);
      }
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Creates ribbed crewneck collar rim
   */
  static createCollarGeometry() {
    const curve = new THREE.EllipseCurve(
      0, 0,
      0.44, 0.36,
      0, 2 * Math.PI,
      false,
      0
    );
    const points = curve.getPoints(36);
    const collarPts = points.map(p => new THREE.Vector3(p.x, 0, p.y));
    const collarPath = new THREE.CatmullRomCurve3(collarPts, true);

    const tubeGeo = new THREE.TubeGeometry(collarPath, 48, 0.045, 12, true);
    tubeGeo.rotateX(Math.PI * 0.1);
    tubeGeo.translate(0, 1.0, 0.04);
    return tubeGeo;
  }
}
