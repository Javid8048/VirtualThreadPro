import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ApparelMeshBuilder } from '../three/ApparelMesh';
import { getAssetUrl } from '../utils/assets';
import { ArrowRight, RotateCw, Sparkles, Shirt } from 'lucide-react';

const HERO_GARMENTS = [
  { id: 'oversized_tee', label: 'T-Shirt' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'sweatpants', label: 'Jogger' },
  { id: 'cap', label: 'Cap' }
];

const HERO_COLORS = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Washed Black', hex: '#14161b' },
  { name: 'Vintage Cream', hex: '#f0ede6' },
  { name: 'Forest Green', hex: '#263b2f' },
  { name: 'Cobalt Navy', hex: '#192848' },
  { name: 'Terracotta', hex: '#873a2b' }
];

export function Hero3DCanvas({ onLaunchStudio, theme = 'dark' }) {
  const mountRef = useRef(null);
  const [selectedGarment, setSelectedGarment] = useState('oversized_tee');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [isLoading, setIsLoading] = useState(false);

  // References for Three.js instance
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const garmentGroupRef = useRef(null);
  const materialRef = useRef(null);
  const animFrameIdRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 450;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.2);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // keep hero framing intact
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.6;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controls.minPolarAngle = Math.PI / 3;
    controls.target.set(0, 0.1, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0e8ff, 0.9);
    fillLight.position.set(-3, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 6. Base Garment Group
    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);
    garmentGroupRef.current = garmentGroup;

    // 7. Base Cloth Material
    const clothMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
    materialRef.current = clothMaterial;

    // 8. Sample Decal Graphic (Streetwear branding badge on chest)
    const decalCanvas = document.createElement('canvas');
    decalCanvas.width = 512;
    decalCanvas.height = 256;
    const dCtx = decalCanvas.getContext('2d');
    dCtx.fillStyle = '#000000';
    dCtx.font = 'bold 36px sans-serif';
    dCtx.textAlign = 'center';
    dCtx.fillText('VIRTUAL THREADS', 256, 110);
    dCtx.font = 'bold 16px monospace';
    dCtx.fillText('STUDIO ARCHIVE · 2026', 256, 160);

    const decalTexture = new THREE.CanvasTexture(decalCanvas);
    decalTexture.colorSpace = THREE.SRGBColorSpace;

    // 9. Initial Mesh Load
    loadGarmentMesh('oversized_tee', '#ffffff');

    // 10. Animation Loop
    let running = true;
    const animate = () => {
      if (!running) return;
      controls.update();
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 11. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth || 450;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      running = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Function to load and display garment mesh
  const loadGarmentMesh = (type, color) => {
    if (!garmentGroupRef.current || !materialRef.current) return;
    setIsLoading(true);

    const group = garmentGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    materialRef.current.color.set(color);

    if (type === 'oversized_tee' || type === 'regular_tee') {
      try {
        const fit = type === 'regular_tee' ? 'regular' : 'oversized';
        const geo = ApparelMeshBuilder.createTShirtGeometry(fit);
        const mesh = new THREE.Mesh(geo, materialRef.current);
        mesh.scale.set(0.72, 0.72, 0.72);
        mesh.position.set(0, -0.15, 0);
        group.add(mesh);
        setIsLoading(false);
      } catch (err) {
        console.error('Error creating procedural tee:', err);
        setIsLoading(false);
      }
    } else if (type === 'hoodie') {
      const loader = new GLTFLoader();
      loader.load(
        getAssetUrl('/models/hoodie.glb'),
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.color = new THREE.Color(color);
              child.material.roughness = 0.85;
            }
          });
          model.scale.set(0.68, 0.68, 0.68);
          model.position.set(-0.35, -0.25, 0);
          group.add(model);
          setIsLoading(false);
        },
        undefined,
        () => {
          // Fallback to procedural tee if hoodie fails
          loadGarmentMesh('oversized_tee', color);
        }
      );
    } else if (type === 'sweatpants') {
      const loader = new OBJLoader();
      loader.load(
        getAssetUrl('/models/pants.obj'),
        (obj) => {
          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = materialRef.current;
            }
          });
          obj.scale.set(0.78, 0.78, 0.78);
          obj.position.set(0, -0.65, 0);
          group.add(obj);
          setIsLoading(false);
        },
        undefined,
        () => setIsLoading(false)
      );
    } else if (type === 'cap') {
      const loader = new OBJLoader();
      loader.load(
        getAssetUrl('/models/cap.obj'),
        (obj) => {
          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = materialRef.current;
            }
          });
          obj.rotation.y = Math.PI;
          obj.scale.set(0.9, 0.9, 0.9);
          obj.position.set(0, -0.2, 0);
          group.add(obj);
          setIsLoading(false);
        },
        undefined,
        () => setIsLoading(false)
      );
    }
  };

  const handleSelectGarment = (id) => {
    setSelectedGarment(id);
    loadGarmentMesh(id, selectedColor);
  };

  const handleSelectColor = (hex) => {
    setSelectedColor(hex);
    if (materialRef.current) {
      materialRef.current.color.set(hex);
    }
    // Also update any child meshes in GLTF/OBJ
    if (garmentGroupRef.current) {
      garmentGroupRef.current.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) {
          child.material.color.set(hex);
        }
      });
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-[480px] mx-auto rounded-3xl bg-gradient-to-b from-gray-100/90 to-white/70 dark:from-[#181b22]/90 dark:to-[#111317]/90 border border-gray-200/90 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between p-4 select-none group">
      
      {/* Top Floating Pill: Blank Selector */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/90 dark:bg-black/60 backdrop-blur-md border border-gray-200/80 dark:border-white/10 shadow-xs">
          {HERO_GARMENTS.map((g) => {
            const isSelected = selectedGarment === g.id;
            return (
              <button
                key={g.id}
                onClick={() => handleSelectGarment(g.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-black dark:bg-white text-white dark:text-gray-900 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* 3D Interaction Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-gray-200/80 dark:border-white/10 text-[10px] font-bold text-gray-700 dark:text-gray-300">
          <RotateCw className="size-3 text-brand-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Drag to Rotate</span>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-2xs">
          <div className="size-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Bottom Floating Controls: Color Swatches & Customize Studio CTA */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Color Palette Swatches */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-black/60 backdrop-blur-md border border-gray-200/80 dark:border-white/10 shadow-xs">
          {HERO_COLORS.map((c) => {
            const isSelected = selectedColor === c.hex;
            return (
              <button
                key={c.hex}
                onClick={() => handleSelectColor(c.hex)}
                className={`size-5 rounded-full border transition-all ${
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/50 scale-110'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            );
          })}
        </div>

        {/* Launch Studio Button */}
        <button
          onClick={() => onLaunchStudio(selectedGarment, selectedColor)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all group-hover:shadow-brand-500/20"
        >
          <Sparkles className="size-3.5 text-brand-400 dark:text-indigo-600" />
          <span>Customize in 3D</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

    </div>
  );
}
