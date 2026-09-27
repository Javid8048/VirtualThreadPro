import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { CanvasDesignManager } from './CanvasDesignManager';
import { getAssetUrl } from '../utils/assets';

if (typeof window !== 'undefined') {
  window.__THREE__ = THREE;
}

/**
 * Inside Fabric Custom Shader Hook
 * Ensures external design prints / decals are strictly rendered on the FRONT faces,
 * while the interior of the shirt is always solid, clean garment fabric color.
 * Eliminates see-through bleed and mirrored reflections inside the collar/hem.
 */
function applyInsideFabricShader(material, getInsideColor, getAcidWashIntensity) {
  material.customProgramCacheKey = () => 'inside-fabric-shader-v9';
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uInsideColor = { value: new THREE.Color(getInsideColor()) };
    shader.uniforms.uAcidWash = { value: 0.0 };
    shader.uniforms.uKnitProgress = { value: 1.0 };
    shader.uniforms.uKnitTime = { value: 0.0 };

    shader.fragmentShader = `
      uniform vec3 uInsideColor;
      uniform float uAcidWash;
      uniform float uKnitProgress;
      uniform float uKnitTime;
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
        float knitCoordY = vMapUv.y;
      #elif defined( USE_UV )
        float knitCoordY = vUv.y;
      #else
        float knitCoordY = 1.0;
      #endif

      if (uKnitProgress < 0.999) {
        if (knitCoordY > uKnitProgress) {
          discard;
        }
      }

      #ifdef USE_MAP
        if (!gl_FrontFacing) {
          // Exterior fabric: render texture map and graphics
          vec4 sampledDiffuseColor = texture2D( map, vMapUv );
          #ifdef DECODE_VIDEO_TEXTURE
            sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
          #endif

          // Apply procedural Acid Wash vintage distress if enabled
          if (uAcidWash > 0.01) {
            float noise = fract(sin(dot(vMapUv * 80.0, vec2(12.9898, 78.233))) * 43758.5453);
            float blotch = sin(vMapUv.x * 25.0) * cos(vMapUv.y * 25.0) * 0.5 + 0.5;
            float wash = mix(noise, blotch, 0.65);
            vec3 washedColor = mix(sampledDiffuseColor.rgb, vec3(0.85), wash * 0.35 * uAcidWash);
            sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, washedColor, uAcidWash);
          }

          // Active weaving yarn thread line at knitting growth frontier
          if (uKnitProgress < 0.999) {
            float distEdge = uKnitProgress - knitCoordY;
            if (distEdge < 0.035) {
              float threadWeave = sin(vMapUv.x * 380.0 + uKnitTime * 14.0) * 0.5 + 0.5;
              vec3 yarnPulse = mix(vec3(0.92, 0.96, 1.0), vec3(0.40, 0.65, 1.0), threadWeave);
              sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, yarnPulse, 0.85);
            }
          }

          diffuseColor *= sampledDiffuseColor;
        } else {
          // Pure, pristine interior lining: strictly solid fabric color, zero bleed-through
          diffuseColor.rgb = uInsideColor;
        }
      #else
        if (gl_FrontFacing) {
          diffuseColor.rgb = uInsideColor;
        } else if (uKnitProgress < 0.999) {
          float distEdge = uKnitProgress - knitCoordY;
          if (distEdge < 0.035) {
            #ifdef USE_UV
              float threadWeave = sin(vUv.x * 380.0 + uKnitTime * 14.0) * 0.5 + 0.5;
            #else
              float threadWeave = sin(uKnitTime * 14.0) * 0.5 + 0.5;
            #endif
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.8, 1.0), threadWeave * 0.85);
          }
        }
      #endif
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
      if (gl_FrontFacing) {
        // Strictly override outgoing light on interior lining to solid fabric color
        outgoingLight = uInsideColor * 0.85;
      }
      #include <opaque_fragment>
      `
    );

    material.userData.shader = shader;
  };
}



/**
 * Photorealistic 3D Scene Manager using the official VirtualThreads 3D T-shirt model.
 */
export class SceneManager {
  constructor(canvasContainer, onLoaded = () => {}, initialGarmentType = 'oversized_tee') {
    this.container = canvasContainer;
    this.width = Math.max(canvasContainer.clientWidth || 0, (typeof window !== 'undefined' ? window.innerWidth : 800) || 800);
    this.height = Math.max(canvasContainer.clientHeight || 0, (typeof window !== 'undefined' ? window.innerHeight : 600) || 600);
    this.onLoaded = onLoaded;
    this.isPaused = false;

    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Camera (Default to Zoom view for instant close-up inspection)
    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.75, 14.2);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 38;
    this.controls.target.set(0, 0.75, 0);

    // Zoom state (independent toggle: default wide/unzoomed per user request)
    this.isZoomed = false;
    this.currentCameraView = 'front';

    // 5. Canvas Design Manager (Optimized 2048x2048 texture with 60 FPS RAF scheduling)
    this.designManager = new CanvasDesignManager('#ffffff');
    this.designManager.setGarmentType(this.getGarmentFamily(initialGarmentType));
    this.designManager.subscribe(() => this.updateDecalVisibility());

    // 6. 3D Model references & animations
    this.tshirtPivot = null;
    this.tshirtStatic = null;
    this.tshirtWaves = null;
    this.tshirtWalking = null;
    this.mixer = null;
    this.actions = {};
    this.animationMode = 'static'; // 'static' | 'waves' | 'walking' | 'turntable'
    this.turntableSpeed = 0.8;

    // Apparel styling & fit options
    this.garmentType = initialGarmentType;
    this.attachmentsGroup = null;
    this.garmentColor = '#ffffff';
    this.acidWash = 0.0;
    this.puffPrint = 0.0;
    this.onGarmentLoading = null;

    // On-demand model loading status
    this.modelsLoading = {
      tshirt: false,
      hoodie: false,
      pants: false,
      cap: false
    };
    this.modelsLoaded = {
      tshirt: false,
      hoodie: false,
      pants: false,
      cap: false
    };
    this.tshirtCallbacks = [];
    this.hoodieCallbacks = [];
    this.pantsCallbacks = [];
    this.capCallbacks = [];

    // Real 3D Garment Models (Hoodie GLB, Pants OBJ, Cap OBJ)
    this.realHoodieRoot = null;
    this.realPantsRoot = null;
    this.realCapRoot = null;
    this.hoodieDecalMeshFront = null;
    this.hoodieDecalMeshBack = null;
    this.hoodieDecalsGroup = null;
    this.hoodieMixer = null;
    this.hoodieWalkAction = null;
    this.hoodieIdleAction = null;
    this.hoodieWalkClip = null;
    this.hoodieIdleClip = null;
    this.hoodieSpine2Bone = null;
    this.hoodieSpine2M0 = null;
    this.hoodieInvSpine2M0 = null;
    this.tempScale = new THREE.Vector3();
    this.invRealHoodieRootMatrix = new THREE.Matrix4();
    this.currentSpine2LocalMatrix = new THREE.Matrix4();
    this.hoodieDeltaMatrix = new THREE.Matrix4();
    this.hoodieFabricMaterial = null;
    this.pantsDecalMeshThigh = null;
    this.pantsDecalMeshPocket = null;
    this.capDecalMeshFront = null;

    // Camera animation mode: 'none' | 'rotate' | 'rotatezoom'
    this.cameraAnimationMode = 'none';
    this.cameraAngle = 0;
    this.cameraZoomTime = 0;

    // Video recording state & deterministic showcase engine
    this.isRecordingVideo = false;
    this.recordingMotion = 'showcase360';
    this.recordingDuration = 5;
    this.recordingAngularSpeed = 0;
    this.onRecordingFrame = null;
    this.preRecordState = null;

    // 7. Lighting
    this.lights = {};
    this.setupLighting('studio');

    // 8. Materials & Procedural Attachments (instant synchronous setup)
    this.hasTriggeredLoaded = false;
    this.initMaterials();
    this.setupGarmentAttachments();

    // 9. Load ONLY the active garment model on demand (avoid downloading 46MB upfront)
    this.ensureGarmentModelLoaded(this.garmentType);

    // Loop
    this.clock = new THREE.Clock();
    this.isDisposed = false;
    this.animFrameId = null;

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.setupInteractions();

    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);

    // Fallback safety: ensure loading overlay clears even on very slow networks
    setTimeout(() => {
      this.triggerLoadedIfReady(true);
    }, 45000);
  }

  initMaterials() {
    // Texture maps
    const textureLoader = new THREE.TextureLoader();
    const normalMap = textureLoader.load(getAssetUrl('/models/normaldetailsv2.jpg'));
    normalMap.wrapS = THREE.ClampToEdgeWrapping;
    normalMap.wrapT = THREE.ClampToEdgeWrapping;
    normalMap.flipY = false;

    const maxAniso = this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 16;
    normalMap.anisotropy = maxAniso;
    if (this.designManager.texture) this.designManager.texture.anisotropy = maxAniso;
    if (this.designManager.decalTexture) this.designManager.decalTexture.anisotropy = maxAniso;

    // Clean, 100% photorealistic heavy-weight cotton cloth material with dynamic 4096x4096 canvas
    this.shirtMaterial = new THREE.MeshStandardMaterial({
      map: this.designManager.texture,
      roughness: 0.68,
      metalness: 0.01,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.24, 0.24),
      side: THREE.DoubleSide
    });
    applyInsideFabricShader(this.shirtMaterial, () => this.garmentColor);

    this.fabricMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.garmentColor),
      roughness: 0.70,
      metalness: 0.01,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.25, 0.25),
      side: THREE.DoubleSide
    });

    // Vibrant, rich satin ink finish on decals (no dullness, max crispness, sharp anisotropic filtering)
    this.decalMaterial = new THREE.MeshStandardMaterial({
      map: this.designManager.decalTexture,
      roughness: 0.58,
      metalness: 0.02,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.25, 0.25),
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1.0,
      alphaTest: 0.005,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -8.0,
      polygonOffsetUnits: -8.0
    });
  }

  triggerLoadedIfReady(force = false) {
    if (this.hasTriggeredLoaded) return;
    const ready = force || this.isGarmentModelLoaded(this.garmentType);

    if (ready) {
      this.hasTriggeredLoaded = true;
      if (this.onLoaded) {
        this.onLoaded();
      }
      this.scheduleBackgroundPreloading();
    }
  }

  getGarmentFamily(type) {
    const t = type || this.garmentType || 'oversized_tee';
    if (t === 'hoodie' || t === 'zip_hoodie') return 'hoodie';
    if (t === 'sweatpants') return 'pants';
    if (t === 'cap') return 'cap';
    return 'tshirt';
  }

  isGarmentModelLoaded(type) {
    const family = this.getGarmentFamily(type);
    return !!this.modelsLoaded[family];
  }

  ensureGarmentModelLoaded(type, onComplete) {
    const family = this.getGarmentFamily(type);
    if (this.modelsLoaded[family]) {
      if (onComplete) onComplete();
      return;
    }

    if (family === 'hoodie') {
      this.loadHoodieModel(() => {
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady();
        if (onComplete) onComplete();
      });
    } else if (family === 'pants') {
      this.loadPantsModel(() => {
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady();
        if (onComplete) onComplete();
      });
    } else if (family === 'cap') {
      this.loadCapModel(() => {
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady();
        if (onComplete) onComplete();
      });
    } else {
      this.loadTshirtModel(() => {
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady();
        if (onComplete) onComplete();
      });
    }
  }

  scheduleBackgroundPreloading() {
    if (this.hasScheduledPreload) return;
    this.hasScheduledPreload = true;

    // Use delayed sequential preloading during browser idle time
    // Guarantees zero freezing on initial load, while ensuring all 3D garments load instantly (0ms)
    setTimeout(() => {
      const queue = ['hoodie', 'pants', 'cap'];
      const processNext = (idx) => {
        if (idx >= queue.length || this.isDisposed) return;
        const fam = queue[idx];
        if (!this.modelsLoaded[fam] && !this.modelsLoading[fam]) {
          this.ensureGarmentModelLoaded(fam, () => {
            setTimeout(() => processNext(idx + 1), 600);
          });
        } else {
          processNext(idx + 1);
        }
      };
      processNext(0);
    }, 1800);
  }

  preloadAllGarmentModels() {
    this.scheduleBackgroundPreloading();
  }

  loadModel(onDone) {
    return this.loadTshirtModel(onDone);
  }

  loadTshirtModel(onDone) {
    if (this.modelsLoaded.tshirt) {
      if (onDone) onDone();
      return;
    }
    if (this.modelsLoading.tshirt) {
      if (onDone) this.tshirtCallbacks.push(onDone);
      return;
    }
    this.modelsLoading.tshirt = true;
    if (onDone) this.tshirtCallbacks.push(onDone);

    const loader = new GLTFLoader();
    loader.load(
      getAssetUrl('/models/tshirt-sizingtest.gltf'),
      (gltf) => {
        this.gltfScene = gltf.scene;

        // Hide and remove environment spheres, camera planes & extra export meshes from gltf
        ['env_sphere', 'cameradefault_bg', 'camrotate_bg', 'camrotatezoom_bg', '3Dmodelexport', 'Plane.002', 'Plane.003', 'Plane.004', 'Plane.017'].forEach((name) => {
          const obj = gltf.scene.getObjectByName(name);
          if (obj) {
            obj.visible = false;
            if (obj.parent) obj.parent.remove(obj);
          }
        });

        // Hide any other non-tshirt meshes in gltf
        gltf.scene.traverse((child) => {
          if (child.isMesh && child !== this.tshirtStatic && child !== this.tshirtWaves && child !== this.tshirtWalking) {
            child.visible = false;
          }
        });

        // Unhide tshirt pivot and lock to scale 1
        this.tshirtPivot = gltf.scene.getObjectByName('tshirt_pivot');
        if (this.tshirtPivot) {
          this.tshirtPivot.position.set(0, 0, 0);
          this.tshirtPivot.scale.set(1, 1, 1);
        }

        // Setup individual meshes with their authentic geometry coordinates:
        this.tshirtStatic = gltf.scene.getObjectByName('tshirt_static');
        this.tshirtWaves = gltf.scene.getObjectByName('tshirt_waves');
        this.tshirtWalking = gltf.scene.getObjectByName('tshirt_walking');

        // 1. Static T-shirt model (millimeter coords, rotated 90deg X, scale 0.01)
        if (this.tshirtStatic) {
          this.tshirtStatic.material = this.shirtMaterial;
          this.tshirtStatic.castShadow = true;
          this.tshirtStatic.receiveShadow = true;
          this.tshirtStatic.position.set(0, -0.427445, 0);
          this.tshirtStatic.rotation.set(Math.PI / 2, 0, 0);
          this.tshirtStatic.scale.set(0.01, 0.01, 0.01);
          this.tshirtStatic.visible = true;
        }

        // 2. Wind Waves animated model (native meter coords centered at origin)
        if (this.tshirtWaves) {
          this.tshirtWaves.material = this.shirtMaterial;
          this.tshirtWaves.castShadow = true;
          this.tshirtWaves.receiveShadow = true;
          this.tshirtWaves.position.set(7.041597, -0.387188, 0.135978);
          this.tshirtWaves.rotation.set(0, 0, 0);
          this.tshirtWaves.scale.set(1, 1, 1);
          this.tshirtWaves.visible = false;
        }

        // 3. Walking Model animated runway stride (native meter coords centered at origin)
        if (this.tshirtWalking) {
          this.tshirtWalking.material = this.shirtMaterial;
          this.tshirtWalking.castShadow = true;
          this.tshirtWalking.receiveShadow = true;
          this.tshirtWalking.position.set(-7.923582, -0.137349, 0);
          this.tshirtWalking.rotation.set(0, 0, 0);
          this.tshirtWalking.scale.set(1, 1, 1);
          this.tshirtWalking.visible = false;
        }

        // Setup animations
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(gltf.scene);
          gltf.animations.forEach((clip) => {
            if (clip.name === 'tshirt_waves') {
              const action = this.mixer.clipAction(clip);
              action.setLoop(THREE.LoopRepeat, Infinity);
              this.actions[clip.name] = action;
            } else if (clip.name === 'tshirt_walking') {
              const numTargets = 16;
              const duration = 0.96;
              const dt = duration / (numTargets - 1);
              const times = new Float32Array(numTargets);
              const values = new Float32Array(numTargets * numTargets);

              for (let i = 0; i < numTargets; i++) {
                times[i] = i * dt;
                for (let m = 0; m < numTargets; m++) {
                  values[i * numTargets + m] = (m === i) ? 1.0 : 0.0;
                }
              }

              const track = new THREE.NumberKeyframeTrack(
                'tshirt_walking.morphTargetInfluences',
                times,
                values
              );

              const smoothClip = new THREE.AnimationClip(
                'tshirt_walking_smooth',
                duration,
                [track]
              );

              const action = this.mixer.clipAction(smoothClip);
              action.setLoop(THREE.LoopRepeat, Infinity);
              action.setEffectiveTimeScale(this.walkSpeed || 1.0);
              this.actions['tshirt_walking'] = action;
            }
          });
        }

        this.scene.add(gltf.scene);
        this.modelsLoaded.tshirt = true;
        this.modelsLoading.tshirt = false;
        this.setAnimationMode(this.animationMode);
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady();

        const cbs = [...this.tshirtCallbacks];
        this.tshirtCallbacks = [];
        cbs.forEach(cb => cb());
      },
      undefined,
      (err) => {
        console.error('Error loading 3D apparel model:', err);
        this.modelsLoading.tshirt = false;
        const cbs = [...this.tshirtCallbacks];
        this.tshirtCallbacks = [];
        cbs.forEach(cb => cb());
      }
    );
  }

  getActiveMesh() {
    const t = this.garmentType || 'oversized_tee';
    if (t === 'sweatpants') {
      const activeSide = this.designManager?.getActiveLayer()?.side;
      if (activeSide === 'back' && this.pantsDecalMeshPocket) return this.pantsDecalMeshPocket;
      return this.pantsDecalMeshThigh || this.realPantsRoot;
    }
    if (t === 'cap') return this.capDecalMeshFront || this.realCapRoot;
    if (t === 'hoodie' || t === 'zip_hoodie' || t === 'hanging_hoodie') {
      const activeSide = this.designManager?.getActiveLayer()?.side;
      if (activeSide === 'back' && this.hoodieDecalMeshBack) return this.hoodieDecalMeshBack;
      return this.hoodieDecalMeshFront || this.realHoodieRoot;
    }
    if (this.animationMode === 'waves' && this.tshirtWaves) return this.tshirtWaves;
    if (this.animationMode === 'walking' && this.tshirtWalking) return this.tshirtWalking;
    return this.tshirtStatic;
  }

  setInteractionMode(mode) {
    this.interactionMode = mode;
    if (mode === 'orbit') {
      this.controls.enabled = true;
      if (this.renderer) this.renderer.domElement.style.cursor = 'grab';
    } else {
      this.controls.enabled = false;
      if (this.renderer) this.renderer.domElement.style.cursor = 'move';
    }
  }

  setupInteractions() {
    this.interactionMode = 'orbit'; // 'orbit' | 'dragDesign'
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.is3DDragging = false;
    this.dragStart = null;

    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      // Direct 3D dragging when interactionMode is 'dragDesign' or when holding Shift
      if (this.interactionMode === 'dragDesign' || e.shiftKey) {
        const activeLayer = this.designManager?.getActiveLayer() || this.designManager?.layers[0];
        if (!activeLayer) return;

        if (this.designManager.activeLayerId !== activeLayer.id) {
          this.designManager.setActiveLayer(activeLayer.id);
        }

        this.controls.enabled = false;
        this.is3DDragging = true;
        try { dom.setPointerCapture(e.pointerId); } catch (err) {}

        this.dragStart = {
          clientX: e.clientX,
          clientY: e.clientY,
          startX: activeLayer.x,
          startY: activeLayer.y,
          startScale: activeLayer.scale || 1.0,
          layerId: activeLayer.id,
          side: activeLayer.side || 'front',
          isResizing: e.altKey || false
        };

        // If direct UV hit on mesh, also snap to raycast position
        const rect = dom.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const mesh = this.getActiveMesh();
        if (mesh && !e.altKey) {
          const intersects = this.raycaster.intersectObject(mesh, false);
          if (intersects.length > 0 && intersects[0].uv) {
            const uv = intersects[0].uv;
            const x = Math.round(uv.x * 2048);
            const y = Math.round(uv.y * 2048);
            const side = x < 1024 ? 'front' : 'back';
            this.dragStart.startX = x;
            this.dragStart.startY = y;
            this.dragStart.side = side;
            this.designManager.updateLayer(activeLayer.id, { x, y, side });
          }
        }
      }
    });

    dom.addEventListener('pointermove', (e) => {
      if (this.is3DDragging && this.dragStart) {
        const deltaX = (e.clientX - this.dragStart.clientX);
        const deltaY = (e.clientY - this.dragStart.clientY);

        // Resize mode (via Alt+Drag or isResizing flag)
        if (this.dragStart.isResizing || e.altKey) {
          const scaleFactor = (deltaX - deltaY) * 0.006;
          const newScale = Math.max(0.2, Math.min(3.5, (this.dragStart.startScale || 1.0) + scaleFactor));
          this.designManager.updateLayer(this.dragStart.layerId, { scale: parseFloat(newScale.toFixed(2)) });
          return;
        }

        // Check if viewing front or back of model
        const isBackView = this.camera.position.z < 0;
        const factorX = isBackView ? -2.2 : 2.2;
        const factorY = 2.2;

        let newX = Math.round(this.dragStart.startX + deltaX * factorX);
        let newY = Math.round(this.dragStart.startY + deltaY * factorY);

        if (this.dragStart.side === 'front') {
          newX = Math.max(100, Math.min(924, newX));
        } else {
          newX = Math.max(1124, Math.min(1948, newX));
        }
        newY = Math.max(200, Math.min(1848, newY));

        this.designManager.updateLayer(this.dragStart.layerId, { x: newX, y: newY });
      }
    });

    const stop3DDrag = (e) => {
      if (this.is3DDragging) {
        this.is3DDragging = false;
        this.dragStart = null;
        if (this.designManager && this.designManager.flush) {
          this.designManager.flush();
        }
        try { dom.releasePointerCapture(e.pointerId); } catch (err) {}
        this.controls.enabled = (this.interactionMode !== 'dragDesign');
      }
    };

    dom.addEventListener('pointerup', stop3DDrag);
    dom.addEventListener('pointercancel', stop3DDrag);

    // Mouse wheel resizing when in Drag Design mode
    dom.addEventListener('wheel', (e) => {
      if (this.interactionMode === 'dragDesign') {
        const activeLayer = this.designManager?.getActiveLayer() || this.designManager?.layers[0];
        if (activeLayer) {
          e.preventDefault();
          const zoomDelta = -Math.sign(e.deltaY) * 0.05;
          const newScale = Math.max(0.2, Math.min(3.5, (activeLayer.scale || 1.0) + zoomDelta));
          this.designManager.updateLayer(activeLayer.id, { scale: parseFloat(newScale.toFixed(2)) });
        }
      }
    }, { passive: false });
  }

  setWalkSpeed(speed) {
    this.walkSpeed = speed;
    if (this.actions['tshirt_walking']) {
      this.actions['tshirt_walking'].setEffectiveTimeScale(speed);
    }
    if (this.hoodieWalkAction) {
      this.hoodieWalkAction.setEffectiveTimeScale(speed);
    }
  }

  setupLighting(preset = 'studio') {
    Object.values(this.lights).forEach((l) => this.scene.remove(l));
    this.lights = {};

    // Standard photorealistic studio lighting rig matching VirtualThreads reference
    // Key light - crisp directional illumination from front-left
    const keyIntensity = preset === 'light' ? 2.0 : 2.2;
    const keyLight = new THREE.DirectionalLight(0xffffff, keyIntensity);
    keyLight.position.set(-4, 7.5, 14);
    this.scene.add(keyLight);
    this.lights.key = keyLight;

    // Soft fill light from front-right
    const fillLight = new THREE.DirectionalLight(0xeef2ff, 1.4);
    fillLight.position.set(6, 4, 12);
    this.scene.add(fillLight);
    this.lights.fill = fillLight;

    // Top-down rim backlight - definition and separation matching reference
    const rimLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    rimLight.position.set(0, 9, -12);
    this.scene.add(rimLight);
    this.lights.rim = rimLight;

    // Soft lateral rim light for shoulder drape separation
    const sideRimLight = new THREE.DirectionalLight(0xdde8ff, 0.9);
    sideRimLight.position.set(10, 6, -8);
    this.scene.add(sideRimLight);
    this.lights.sideRim = sideRimLight;

    // Back Key light - ensures back of garment is equally well-lit during 360 turntable
    const backKeyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    backKeyLight.position.set(-4, 7.5, -14);
    this.scene.add(backKeyLight);
    this.lights.backKey = backKeyLight;

    // Dedicated Front Graphic Light - keeps chest prints bright, vivid, and pop
    const frontGraphicLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontGraphicLight.position.set(0, 1.5, 14);
    this.scene.add(frontGraphicLight);
    this.lights.frontGraphic = frontGraphicLight;

    // Dedicated Back Graphic Light - keeps back prints bright and clear when rotated
    const backGraphicLight = new THREE.DirectionalLight(0xffffff, 1.2);
    backGraphicLight.position.set(0, 1.5, -14);
    this.scene.add(backGraphicLight);
    this.lights.backGraphic = backGraphicLight;

    // Ambient light - ensures unshadowed cloth areas stay clean authentic cotton white
    const ambIntensity = preset === 'light' ? 1.0 : 1.1;
    const ambLight = new THREE.AmbientLight(0xffffff, ambIntensity);
    this.scene.add(ambLight);
    this.lights.amb = ambLight;
  }

  setAcidWash(intensity) {
    this.acidWash = Math.max(0, Math.min(1, intensity));
    const updateShader = (mat) => {
      if (mat?.userData?.shader?.uniforms?.uAcidWash) {
        mat.userData.shader.uniforms.uAcidWash.value = this.acidWash;
      }
    };
    updateShader(this.shirtMaterial);
    if (this.tshirtWaves) updateShader(this.tshirtWaves.material);
    if (this.tshirtWalking) updateShader(this.tshirtWalking.material);
  }

  setPuffPrint(intensity) {
    this.puffPrint = Math.max(0, Math.min(1, intensity));
    const scaleVal = 0.25 + this.puffPrint * 0.75;
    if (this.shirtMaterial) {
      this.shirtMaterial.normalScale.set(scaleVal, scaleVal);
      this.shirtMaterial.needsUpdate = true;
    }
  }

  setCameraAnimationMode(mode) {
    this.cameraAnimationMode = mode;
    if (mode === 'none') {
      this.controls.enabled = (this.interactionMode === 'orbit');
      this.setCameraPreset(this.currentCameraView || 'front', this.isZoomed);
    } else {
      this.controls.enabled = false;
      this.cameraAngle = 0;
      this.cameraZoomTime = 0;
      // Requirement 4: When camera animation is activated, garment animation is set to static
      if (this.animationMode !== 'static') {
        this.setAnimationMode('static');
      }
    }
  }

  getActiveGarmentRoot() {
    const t = this.garmentType || 'oversized_tee';
    if (t === 'hoodie' || t === 'zip_hoodie') {
      return this.realHoodieRoot;
    }
    if (t === 'sweatpants') {
      return this.realPantsRoot;
    }
    if (t === 'cap') {
      return this.realCapRoot;
    }
    return this.tshirtPivot;
  }

  triggerKnitAnimation() {
    // Procedural line-by-line thread weaving growth simulation
    this.knitTime = 0;
    this.knitProgress = 0.0;
    const updateShaderKnit = (p) => {
      [this.shirtMaterial, this.hoodieFabricMaterial, this.fabricMaterial].forEach((mat) => {
        if (mat?.userData?.shader?.uniforms?.uKnitProgress) {
          mat.userData.shader.uniforms.uKnitProgress.value = p;
        }
      });
    };
    updateShaderKnit(0.0);

    const activeRoot = this.getActiveGarmentRoot();
    const startT = performance.now();
    const duration = 2.4; // 2.4 seconds authentic line-by-line thread weaving

    const knitInterval = (now) => {
      if (this.animationMode !== 'knit') {
        updateShaderKnit(1.0);
        return;
      }
      const elapsed = (now - startT) / 1000;
      const p = Math.min(elapsed / duration, 1.0);
      this.knitProgress = p;
      updateShaderKnit(p);

      if (activeRoot) {
        // Elastic fabric tension breathing
        const pulse = 1.0 - Math.pow(1.0 - p, 2) * 0.04;
        activeRoot.scale.set(pulse, pulse, pulse);
      }

      if (p < 1.0) {
        requestAnimationFrame(knitInterval);
      } else {
        // Reached top: keep fully woven
        updateShaderKnit(1.0);
        if (activeRoot) activeRoot.scale.set(1, 1, 1);
      }
    };
    requestAnimationFrame(knitInterval);
  }


  setGarmentColor(hex) {
    this.garmentColor = hex;
    if (this.designManager) {
      this.designManager.setGarmentColor(hex);
    }
    if (this.fabricMaterial) {
      this.fabricMaterial.color.set(hex);
      this.fabricMaterial.needsUpdate = true;
    }
    if (this.hoodieFabricMaterial) {
      this.hoodieFabricMaterial.color.set(hex);
      this.hoodieFabricMaterial.needsUpdate = true;
    }
    const colorObj = new THREE.Color(hex);
    const updateInsideColor = (mat) => {
      if (mat && mat.userData?.shader?.uniforms?.uInsideColor) {
        mat.userData.shader.uniforms.uInsideColor.value.copy(colorObj);
      }
    };
    updateInsideColor(this.shirtMaterial);
    if (this.tshirtWaves) updateInsideColor(this.tshirtWaves.material);
    if (this.tshirtWalking) updateInsideColor(this.tshirtWalking.material);

    // Update real garment models
    const updateMeshColors = (root) => {
      if (!root) return;
      root.traverse((c) => {
        if (c.isMesh && c.material && c.material !== this.decalMaterial) {
          const mName = (c.material.name || '').toLowerCase();
          if (!mName.includes('slider') && !mName.includes('metal') && !mName.includes('material9428')) {
            if (c.material.color) {
              c.material.color.set(hex);
              c.material.needsUpdate = true;
            }
          }
        }
      });
    };
    updateMeshColors(this.realHoodieRoot);
    updateMeshColors(this.realPantsRoot);
    updateMeshColors(this.realCapRoot);
  }

  // --- Dynamic Garment Type Switching (All 9 Garments in 3D) ---
  setGarmentType(type, onComplete) {
    this.garmentType = type || 'oversized_tee';
    if (this.designManager && this.designManager.setGarmentType) {
      this.designManager.setGarmentType(this.getGarmentFamily(this.garmentType));
    }

    const family = this.getGarmentFamily(this.garmentType);
    if (this.garmentType === 'cap' && (this.animationMode === 'walking' || this.animationMode === 'waves' || this.animationMode === 'rotate_walk')) {
      this.animationMode = 'static';
    }
    const isAlreadyLoaded = !!this.modelsLoaded[family];

    if (this.onGarmentLoading) {
      this.onGarmentLoading(true, this.garmentType);
    }

    const finish = () => {
      this.applyGarmentTypeVisibility();
      this.setAnimationMode(this.animationMode);
      this.triggerLoadedIfReady();
      if (this.controls && this.camera) {
        this.setCameraPreset(this.currentCameraView || 'front', this.isZoomed);
      }
      if (this.onGarmentLoading) {
        this.onGarmentLoading(false, this.garmentType);
      }
      if (onComplete) onComplete();
    };

    if (isAlreadyLoaded) {
      setTimeout(finish, 220);
    } else {
      this.ensureGarmentModelLoaded(this.garmentType, () => {
        finish();
      });
    }

    // Auto adjust camera focus & framing per garment silhouette respecting isZoomed state
    if (this.controls && this.camera) {
      this.setCameraPreset(this.currentCameraView || 'front', this.isZoomed);
    }
  }

  setupGarmentAttachments() {
    if (this.attachmentsGroup) {
      this.scene.remove(this.attachmentsGroup);
    }

    this.attachmentsGroup = new THREE.Group();
    this.attachmentsGroup.name = 'garment_attachments';
    this.attachmentsGroup.scale.set(1, 1, 1);

    const fabMat = this.shirtMaterial || this.fabricMaterial;

    // 1. Sweatshirt: Authentic streetwear long sleeves, ribbed cuffs, waistband, and crewneck collar
    this.sweatshirtGroup = new THREE.Group();
    this.crewCollarGroup = this.sweatshirtGroup;

    // Seamless left & right long sleeve extensions connecting directly inside drop-shoulder sleeve openings
    const armGeom = new THREE.CylinderGeometry(0.40, 0.52, 2.20, 24);
    
    // Left sleeve extension & ribbed cuff
    const leftArm = new THREE.Mesh(armGeom, fabMat);
    leftArm.position.set(-4.08, 0.42, 0.04);
    leftArm.rotation.set(0.10, 0, 0.65);
    
    const cuffGeom = new THREE.CylinderGeometry(0.35, 0.38, 0.45, 24);
    const leftCuff = new THREE.Mesh(cuffGeom, fabMat);
    leftCuff.position.set(-4.95, -0.38, 0.04);
    leftCuff.rotation.set(0.10, 0, 0.65);

    // Right sleeve extension & ribbed cuff
    const rightArm = new THREE.Mesh(armGeom, fabMat);
    rightArm.position.set(4.08, 0.42, 0.04);
    rightArm.rotation.set(0.10, 0, -0.65);

    const rightCuff = new THREE.Mesh(cuffGeom, fabMat);
    rightCuff.position.set(4.95, -0.38, 0.04);
    rightCuff.rotation.set(0.10, 0, -0.65);

    // Ribbed crewneck collar rim sitting flush on neckline (Y = 3.20)
    const crewGeom = new THREE.TorusGeometry(1.22, 0.10, 20, 48);
    crewGeom.rotateX(Math.PI * 0.45);
    const crewMesh = new THREE.Mesh(crewGeom, fabMat);
    crewMesh.position.set(0, 3.20, 0.08);

    // Ribbed bottom hem waistband sitting flush at bottom hem (Y = -4.18)
    const waistGeom = new THREE.CylinderGeometry(2.18, 2.14, 0.46, 32);
    const waistHem = new THREE.Mesh(waistGeom, fabMat);
    waistHem.position.set(0, -4.18, 0.0);
    waistHem.scale.set(1.0, 1.0, 0.52);

    this.sweatshirtGroup.add(leftArm, leftCuff, rightArm, rightCuff, crewMesh, waistHem);
    this.attachmentsGroup.add(this.sweatshirtGroup);

    // 2. Polo Turned-down Folded Collar, 3-Button Placket & Ribbed Sleeve Cuffs (Envato Elements style)
    this.poloGroup = new THREE.Group();

    // Fabric neck insert to completely mask and occlude the round crewneck rim underneath
    const neckCoverGeom = new THREE.CylinderGeometry(1.18, 1.25, 0.38, 32, 1, false);
    const neckCoverMesh = new THREE.Mesh(neckCoverGeom, fabMat);
    neckCoverMesh.position.set(0, 3.16, 0.50);
    neckCoverMesh.rotation.set(0.24, 0, 0);

    // Turned-down continuous collar band contouring the neck from back to front
    const poloCollarCurve = new THREE.CylinderGeometry(1.22, 1.36, 0.48, 36, 1, false, Math.PI * 0.18, Math.PI * 1.64);
    poloCollarCurve.rotateX(-0.16);
    const poloCollarMesh = new THREE.Mesh(poloCollarCurve, fabMat);
    poloCollarMesh.position.set(0, 3.24, 0.06);

    // Left and right folded lapel wings laying flat against upper chest
    const lapelShape = new THREE.Shape();
    lapelShape.moveTo(0, 0);
    lapelShape.lineTo(0.82, -0.92);
    lapelShape.lineTo(0.20, -1.02);
    lapelShape.lineTo(-0.06, -0.15);
    lapelShape.closePath();
    const extrudeSettings = { depth: 0.035, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.015, bevelThickness: 0.015 };
    const lapelGeom = new THREE.ExtrudeGeometry(lapelShape, extrudeSettings);

    const leftLapel = new THREE.Mesh(lapelGeom, fabMat);
    leftLapel.position.set(-0.14, 3.20, 0.95);
    leftLapel.rotation.set(0.20, 0.10, -0.18);

    const rightLapel = new THREE.Mesh(lapelGeom, fabMat);
    rightLapel.position.set(0.14, 3.20, 0.95);
    rightLapel.rotation.set(0.20, -0.10, 0.18);
    rightLapel.scale.set(-1, 1, 1);

    // Front center placket with stitch welt
    const placketGeom = new THREE.BoxGeometry(0.44, 1.62, 0.045);
    const placketMesh = new THREE.Mesh(placketGeom, fabMat);
    placketMesh.position.set(0, 2.14, 0.96);
    placketMesh.rotation.set(0.14, 0, 0);

    // Bottom box-stitch placket tab
    const placketTabGeom = new THREE.BoxGeometry(0.48, 0.22, 0.055);
    const placketTabMesh = new THREE.Mesh(placketTabGeom, fabMat);
    placketTabMesh.position.set(0, 1.34, 0.88);
    placketTabMesh.rotation.set(0.14, 0, 0);

    // Pearlescent buttons (3-button authentic polo placket)
    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f4,
      roughness: 0.22,
      metalness: 0.12
    });
    const buttonGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.025, 20);
    buttonGeom.rotateX(Math.PI / 2 + 0.14);

    const b1 = new THREE.Mesh(buttonGeom, buttonMat);
    b1.position.set(0, 2.70, 1.00);
    const b2 = new THREE.Mesh(buttonGeom, buttonMat);
    b2.position.set(0, 2.22, 0.94);
    const b3 = new THREE.Mesh(buttonGeom, buttonMat);
    b3.position.set(0, 1.74, 0.88);

    // Ribbed short-sleeve cuffs (left & right arm bands)
    const poloCuffGeom = new THREE.CylinderGeometry(0.82, 0.84, 0.26, 32, 1, true);
    const leftPoloCuff = new THREE.Mesh(poloCuffGeom, fabMat);
    leftPoloCuff.position.set(-3.25, 1.38, 0.06);
    leftPoloCuff.rotation.set(0, 0, -0.58);

    const rightPoloCuff = new THREE.Mesh(poloCuffGeom, fabMat);
    rightPoloCuff.position.set(3.25, 1.38, 0.06);
    rightPoloCuff.rotation.set(0, 0, 0.58);

    this.poloGroup.add(
      neckCoverMesh,
      poloCollarMesh,
      leftLapel,
      rightLapel,
      placketMesh,
      placketTabMesh,
      b1,
      b2,
      b3,
      leftPoloCuff,
      rightPoloCuff
    );
    this.attachmentsGroup.add(this.poloGroup);

    this.scene.add(this.attachmentsGroup);
    this.applyGarmentTypeVisibility();
  }

  loadHoodieModel(onDone) {
    if (this.modelsLoaded.hoodie) {
      if (onDone) onDone();
      return;
    }
    if (this.modelsLoading.hoodie) {
      if (onDone) this.hoodieCallbacks.push(onDone);
      return;
    }
    this.modelsLoading.hoodie = true;
    if (onDone) this.hoodieCallbacks.push(onDone);

    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    const hoodieDiffuse = textureLoader.load(getAssetUrl('/models/hoodie_diffuse.jpg'));
    const hoodieNormal = textureLoader.load(getAssetUrl('/models/hoodie_normal.jpg'));
    const hoodieRoughness = textureLoader.load(getAssetUrl('/models/hoodie_roughness.jpg'));
    const maxAniso = this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 16;
    hoodieDiffuse.colorSpace = THREE.SRGBColorSpace;
    hoodieDiffuse.flipY = false;
    hoodieNormal.flipY = false;
    hoodieRoughness.flipY = false;
    hoodieDiffuse.anisotropy = maxAniso;
    hoodieNormal.anisotropy = maxAniso;
    hoodieRoughness.anisotropy = maxAniso;

    this.hoodieFabricMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.garmentColor || '#ffffff'),
      normalMap: hoodieNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    gltfLoader.load(
      getAssetUrl('/models/virtualthreads_hoodie.glb'),
      (gltf) => {
        this.realHoodieRoot = new THREE.Group();
        this.realHoodieRoot.name = 'real_hoodie_root';

        const hoodieModel = gltf.scene;

        // Align ModelPosition_Hoodie symmetrically at origin
        const mp = hoodieModel.getObjectByName('ModelPosition_Hoodie');
        if (mp) {
          mp.position.set(0, 0, 0);
          mp.rotation.set(0, 0, 0);
        }

        hoodieModel.traverse((child) => {
          if (child.isMesh) {
            if (child.name === 'Hoodie') {
              child.material = this.hoodieFabricMaterial;
              child.castShadow = false;
              child.receiveShadow = false;
            } else {
              child.visible = false;
            }
          }
        });

        // Center the hoodie model at origin (0, 0, 0)
        hoodieModel.position.set(0, 0, 0);
        this.realHoodieRoot.add(hoodieModel);

        // Setup authentic walk cycle animation from virtualthreads
        if (gltf.animations && gltf.animations.length > 0) {
          this.hoodieMixer = new THREE.AnimationMixer(hoodieModel);
          const masterClip = gltf.animations.find(a => a.name === 'WALK_Hoodie') || gltf.animations[0];

          // Subclip the clean, in-place walk cycle (frames 3 to 34 at 30 fps, duration 1.033s)
          // The raw 10.9s master clip contains walk, crouch, jump, side look, and run.
          // Frames 3..34 provide the authentic, smooth in-place runway stride loop with identical start/end keys.
          this.hoodieWalkClip = THREE.AnimationUtils.subclip(masterClip, 'WALK_Loop', 3, 34, 30);
          this.hoodieIdleClip = THREE.AnimationUtils.subclip(masterClip, 'IDLE_Pose', 0, 2, 30);

          this.hoodieWalkAction = this.hoodieMixer.clipAction(this.hoodieWalkClip);
          this.hoodieWalkAction.setLoop(THREE.LoopRepeat, Infinity);
          this.hoodieWalkAction.clampWhenFinished = false;

          this.hoodieIdleAction = this.hoodieMixer.clipAction(this.hoodieIdleClip);
          this.hoodieIdleAction.setLoop(THREE.LoopRepeat, Infinity);
          this.hoodieIdleAction.clampWhenFinished = false;

          // Start in IDLE relaxed symmetrical standing pose
          this.hoodieIdleAction.play();
          this.hoodieMixer.update(0);
        }

        // Chest bone tracking for decal mesh lock
        this.hoodieSpine2Bone = hoodieModel.getObjectByName('mixamorigSpine2');
        if (this.hoodieSpine2Bone) {
          hoodieModel.updateMatrixWorld(true);
          this.realHoodieRoot.updateMatrixWorld(true);

          const invRoot0 = this.realHoodieRoot.matrixWorld.clone().invert();
          this.hoodieSpine2M0 = new THREE.Matrix4().multiplyMatrices(invRoot0, this.hoodieSpine2Bone.matrixWorld);
          this.hoodieInvSpine2M0 = this.hoodieSpine2M0.clone().invert();
        }

        // Decals rig group that follows chest bone during animation
        this.hoodieDecalsGroup = new THREE.Group();
        this.hoodieDecalsGroup.name = 'hoodie_decals_group';

        // Front Chest Decal Mesh (curved flush to front chest surface)
        const frontDecalGeom = new THREE.PlaneGeometry(2.7, 2.4, 16, 16);
        const fPos = frontDecalGeom.attributes.position;
        for (let i = 0; i < fPos.count; i++) {
          const x = fPos.getX(i);
          const y = fPos.getY(i);
          fPos.setZ(i, (x * x) * 0.035 - (y * y) * 0.01);
        }
        frontDecalGeom.computeVertexNormals();

        // Correct UV mapping (upright, readable left-to-right, centered at 530, 800)
        const fUvs = frontDecalGeom.attributes.uv;
        for (let i = 0; i < fUvs.count; i++) {
          const u = fUvs.getX(i);
          const v = fUvs.getY(i);
          fUvs.setXY(i, 0.0588 + u * 0.40, 0.5906 - v * 0.40);
        }
        fUvs.needsUpdate = true;

        this.hoodieDecalMeshFront = new THREE.Mesh(frontDecalGeom, this.decalMaterial);
        this.hoodieDecalMeshFront.position.set(0, 1.02, 1.38);
        this.hoodieDecalMeshFront.rotation.set(-0.25, 0, 0);
        this.hoodieDecalMeshFront.renderOrder = 2;
        this.hoodieDecalMeshFront.visible = false;
        this.hoodieDecalsGroup.add(this.hoodieDecalMeshFront);

        // Back Torso Decal Mesh (smooth planar flush to back torso surface below hood)
        const backDecalGeom = new THREE.PlaneGeometry(2.7, 2.4);

        const bUvs = backDecalGeom.attributes.uv;
        for (let i = 0; i < bUvs.count; i++) {
          const u = bUvs.getX(i);
          const v = bUvs.getY(i);
          bUvs.setXY(i, 0.5422 + u * 0.40, 0.5906 - v * 0.40);
        }
        bUvs.needsUpdate = true;

        this.hoodieDecalMeshBack = new THREE.Mesh(backDecalGeom, this.decalMaterial);
        this.hoodieDecalMeshBack.position.set(0, 0.85, -1.08);
        this.hoodieDecalMeshBack.rotation.set(0.04, Math.PI, 0);
        this.hoodieDecalMeshBack.renderOrder = 2;
        this.hoodieDecalMeshBack.visible = false;
        this.hoodieDecalsGroup.add(this.hoodieDecalMeshBack);

        // Front Center Metallic Zipper (for Zip Hoodie - strictly follows chest bone during walk & pose)
        const zipMat = new THREE.MeshStandardMaterial({
          color: 0xe0e0e0,
          metalness: 0.92,
          roughness: 0.18
        });
        const zipTrackGeom = new THREE.BoxGeometry(0.045, 2.70, 0.03);
        this.hoodieZipperMesh = new THREE.Mesh(zipTrackGeom, zipMat);
        this.hoodieZipperMesh.position.set(0, 0.22, 1.44);
        this.hoodieZipperMesh.rotation.set(-0.25, 0, 0);

        const pullerGeom = new THREE.BoxGeometry(0.12, 0.26, 0.05);
        const pullerMesh = new THREE.Mesh(pullerGeom, zipMat);
        pullerMesh.position.set(0, 0.85, 0.03);
        this.hoodieZipperMesh.add(pullerMesh);
        this.hoodieZipperMesh.visible = (this.garmentType === 'zip_hoodie');
        this.hoodieDecalsGroup.add(this.hoodieZipperMesh);

        this.realHoodieRoot.add(this.hoodieDecalsGroup);

        this.scene.add(this.realHoodieRoot);
        this.modelsLoaded.hoodie = true;
        this.modelsLoading.hoodie = false;
        this.setAnimationMode(this.animationMode);
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady();

        const cbs = [...this.hoodieCallbacks];
        this.hoodieCallbacks = [];
        cbs.forEach(cb => cb());
      },
      undefined,
      (err) => {
        console.error('Error loading virtualthreads hoodie GLB:', err);
        this.modelsLoading.hoodie = false;
        const cbs = [...this.hoodieCallbacks];
        this.hoodieCallbacks = [];
        cbs.forEach(cb => cb());
      }
    );
  }

  loadPantsModel(onDone) {
    if (this.modelsLoaded.pants) {
      if (onDone) onDone();
      return;
    }
    if (this.modelsLoading.pants) {
      if (onDone) this.pantsCallbacks.push(onDone);
      return;
    }
    this.modelsLoading.pants = true;
    if (onDone) this.pantsCallbacks.push(onDone);

    const objLoader = new OBJLoader();
    objLoader.load(
      getAssetUrl('/models/pants.obj'),
      (pantsObj) => {
        this.realPantsRoot = new THREE.Group();
        this.realPantsRoot.name = 'real_pants_root';

        pantsObj.traverse((child) => {
          if (child.isMesh) {
            child.geometry.computeVertexNormals();
            child.material = this.fabricMaterial;
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });

        // Native bounds: W: 86.05, H: 100.56, D: 30.14, Center: (0, -51.638, 2.04)
        // Scale to normalize height to 7.8 units and center perfectly at (0, 0, 0)
        const scaleP = 0.077561;
        pantsObj.scale.set(scaleP, scaleP, scaleP);
        pantsObj.position.set(0, 51.6384 * scaleP, -2.0398 * scaleP);
        this.realPantsRoot.add(pantsObj);

        // Hanging Waist Drawstrings with Metal Aglets for streetwear realism
        const stringMat = new THREE.MeshStandardMaterial({ color: 0xededed, roughness: 0.90 });
        const agletMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d4, metalness: 0.95, roughness: 0.15 });
        const strGeom = new THREE.CylinderGeometry(0.035, 0.035, 1.4, 12);
        this.pLeftStr = new THREE.Mesh(strGeom, stringMat);
        this.pLeftStr.position.set(-0.25, 3.65, 1.15);
        this.pLeftStr.rotation.z = -0.06;
        this.pRightStr = new THREE.Mesh(strGeom, stringMat);
        this.pRightStr.position.set(0.25, 3.65, 1.15);
        this.pRightStr.rotation.z = 0.06;

        const agletGeom = new THREE.CylinderGeometry(0.042, 0.042, 0.22, 12);
        const a1 = new THREE.Mesh(agletGeom, agletMat);
        a1.position.set(0, -0.7, 0);
        this.pLeftStr.add(a1);
        const a2 = new THREE.Mesh(agletGeom, agletMat);
        a2.position.set(0, -0.7, 0);
        this.pRightStr.add(a2);
        this.realPantsRoot.add(this.pLeftStr, this.pRightStr);

        // Left Thigh Decal Mesh
        const thighDecalGeom = new THREE.PlaneGeometry(1.5, 1.7, 16, 16);
        const tPos = thighDecalGeom.attributes.position;
        for (let i = 0; i < tPos.count; i++) {
          const x = tPos.getX(i);
          tPos.setZ(i, - (x * x) * 0.06);
        }
        thighDecalGeom.computeVertexNormals();
        const tUvs = thighDecalGeom.attributes.uv;
        for (let i = 0; i < tUvs.count; i++) {
          const u = tUvs.getX(i);
          const v = tUvs.getY(i);
          tUvs.setXY(i, 0.08 + u * 0.36, 0.45 - v * 0.30);
        }
        tUvs.needsUpdate = true;
        this.pantsDecalMeshThigh = new THREE.Mesh(thighDecalGeom, this.decalMaterial);
        this.pantsDecalMeshThigh.position.set(-1.15, 0.65, 1.15);
        this.pantsDecalMeshThigh.rotation.set(-0.04, 0.10, 0.02);
        this.realPantsRoot.add(this.pantsDecalMeshThigh);

        // Back Pocket Decal Mesh
        const pocketDecalGeom = new THREE.PlaneGeometry(1.3, 1.4, 16, 16);
        const pUvs = pocketDecalGeom.attributes.uv;
        for (let i = 0; i < pUvs.count; i++) {
          const u = pUvs.getX(i);
          const v = pUvs.getY(i);
          pUvs.setXY(i, 0.58 + u * 0.34, 0.50 - v * 0.28);
        }
        pocketDecalGeom.computeVertexNormals();
        this.pantsDecalMeshPocket = new THREE.Mesh(pocketDecalGeom, this.decalMaterial);
        this.pantsDecalMeshPocket.position.set(1.15, 1.45, -1.15);
        this.pantsDecalMeshPocket.rotation.set(0.04, Math.PI - 0.10, 0);
        this.realPantsRoot.add(this.pantsDecalMeshPocket);

        this.scene.add(this.realPantsRoot);
        this.modelsLoaded.pants = true;
        this.modelsLoading.pants = false;
        this.setAnimationMode(this.animationMode);
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady();

        const cbs = [...this.pantsCallbacks];
        this.pantsCallbacks = [];
        cbs.forEach(cb => cb());
      },
      undefined,
      (err) => {
        console.error('Error loading real pants OBJ:', err);
        this.modelsLoading.pants = false;
        const cbs = [...this.pantsCallbacks];
        this.pantsCallbacks = [];
        cbs.forEach(cb => cb());
      }
    );
  }

  loadCapModel(onDone) {
    if (this.modelsLoaded.cap) {
      if (onDone) onDone();
      return;
    }
    if (this.modelsLoading.cap) {
      if (onDone) this.capCallbacks.push(onDone);
      return;
    }
    this.modelsLoading.cap = true;
    if (onDone) this.capCallbacks.push(onDone);

    const objLoader = new OBJLoader();
    objLoader.load(
      getAssetUrl('/models/cap.obj'),
      (capObj) => {
        this.realCapRoot = new THREE.Group();
        this.realCapRoot.name = 'real_cap_root';

        capObj.traverse((child) => {
          if (child.isMesh) {
            child.geometry.computeVertexNormals();
            child.material = this.fabricMaterial;
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });

        // Rotate 180° around Y so visor brim faces forward toward camera (+Z)
        capObj.rotation.y = Math.PI;
        // Native bounds: W: 0.522, H: 0.391, D: 0.758, Center: (0, -0.128, -0.085)
        // With rotation around Y: Center is (0, -0.128, 0.085)
        // Normalize height to 4.2 units and center at (0, 0, 0)
        const scaleC = 10.74;
        capObj.scale.set(scaleC, scaleC, scaleC);
        capObj.position.set(0, 0.128 * scaleC, -0.085 * scaleC);
        this.realCapRoot.add(capObj);

        // Top crown squatchee button
        const buttonMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(this.garmentColor),
          roughness: 0.72
        });
        const buttonGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16);
        const squatchee = new THREE.Mesh(buttonGeom, buttonMat);
        squatchee.position.set(0, 2.05, -0.15);
        this.realCapRoot.add(squatchee);

        // Front Crown Decal Mesh (curved flush to front panels)
        const capDecalGeom = new THREE.PlaneGeometry(1.65, 1.25, 24, 24);
        const cPos = capDecalGeom.attributes.position;
        for (let i = 0; i < cPos.count; i++) {
          const x = cPos.getX(i);
          const y = cPos.getY(i);
          cPos.setZ(i, - (x * x) * 0.11 - (y * y) * 0.05);
        }
        capDecalGeom.computeVertexNormals();
        const cUvs = capDecalGeom.attributes.uv;
        for (let i = 0; i < cUvs.count; i++) {
          const u = cUvs.getX(i);
          const v = cUvs.getY(i);
          cUvs.setXY(i, 0.0688 + u * 0.38, 0.5806 - v * 0.38);
        }
        cUvs.needsUpdate = true;
        this.capDecalMeshFront = new THREE.Mesh(capDecalGeom, this.decalMaterial);
        this.capDecalMeshFront.position.set(0, 0.52, 1.52);
        this.capDecalMeshFront.rotation.x = -0.24;
        this.realCapRoot.add(this.capDecalMeshFront);

        this.scene.add(this.realCapRoot);
        this.modelsLoaded.cap = true;
        this.modelsLoading.cap = false;
        this.setAnimationMode(this.animationMode);
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady();

        const cbs = [...this.capCallbacks];
        this.capCallbacks = [];
        cbs.forEach(cb => cb());
      },
      undefined,
      (err) => {
        console.error('Error loading real cap OBJ:', err);
        this.modelsLoading.cap = false;
        const cbs = [...this.capCallbacks];
        this.capCallbacks = [];
        cbs.forEach(cb => cb());
      }
    );
  }

  loadRealGarmentModels() {
    this.ensureGarmentModelLoaded('hoodie');
    this.ensureGarmentModelLoaded('sweatpants');
    this.ensureGarmentModelLoaded('cap');
  }

  applyGarmentTypeVisibility() {
    const t = this.garmentType || 'oversized_tee';
    const isPants = (t === 'sweatpants');
    const isCap = (t === 'cap');
    const isHoodieFamily = (t === 'hoodie' || t === 'zip_hoodie');
    const isTshirtFamily = !isPants && !isCap && !isHoodieFamily;

    // Show high-res upper body shirt mesh for all t-shirt family garments
    if (this.tshirtStatic) {
      this.tshirtStatic.visible = isTshirtFamily && (this.animationMode === 'static' || this.animationMode === 'turntable' || this.animationMode === 'knit');
    }
    if (this.tshirtWaves) {
      this.tshirtWaves.visible = isTshirtFamily && this.animationMode === 'waves';
    }
    if (this.tshirtWalking) {
      this.tshirtWalking.visible = isTshirtFamily && (this.animationMode === 'walking' || this.animationMode === 'rotate_walk');
    }

    // Upper body t-shirt scaling
    if (this.tshirtStatic) {
      if (t === 'cropped_tee') {
        // High-waisted boxy streetwear crop: wide drop-shoulder with clean raised hem
        this.tshirtStatic.scale.set(0.0104, 0.0078, 0.0102);
        this.tshirtStatic.position.set(0, -0.427445 + 0.35, 0);
      } else if (t === 'regular_tee') {
        // Classic tailored fitted cut (standard shoulder seams, tailored torso, distinct from oversized)
        this.tshirtStatic.scale.set(0.0084, 0.0094, 0.0080);
        this.tshirtStatic.position.set(0, -0.427445, 0);
      } else if (t === 'sweatshirt') {
        // Heavyweight fleece boxy drape matching long-sleeve sweatshirt attachments
        this.tshirtStatic.scale.set(0.0102, 0.0100, 0.0104);
        this.tshirtStatic.position.set(0, -0.427445, 0);
      } else if (t === 'polo') {
        // Tailored athletic polo shirt cut (Envato Elements style)
        this.tshirtStatic.scale.set(0.0094, 0.0096, 0.0090);
        this.tshirtStatic.position.set(0, -0.427445, 0);
      } else {
        // Streetwear oversized drop-shoulder cut
        this.tshirtStatic.scale.set(0.0100, 0.0100, 0.0100);
        this.tshirtStatic.position.set(0, -0.427445, 0);
      }
    }

    // Real models visibility
    if (this.realHoodieRoot) {
      this.realHoodieRoot.visible = isHoodieFamily;
    }
    if (this.realPantsRoot) {
      this.realPantsRoot.visible = isPants;
    }
    if (this.realCapRoot) {
      this.realCapRoot.visible = isCap;
    }

    // Attachments visibility
    if (this.hoodieZipperMesh) {
      this.hoodieZipperMesh.visible = (t === 'zip_hoodie');
    }
    if (this.sweatshirtGroup) {
      this.sweatshirtGroup.visible = (t === 'sweatshirt');
    }
    if (this.poloGroup) {
      this.poloGroup.visible = (t === 'polo');
    }
    this.updateDecalVisibility();
  }

  updateDecalVisibility() {
    const hasFront = this.designManager ? this.designManager.getLayersBySide('front').length > 0 : false;
    const hasBack = this.designManager ? this.designManager.getLayersBySide('back').length > 0 : false;

    if (this.hoodieDecalMeshFront) this.hoodieDecalMeshFront.visible = hasFront;
    if (this.hoodieDecalMeshBack) this.hoodieDecalMeshBack.visible = hasBack;
    if (this.pantsDecalMeshThigh) this.pantsDecalMeshThigh.visible = hasFront;
    if (this.pantsDecalMeshPocket) this.pantsDecalMeshPocket.visible = hasBack;
    if (this.capDecalMeshFront) this.capDecalMeshFront.visible = hasFront;
  }

  setAnimationMode(mode) {
    if (mode === 'walk') mode = 'walking';
    if (mode === 'wind') mode = 'waves';
    if (mode === 'none') mode = 'static';
    if (this.garmentType === 'cap' && (mode === 'walking' || mode === 'waves')) {
      mode = 'static';
    }
    if (this.garmentType === 'cap' && mode === 'rotate_walk') {
      mode = 'turntable';
    }
    this.animationMode = mode;

    // Requirement 4 & 5: When animation is on, camera animation should be off.
    // When static is clicked, all animation and camera animation should be off.
    this.cameraAnimationMode = 'none';

    // Reset current actions
    if (this.mixer) {
      Object.values(this.actions).forEach((a) => a.stop());
    }

    if (mode === 'static') {
      if (this.tshirtStatic) this.tshirtStatic.visible = true;
      if (this.tshirtWaves) this.tshirtWaves.visible = false;
      if (this.tshirtWalking) this.tshirtWalking.visible = false;
      if (this.tshirtPivot) {
        this.tshirtPivot.position.set(0, 0, 0);
        this.tshirtPivot.rotation.set(0, 0, 0);
        this.tshirtPivot.scale.set(1, 1, 1);
      }
      const rootsToReset = [
        this.tshirtPivot,
        this.realHoodieRoot,
        this.realPantsRoot,
        this.realCapRoot,
        this.attachmentsGroup
      ].filter(Boolean);
      rootsToReset.forEach((r) => {
        r.position.set(0, 0, 0);
        r.rotation.set(0, 0, 0);
        r.scale.set(1, 1, 1);
      });
    } else if (mode === 'waves') {
      if (this.tshirtStatic) this.tshirtStatic.visible = false;
      if (this.tshirtWalking) this.tshirtWalking.visible = false;
      if (this.tshirtWaves) {
        this.tshirtWaves.visible = true;
        const action = this.actions.tshirt_waves;
        if (action) {
          action.reset();
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        }
      }
      if (this.tshirtPivot) this.tshirtPivot.scale.set(1, 1, 1);
    } else if (mode === 'walking') {
      if (this.tshirtStatic) this.tshirtStatic.visible = false;
      if (this.tshirtWaves) this.tshirtWaves.visible = false;
      if (this.tshirtWalking) {
        this.tshirtWalking.visible = true;
        const action = this.actions.tshirt_walking;
        if (action) {
          action.reset();
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.setEffectiveTimeScale(this.walkSpeed || 1.0);
          action.play();
        }
      }
      if (this.tshirtPivot) this.tshirtPivot.scale.set(1, 1, 1);
    } else if (mode === 'knit') {
      if (this.tshirtStatic) this.tshirtStatic.visible = true;
      if (this.tshirtWaves) this.tshirtWaves.visible = false;
      if (this.tshirtWalking) this.tshirtWalking.visible = false;
      this.triggerKnitAnimation();
    } else if (mode === 'turntable') {
      if (this.tshirtStatic) this.tshirtStatic.visible = true;
      if (this.tshirtWaves) this.tshirtWaves.visible = false;
      if (this.tshirtWalking) this.tshirtWalking.visible = false;
      if (this.tshirtPivot) {
        this.tshirtPivot.position.set(0, 0, 0);
        this.tshirtPivot.rotation.x = 0;
        this.tshirtPivot.rotation.z = 0;
        this.tshirtPivot.scale.set(1, 1, 1);
      }
    } else if (mode === 'rotate_walk') {
      if (this.tshirtStatic) this.tshirtStatic.visible = false;
      if (this.tshirtWaves) this.tshirtWaves.visible = false;
      if (this.tshirtWalking) {
        this.tshirtWalking.visible = true;
        const action = this.actions.tshirt_walking;
        if (action) {
          action.reset();
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.setEffectiveTimeScale(this.walkSpeed || 1.0);
          action.play();
        }
      }
      if (this.tshirtPivot) this.tshirtPivot.scale.set(1, 1, 1);
    }

    if (mode !== 'knit') {
      if (this.tshirtPivot) this.tshirtPivot.scale.set(1, 1, 1);
      if (this.realHoodieRoot) this.realHoodieRoot.scale.set(1, 1, 1);
      if (this.realPantsRoot) this.realPantsRoot.scale.set(1, 1, 1);
      if (this.realCapRoot) this.realCapRoot.scale.set(1, 1, 1);
    }
    if (mode !== 'turntable' && mode !== 'rotate_walk') {
      if (this.tshirtPivot) this.tshirtPivot.rotation.y = 0;
      if (this.realHoodieRoot) this.realHoodieRoot.rotation.y = 0;
      if (this.realPantsRoot) this.realPantsRoot.rotation.y = 0;
      if (this.realCapRoot) this.realCapRoot.rotation.y = 0;
      if (this.attachmentsGroup) this.attachmentsGroup.rotation.y = 0;
    }

    if (this.hoodieMixer) {
      if (mode === 'walking' || mode === 'rotate_walk') {
        if (this.hoodieIdleAction) this.hoodieIdleAction.stop();
        if (this.hoodieWalkAction) {
          this.hoodieWalkAction.reset();
          this.hoodieWalkAction.setEffectiveTimeScale(this.walkSpeed || 1.0);
          this.hoodieWalkAction.play();
        }
      } else {
        if (this.hoodieWalkAction) this.hoodieWalkAction.stop();
        if (this.hoodieIdleAction) {
          this.hoodieIdleAction.reset();
          this.hoodieIdleAction.play();
        }
        if (this.hoodieDecalsGroup) {
          this.hoodieDecalsGroup.position.set(0, 0, 0);
          this.hoodieDecalsGroup.quaternion.identity();
        }
      }
    }

    this.applyGarmentTypeVisibility();
  }

  zoomIn(amount = 2.0) {
    if (!this.camera || !this.controls) return;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const dist = offset.length();
    const newDist = Math.max(this.controls.minDistance || 5, dist - amount);
    offset.setLength(newDist);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  zoomOut(amount = 2.0) {
    if (!this.camera || !this.controls) return;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const dist = offset.length();
    const newDist = Math.min(this.controls.maxDistance || 38, dist + amount);
    offset.setLength(newDist);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  async setZoom(enabled) {
    this.isZoomed = Boolean(enabled);
    return await this.setCameraPreset(this.currentCameraView || 'front', this.isZoomed);
  }

  setCameraPreset(view, isZoomed = this.isZoomed) {
    if (typeof isZoomed === 'boolean') {
      this.isZoomed = isZoomed;
    }

    let effectiveView = view;
    if (view === 'zoom') {
      this.isZoomed = !this.isZoomed;
      effectiveView = this.currentCameraView || 'front';
    } else if (view === 'chest') {
      this.isZoomed = true;
      effectiveView = this.currentCameraView || 'front';
    } else if (view) {
      this.currentCameraView = view;
      effectiveView = view;
    } else {
      effectiveView = this.currentCameraView || 'front';
    }

    return new Promise((resolve) => {
      const duration = 0.5;
      const startTime = performance.now();
      const startPos = this.camera.position.clone();
      let targetPos = new THREE.Vector3();

      const isPants = (this.garmentType === 'sweatpants');
      const isCap = (this.garmentType === 'cap');
      const isHoodie = (this.garmentType === 'hoodie' || this.garmentType === 'zip_hoodie');
      let controlsTarget = new THREE.Vector3(0, 0, 0);

      if (isHoodie) {
        const centerY = this.isZoomed ? 0.65 : 0.15;
        controlsTarget.set(-0.55, centerY, 0);
        const dist = this.isZoomed ? 14.5 : 23.5;
        switch (effectiveView) {
          case 'front': targetPos.set(-0.55, centerY, dist); break;
          case 'back': targetPos.set(-0.55, centerY, -dist); break;
          case 'side':
          case 'right': targetPos.set(dist - 0.55, centerY, 0); break;
          case 'left': targetPos.set(-dist - 0.55, centerY, 0); break;
          case 'hero': targetPos.set(this.isZoomed ? 8.0 : 11.5, this.isZoomed ? 1.4 : 1.8, this.isZoomed ? 12.0 : 19.0); break;
          default:
            targetPos.set(-0.55, centerY, dist);
            break;
        }
      } else if (isPants) {
        const centerY = this.isZoomed ? 0.30 : 0.0;
        controlsTarget.set(0, centerY, 0);
        const dist = this.isZoomed ? 15.0 : 24.5;
        switch (effectiveView) {
          case 'front': targetPos.set(0, centerY, dist); break;
          case 'back': targetPos.set(0, centerY, -dist); break;
          case 'side':
          case 'right': targetPos.set(dist, centerY, 0); break;
          case 'left': targetPos.set(-dist, centerY, 0); break;
          case 'hero': targetPos.set(this.isZoomed ? 8.0 : 12.0, this.isZoomed ? 1.2 : 1.5, this.isZoomed ? 12.5 : 20.0); break;
          default:
            targetPos.set(0, centerY, dist);
            break;
        }
      } else if (isCap) {
        const centerY = 0.40;
        controlsTarget.set(0, centerY, 0);
        const dist = this.isZoomed ? 9.5 : 14.5;
        switch (effectiveView) {
          case 'front': targetPos.set(0, centerY, dist); break;
          case 'back': targetPos.set(0, centerY, -dist); break;
          case 'side':
          case 'right': targetPos.set(dist, centerY, 0); break;
          case 'left': targetPos.set(-dist, centerY, 0); break;
          case 'hero': targetPos.set(this.isZoomed ? 2.0 : 2.8, this.isZoomed ? 1.2 : 1.6, this.isZoomed ? 8.5 : 13.5); break;
          default:
            targetPos.set(0, centerY, dist);
            break;
        }
      } else {
        const centerY = this.isZoomed ? 0.75 : 0.20;
        controlsTarget.set(0, centerY, 0);
        const dist = this.isZoomed ? 14.2 : 24.5;
        switch (effectiveView) {
          case 'front':
            targetPos.set(0, centerY, dist);
            break;
          case 'back':
            targetPos.set(0, centerY, -dist);
            break;
          case 'side':
          case 'right':
            targetPos.set(dist, centerY, 0);
            break;
          case 'left':
            targetPos.set(-dist, centerY, 0);
            break;
          case 'hero':
            targetPos.set(this.isZoomed ? 8.2 : 13.0, this.isZoomed ? 1.4 : 1.8, this.isZoomed ? 12.2 : 20.0);
            break;
          default:
            targetPos.set(0, centerY, dist);
            break;
        }
      }

      // Calculate spherical/orbital trajectory relative to controlsTarget so camera never passes through (0,0,0)
      const startRel = new THREE.Vector3().subVectors(startPos, controlsTarget);
      const targetRel = new THREE.Vector3().subVectors(targetPos, controlsTarget);

      const startRadius = Math.sqrt(startRel.x * startRel.x + startRel.z * startRel.z);
      const targetRadius = Math.sqrt(targetRel.x * targetRel.x + targetRel.z * targetRel.z);

      const startAngle = Math.atan2(startRel.x, startRel.z);
      const targetAngle = Math.atan2(targetRel.x, targetRel.z);

      let diffAngle = targetAngle - startAngle;
      while (diffAngle > Math.PI) diffAngle -= 2 * Math.PI;
      while (diffAngle < -Math.PI) diffAngle += 2 * Math.PI;

      // For direct 180° front-to-back rotation, enforce a positive clockwise arc around the garment
      if (Math.abs(Math.abs(diffAngle) - Math.PI) < 0.05) {
        diffAngle = Math.PI;
      }

      const animateCam = (now) => {
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentRadius = THREE.MathUtils.lerp(startRadius, targetRadius, ease);
        const currentAngle = startAngle + diffAngle * ease;
        const currentY = THREE.MathUtils.lerp(startPos.y, targetPos.y, ease);

        this.camera.position.set(
          controlsTarget.x + Math.sin(currentAngle) * currentRadius,
          currentY,
          controlsTarget.z + Math.cos(currentAngle) * currentRadius
        );
        this.controls.target.lerp(controlsTarget, ease);
        if (this.controls.update) this.controls.update();

        if (progress < 1) {
          requestAnimationFrame(animateCam);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animateCam);
    });
  }

  handleResize() {
    if (!this.container || this.isDisposed) return;
    const w = this.container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = this.container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    if (w <= 0 || h <= 0) return;
    this.width = w;
    this.height = h;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  pause() {
    this.isPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.clock.getDelta(); // Clear delta backlog to avoid sudden jump
    if (!this.animFrameId && !this.isDisposed) {
      this.animFrameId = requestAnimationFrame(this.animate);
    }
  }

  animate() {
    if (this.isDisposed || this.isPaused) {
      this.animFrameId = null;
      return;
    }
    this.animFrameId = requestAnimationFrame(this.animate);

    // High-precision clock delta: maintains live animation speed and smoothness during video recording
    const rawDelta = this.clock.getDelta();
    const delta = Math.min(Math.max(rawDelta, 0.001), 0.05);

    if (this.mixer) {
      this.mixer.update(delta);
    }
    if (this.hoodieMixer && (this.animationMode === 'walking' || this.animationMode === 'rotate_walk') && (this.garmentType === 'hoodie' || this.garmentType === 'zip_hoodie')) {
      this.hoodieMixer.update(delta);
      if (this.realHoodieRoot) {
        this.realHoodieRoot.updateMatrixWorld(true);
      }

      // Lock front and back decal meshes to upper chest bone during walk animation
      if (this.hoodieSpine2Bone && this.hoodieDecalsGroup && this.realHoodieRoot && this.hoodieInvSpine2M0) {
        this.invRealHoodieRootMatrix.copy(this.realHoodieRoot.matrixWorld).invert();
        this.currentSpine2LocalMatrix.multiplyMatrices(this.invRealHoodieRootMatrix, this.hoodieSpine2Bone.matrixWorld);
        this.hoodieDeltaMatrix.multiplyMatrices(this.currentSpine2LocalMatrix, this.hoodieInvSpine2M0);
        this.hoodieDeltaMatrix.decompose(this.hoodieDecalsGroup.position, this.hoodieDecalsGroup.quaternion, this.tempScale);
        this.hoodieDecalsGroup.updateMatrixWorld(true);
      }
    }

    // Knit animation mode: continuous textile yarn weave & thread growth
    if (this.animationMode === 'knit') {
      this.knitTime = (this.knitTime || 0) + delta * (this.walkSpeed || 1.0) * 3.6;
      const updateKnitTime = (mat) => {
        if (mat?.userData?.shader?.uniforms?.uKnitTime) {
          mat.userData.shader.uniforms.uKnitTime.value = this.knitTime;
        }
      };
      updateKnitTime(this.shirtMaterial);
      updateKnitTime(this.hoodieFabricMaterial);
      updateKnitTime(this.fabricMaterial);

      const waveX = Math.sin(this.knitTime) * 0.024;
      const waveY = Math.cos(this.knitTime * 0.85) * 0.016;
      const waveZ = Math.sin(this.knitTime * 1.1) * 0.024;

      const activeRoot = this.getActiveGarmentRoot();
      if (activeRoot) {
        activeRoot.scale.set(1 + waveX, 1 + waveY, 1 + waveZ);
      }

      // Micro fabric normal map weave tension oscillation
      const knitPulse = Math.sin(this.knitTime * 1.5) * 0.5 + 0.5;
      if (this.shirtMaterial && this.shirtMaterial.normalScale) {
        const nS = 0.16 + knitPulse * 0.14;
        this.shirtMaterial.normalScale.set(nS, nS);
      }
      if (this.hoodieFabricMaterial && this.hoodieFabricMaterial.normalScale) {
        const nH = 0.28 + knitPulse * 0.18;
        this.hoodieFabricMaterial.normalScale.set(nH, nH);
      }
    } else {
      const resetKnit = (mat) => {
        if (mat?.userData?.shader?.uniforms?.uKnitProgress) {
          mat.userData.shader.uniforms.uKnitProgress.value = 1.0;
        }
      };
      resetKnit(this.shirtMaterial);
      resetKnit(this.hoodieFabricMaterial);
      resetKnit(this.fabricMaterial);
    }

    // Sweatpants walking motion & drawstring physics
    if (this.realPantsRoot && this.garmentType === 'sweatpants') {
      if (this.animationMode === 'walking' || this.animationMode === 'rotate_walk') {
        this.pantsWalkTime = (this.pantsWalkTime || 0) + delta * (this.walkSpeed || 1.0) * 4.6;
        const strideBounce = Math.abs(Math.sin(this.pantsWalkTime)) * 0.12;
        this.realPantsRoot.rotation.z = Math.sin(this.pantsWalkTime * 0.5) * 0.028;
        this.realPantsRoot.rotation.x = Math.sin(this.pantsWalkTime) * 0.045;
        this.realPantsRoot.position.y = strideBounce - 0.06;

        if (this.pLeftStr && this.pRightStr) {
          this.pLeftStr.rotation.x = Math.sin(this.pantsWalkTime - 0.4) * 0.28;
          this.pLeftStr.rotation.z = -0.06 + Math.cos(this.pantsWalkTime * 0.5) * 0.16;
          this.pRightStr.rotation.x = Math.sin(this.pantsWalkTime - 0.6) * 0.28;
          this.pRightStr.rotation.z = 0.06 + Math.cos(this.pantsWalkTime * 0.5) * 0.16;
        }
      } else if (this.animationMode === 'waves') {
        this.pantsWaveTime = (this.pantsWaveTime || 0) + delta * 2.8;
        this.realPantsRoot.rotation.z = Math.sin(this.pantsWaveTime) * 0.022;
        this.realPantsRoot.position.y = 0;
        this.realPantsRoot.rotation.x = 0;
        if (this.pLeftStr && this.pRightStr) {
          this.pLeftStr.rotation.z = -0.06 + Math.sin(this.pantsWaveTime * 1.5) * 0.22;
          this.pRightStr.rotation.z = 0.06 + Math.sin(this.pantsWaveTime * 1.5 + 0.3) * 0.22;
        }
      } else if (this.animationMode !== 'knit') {
        this.realPantsRoot.position.y = 0;
        this.realPantsRoot.rotation.x = 0;
        this.realPantsRoot.rotation.z = 0;
        if (this.pLeftStr && this.pRightStr) {
          this.pLeftStr.rotation.set(0, 0, -0.06);
          this.pRightStr.rotation.set(0, 0, 0.06);
        }
      }
    }

    // Turntable rotation of garment (when active and not running showcase360 spin)
    const isShowcaseSpin = this.isRecordingVideo && this.recordingMotion === 'showcase360';
    if (!isShowcaseSpin && (this.animationMode === 'turntable' || this.animationMode === 'rotate_walk')) {
      const turnStep = delta * (this.turntableSpeed || 0.8) * 1.5;
      if (this.tshirtPivot) {
        this.tshirtPivot.rotation.y += turnStep;
      }
      if (this.realHoodieRoot && (this.garmentType === 'hoodie' || this.garmentType === 'zip_hoodie')) {
        this.realHoodieRoot.rotation.y += turnStep;
      }
      if (this.realPantsRoot && this.garmentType === 'sweatpants') {
        this.realPantsRoot.rotation.y += turnStep;
      }
      if (this.realCapRoot && this.garmentType === 'cap') {
        this.realCapRoot.rotation.y += turnStep;
      }
      if (this.attachmentsGroup) {
        this.attachmentsGroup.rotation.y += turnStep;
      }
    }

    // Video recording showcase motion: smooth continuous 360° spin loop based on elapsed time
    if (this.isRecordingVideo && this.recordingMotion === 'showcase360') {
      const elapsedSec = (performance.now() - (this.recordingStartTime || performance.now())) / 1000;
      const totalDuration = this.recordingDuration || 5;
      const progress = Math.min(1.0, elapsedSec / totalDuration);
      const loops = totalDuration >= 15 ? 2 : 1;
      const targetAngle = (this.recordingBaseAngle || 0) + progress * (2 * Math.PI * loops);

      if (this.tshirtPivot) this.tshirtPivot.rotation.y = targetAngle;
      if (this.realHoodieRoot && (this.garmentType === 'hoodie' || this.garmentType === 'zip_hoodie')) {
        this.realHoodieRoot.rotation.y = targetAngle;
      }
      if (this.realPantsRoot && this.garmentType === 'sweatpants') {
        this.realPantsRoot.rotation.y = targetAngle;
      }
      if (this.realCapRoot && this.garmentType === 'cap') {
        this.realCapRoot.rotation.y = targetAngle;
      }
      if (this.attachmentsGroup) {
        this.attachmentsGroup.rotation.y = targetAngle;
      }
    }

    // Camera animation modes (Verge3D replication)
    if (this.cameraAnimationMode === 'rotate') {
      this.cameraAngle += delta * 0.55;
      const r = 24.5;
      this.camera.position.x = Math.sin(this.cameraAngle) * r;
      this.camera.position.z = Math.cos(this.cameraAngle) * r;
      this.camera.position.y = 0;
      this.camera.lookAt(0, 0, 0);
    } else if (this.cameraAnimationMode === 'rotatezoom') {
      this.cameraAngle += delta * 0.55;
      this.cameraZoomTime += delta * 0.75;
      const r = 24.5 + Math.sin(this.cameraZoomTime) * 6.5;
      this.camera.position.x = Math.sin(this.cameraAngle) * r;
      this.camera.position.z = Math.cos(this.cameraAngle) * r;
      this.camera.position.y = Math.sin(this.cameraZoomTime * 0.5) * 2.5;
      this.camera.lookAt(0, 0, 0);
    } else {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);

    // Synchronously blit frame directly after render for exact frame pacing
    if (this.isRecordingVideo && this.onRecordingFrame) {
      this.onRecordingFrame(this.renderer.domElement);
    }
  }

  startVideoRecording({
    fps = 60,
    durationSeconds = 5,
    format = 'desktop',
    motion = 'current',
    backgroundColor = null,
    onFrame = null
  } = {}) {
    this.isRecordingVideo = true;
    this.recordingFps = fps;
    this.recordingDuration = durationSeconds;
    this.recordingMotion = motion;
    this.recordingFrame = 0;
    this.onRecordingFrame = onFrame;
    this.recordingStartTime = performance.now();

    // Preserve the user's active studio background and lighting
    this.originalSceneBackground = this.scene.background;
    if (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== '#121318') {
      this.scene.background = new THREE.Color(backgroundColor);
    }

    // Save controls state and lock orbit interaction during capture to prevent mouse movement
    this.preRecordState = {
      controlsEnabled: this.controls ? this.controls.enabled : true
    };
    if (this.controls) {
      this.controls.enabled = false;
    }

    // Preserve exact camera position, zoom, and orientation matching screen view
    this.recordingBaseAngle = (
      this.tshirtPivot?.rotation.y ||
      this.realHoodieRoot?.rotation.y ||
      this.realPantsRoot?.rotation.y ||
      this.realCapRoot?.rotation.y ||
      this.attachmentsGroup?.rotation.y ||
      0
    );
  }

  stopVideoRecording() {
    if (!this.isRecordingVideo) return;
    this.isRecordingVideo = false;
    this.onRecordingFrame = null;
    this.recordingFrame = 0;

    // Restore background if modified
    if (this.originalSceneBackground !== undefined) {
      this.scene.background = this.originalSceneBackground;
    }

    // Restore user orbit controls
    if (this.preRecordState && this.controls) {
      this.controls.enabled = this.preRecordState.controlsEnabled;
      this.preRecordState = null;
    }

    this.clock.getDelta(); // Clear delta backlog
  }

  captureSnapshot(width = 3840, height = 2160, isTransparent = true) {
    const originalWidth = this.width;
    const originalHeight = this.height;
    const originalRatio = this.renderer.getPixelRatio();

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', 0.95);

    this.renderer.setSize(originalWidth, originalHeight);
    this.renderer.setPixelRatio(originalRatio);
    this.camera.aspect = originalWidth / originalHeight;
    this.camera.updateProjectionMatrix();

    return dataUrl;
  }

  captureGarmentSnapshot(side = 'front', width = 1000, height = 1000) {
    if (!this.renderer || !this.camera || !this.scene) return null;

    // Save camera & controls state
    const originalPos = this.camera.position.clone();
    const originalTarget = this.controls ? this.controls.target.clone() : new THREE.Vector3();
    const originalWidth = this.width;
    const originalHeight = this.height;
    const originalRatio = this.renderer.getPixelRatio();

    // Save garment mesh transforms to ensure neutral flat pose
    const originalTransforms = [];
    const rootsToReset = [
      this.tshirtPivot,
      this.realHoodieRoot,
      this.realPantsRoot,
      this.realCapRoot,
      this.attachmentsGroup
    ].filter(Boolean);

    rootsToReset.forEach(r => {
      originalTransforms.push({
        obj: r,
        rotX: r.rotation.x,
        rotY: r.rotation.y,
        rotZ: r.rotation.z,
        posY: r.position.y
      });
      r.rotation.set(0, 0, 0);
      r.position.y = 0;
    });

    // Framing per garment
    const isPants = (this.garmentType === 'sweatpants');
    const isCap = (this.garmentType === 'cap');
    const isHoodie = (this.garmentType === 'hoodie' || this.garmentType === 'zip_hoodie');

    let camZ = 16.5;
    let camY = 0.70;
    let targetY = 0.15;

    if (isCap) {
      camZ = 10.5;
      camY = 0.35;
      targetY = 0.15;
    } else if (isPants) {
      camZ = 16.5;
      camY = 0.30;
      targetY = 0;
    } else if (isHoodie) {
      camZ = 16.5;
      camY = 0.65;
      targetY = 0.15;
    }

    if (side === 'back') {
      rootsToReset.forEach(r => {
        r.rotation.y = Math.PI;
      });
      this.camera.position.set(0, camY, camZ);
    } else {
      rootsToReset.forEach(r => {
        r.rotation.y = 0;
      });
      this.camera.position.set(0, camY, camZ);
    }
    this.camera.lookAt(0, targetY, 0);

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Temporarily hide decals during base garment snapshot so base garment remains clean
    const prevDecalVis = this.decalMaterial.opacity;
    this.decalMaterial.opacity = 0;

    const prevMap = this.shirtMaterial?.map;
    if (this.shirtMaterial) {
      this.shirtMaterial.map = null;
      this.shirtMaterial.color.set(this.garmentColor || '#ffffff');
      this.shirtMaterial.needsUpdate = true;
    }

    // Save and temporarily clear background for pure transparent PNG
    const originalBg = this.scene.background;
    this.scene.background = null;

    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    this.decalMaterial.opacity = prevDecalVis;
    this.scene.background = originalBg;

    if (this.shirtMaterial) {
      this.shirtMaterial.map = prevMap;
      this.shirtMaterial.color.set(0xffffff);
      this.shirtMaterial.needsUpdate = true;
    }

    // Restore garment transforms
    originalTransforms.forEach(t => {
      t.obj.rotation.set(t.rotX, t.rotY, t.rotZ);
      t.obj.position.y = t.posY;
    });

    // Restore camera & renderer state
    this.renderer.setSize(originalWidth, originalHeight);
    this.renderer.setPixelRatio(originalRatio);
    this.camera.position.copy(originalPos);
    if (this.controls) this.controls.target.copy(originalTarget);
    this.camera.aspect = originalWidth / originalHeight;
    this.camera.updateProjectionMatrix();
    if (this.controls) this.controls.update();

    return dataUrl;
  }

  exportGLTF(onComplete, onError) {
    try {
      const exporter = new GLTFExporter();
      let target = null;
      if (this.realHoodieRoot && this.realHoodieRoot.visible) {
        target = this.realHoodieRoot;
      } else if (this.realPantsRoot && this.realPantsRoot.visible) {
        target = this.realPantsRoot;
      } else if (this.realCapRoot && this.realCapRoot.visible) {
        target = this.realCapRoot;
      } else if (this.tshirtPivot && this.tshirtPivot.visible) {
        target = this.tshirtPivot;
      } else {
        target = this.tshirtPivot || this.scene;
      }

      exporter.parse(
        target,
        (gltf) => {
          const output = typeof gltf === 'string' ? gltf : JSON.stringify(gltf, null, 2);
          const blob = new Blob([output], { type: 'model/gltf+json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `virtualthreads-${this.garmentType || 'garment'}-${Date.now()}.gltf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          if (onComplete) onComplete();
        },
        (err) => {
          console.error('GLTF Export error:', err);
          if (onError) onError(err);
        },
        { binary: false, embedImages: true }
      );
    } catch (err) {
      console.error('GLTF Export failed:', err);
      if (onError) onError(err);
    }
  }

  dispose() {
    this.isDisposed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.designManager && this.designManager.dispose) {
      this.designManager.dispose();
    }
  }
}
