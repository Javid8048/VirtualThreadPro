import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { CanvasDesignManager } from './CanvasDesignManager';
import { ApparelMeshBuilder } from './ApparelMesh';
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
function applyInsideFabricShader(material, getInsideColor, getAcidWashIntensity, fabricMicroNormalMap = null) {
  material.customProgramCacheKey = () => 'inside-fabric-shader-v11';
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uInsideColor = { value: new THREE.Color(getInsideColor()) };
    shader.uniforms.uAcidWash = { value: 0.0 };
    shader.uniforms.uKnitProgress = { value: 1.0 };
    shader.uniforms.uKnitTime = { value: 0.0 };
    shader.uniforms.uFabricMicroNormalMap = { value: fabricMicroNormalMap };
    shader.uniforms.uFabricMicroRepeat = { value: new THREE.Vector2(36.0, 36.0) };
    shader.uniforms.uFabricMicroScale = { value: 0.60 };
    shader.uniforms.uHasFabricMicroNormal = { value: fabricMicroNormalMap ? 1.0 : 0.0 };

    shader.fragmentShader = `
      uniform vec3 uInsideColor;
      uniform float uAcidWash;
      uniform float uKnitProgress;
      uniform float uKnitTime;
      uniform sampler2D uFabricMicroNormalMap;
      uniform vec2 uFabricMicroRepeat;
      uniform float uFabricMicroScale;
      uniform float uHasFabricMicroNormal;
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
        diffuseColor.rgb = uInsideColor;
        if (uKnitProgress < 0.999) {
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

    const normalChunk = THREE.ShaderChunk.normal_fragment_maps;
    const modifiedNormalChunk = normalChunk.replace(
      'normal = normalize( tbn * mapN );',
      `
      if (uHasFabricMicroNormal > 0.5) {
        vec3 microN = texture2D( uFabricMicroNormalMap, vNormalMapUv * uFabricMicroRepeat ).xyz * 2.0 - 1.0;
        microN.xy *= uFabricMicroScale;
        mapN = normalize(vec3(mapN.xy + microN.xy, mapN.z * microN.z));
      }
      normal = normalize( tbn * mapN );
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      modifiedNormalChunk
    );

    // Full PBR lighting applies naturally to both exterior and interior linings
    material.userData.shader = shader;
  };
}




/**
 * Photorealistic 3D Scene Manager using the official VirtualThreads 3D T-shirt model.
 */
export class SceneManager {
  constructor(canvasContainer, onLoaded = () => {}, initialGarmentType = 'regular_tee') {
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
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.touchAction = 'none';
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
    const isMobilePortrait = typeof window !== 'undefined' && window.innerWidth < 768;
    this.controls.minDistance = isMobilePortrait ? 6.5 : 5.0;
    this.controls.maxDistance = 38;
    this.controls.target.set(0, 0.75, 0);

    // Auto-pause turntable spin on canvas touch/pointer interaction to eliminate rotation fight
    this.onTurntableAutoPause = null;
    this.handleCanvasPointerDown = () => {
      if (this.animationMode === 'turntable') {
        this.setAnimationMode('static');
        if (this.onTurntableAutoPause) {
          this.onTurntableAutoPause();
        }
      }
    };
    this.renderer.domElement.addEventListener('pointerdown', this.handleCanvasPointerDown, { passive: true });

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
    this.tshirtOversizedGeometry = null;
    this.tshirtRegularGeometry = null;
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

    // Custom background from device
    this.backdropMode = 'dark';
    this.customBackground = null;
    this.customBackgroundTexture = null;
    this.customBackgroundImage = null;

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

    // Material Presets calibrated for photorealistic fabric response
    this.blackPreset = {
      color: '#24272e',
      roughness: 0.85,
      metalness: 0.0,
      sheen: 1.0,
      sheenRoughness: 0.4,
      sheenColor: '#5a5f6e',
      normalScale: 0.8,
      rimIntensity: 2.5
    };
    this.bluePreset = {
      color: '#192848',
      roughness: 0.90,
      metalness: 0.0,
      sheen: 0.45,
      sheenRoughness: 0.5,
      sheenColor: '#506898',
      normalScale: 0.45
    };
    this.defaultPreset = {
      roughness: 0.95,
      metalness: 0.0,
      sheen: 0.30,
      sheenRoughness: 0.5,
      normalScale: 0.35
    };
    this.targetMaterialProps = null;

    // Contact shadow & Side-by-side comparison state
    this.contactShadow = null;
    this.comparisonContactShadow = null;
    this.isSideBySideComparison = false;
    this.comparisonShirtMesh = null;
    this.comparisonShirtMaterial = null;
    this.savedCameraState = null;

    // 7. Lighting
    this.lights = {};
    this.setupLighting('studio');

    // 8. Materials & Procedural Attachments (instant synchronous setup)
    this.hasTriggeredLoaded = false;
    this.initMaterials();
    this.setupGarmentAttachments();
    this.setupContactShadow();

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

    // Global debugging hook for inspecting meshes in console
    if (typeof window !== 'undefined') {
      window.__SCENE_MANAGER__ = this;
      window.__INSPECT_SCENE_MESHES__ = (label) => this.inspectSceneMeshes(label);
      window.__AUDIT_SCENE_MATERIALS__ = () => this.auditSceneMaterialsAndStrayPieces();
      window.__TOGGLE_COMPARISON__ = (enable) => this.setSideBySideComparison(enable);
      window.__UPDATE_BLACK_PRESET__ = (overrides) => this.updateBlackPreset(overrides);
      window.__BLACK_PRESET__ = this.blackPreset;
    }
  }

  initMaterials() {
    // Texture maps
    const textureLoader = new THREE.TextureLoader();
    const normalMap = textureLoader.load(getAssetUrl('/models/normaldetailsv2.jpg'));
    normalMap.wrapS = THREE.ClampToEdgeWrapping;
    normalMap.wrapT = THREE.ClampToEdgeWrapping;
    normalMap.flipY = false;

    // Authentic woven cotton micro-normal map for realistic textile drape & specular response
    const fabricMicroNormalMap = textureLoader.load(getAssetUrl('/models/NormalFabric.png'));
    fabricMicroNormalMap.wrapS = THREE.RepeatWrapping;
    fabricMicroNormalMap.wrapT = THREE.RepeatWrapping;
    fabricMicroNormalMap.repeat.set(36, 36);

    const aoTexture = textureLoader.load(getAssetUrl('/models/ao_tshirt_outside.jpg'));
    aoTexture.flipY = false;

    const maxAniso = this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 16;
    normalMap.anisotropy = maxAniso;
    fabricMicroNormalMap.anisotropy = maxAniso;
    aoTexture.anisotropy = maxAniso;
    aoTexture.colorSpace = THREE.LinearSRGBColorSpace;
    if (this.designManager.texture) {
      this.designManager.texture.anisotropy = maxAniso;
      this.designManager.texture.colorSpace = THREE.SRGBColorSpace;
    }
    if (this.designManager.decalTexture) {
      this.designManager.decalTexture.anisotropy = maxAniso;
      this.designManager.decalTexture.colorSpace = THREE.SRGBColorSpace;
    }

    this.fabricMicroNormalMap = fabricMicroNormalMap;

    // Load Studio HDR environment map for authentic studio reflections and balanced contrast
    if (this.renderer) {
      try {
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        const rgbeLoader = new RGBELoader();
        rgbeLoader.load(
          getAssetUrl('/models/studio_env.hdr'),
          (hdrTexture) => {
            const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
            this.scene.environment = envMap;
            hdrTexture.dispose();
            pmremGenerator.dispose();
          },
          undefined,
          (err) => {
            console.warn('Studio HDR environment fallback to standard studio lighting:', err);
          }
        );
      } catch (e) {
        console.warn('HDR environment init note:', e);
      }
    }

    this.jerseyNormalMap = normalMap;
    this.aoTexture = aoTexture;

    // Clean, 100% photorealistic matte cotton cloth material with dynamic canvas
    this.shirtMaterial = new THREE.MeshPhysicalMaterial({
      map: this.designManager.texture,
      roughness: 0.95,
      metalness: 0.0,
      sheen: 0.35,
      sheenRoughness: 0.5,
      clearcoat: 0.0,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      aoMap: aoTexture,
      aoMapIntensity: 0.65,
      side: THREE.DoubleSide
    });
    applyInsideFabricShader(this.shirtMaterial, () => this.garmentColor, null, fabricMicroNormalMap);

    this.fabricMaterial = new THREE.MeshPhysicalMaterial({
      map: this.designManager.texture,
      color: new THREE.Color(0xffffff),
      roughness: 0.95,
      metalness: 0.0,
      sheen: 0.35,
      sheenRoughness: 0.5,
      clearcoat: 0.0,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      aoMap: aoTexture,
      aoMapIntensity: 0.65,
      side: THREE.DoubleSide
    });
    applyInsideFabricShader(this.fabricMaterial, () => this.garmentColor, null, fabricMicroNormalMap);

    this.setGarmentColor(this.garmentColor, true);

    // Matte screen-print ink finish on decals (zero gloss/shine)
    this.decalMaterial = new THREE.MeshStandardMaterial({
      map: this.designManager.decalTexture,
      roughness: 0.95,
      metalness: 0.0,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.20, 0.20),
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
    // Heavy models load strictly on-demand when selected to avoid network and CPU strain
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

        // Setup individual meshes with their authentic geometry coordinates:
        this.tshirtStatic = gltf.scene.getObjectByName('tshirt_static');
        this.tshirtWaves = gltf.scene.getObjectByName('tshirt_waves');
        this.tshirtWalking = gltf.scene.getObjectByName('tshirt_walking');
        this.tshirtPivot = gltf.scene.getObjectByName('tshirt_pivot');
        if (this.tshirtPivot) {
          this.tshirtPivot.position.set(0, 0, 0);
          this.tshirtPivot.scale.set(1, 1, 1);
        }

        // Hide and remove environment spheres, camera planes & extra export meshes from gltf
        ['env_sphere', 'cameradefault_bg', 'camrotate_bg', 'camrotatezoom_bg', '3Dmodelexport', 'Plane.002', 'Plane.003', 'Plane.004', 'Plane.017'].forEach((name) => {
          const obj = gltf.scene.getObjectByName(name);
          if (obj) {
            obj.visible = false;
            if (obj.parent) obj.parent.remove(obj);
          }
        });

        // Ensure any other non-tshirt meshes in gltf are strictly hidden and disabled
        gltf.scene.traverse((child) => {
          if (child.isMesh && child !== this.tshirtStatic && child !== this.tshirtWaves && child !== this.tshirtWalking) {
            child.visible = false;
          }
        });

        // 1. Static T-shirt model (millimeter coords, rotated 90deg X, scale 0.01)
        if (this.tshirtStatic) {
          if (this.tshirtStatic.geometry && this.tshirtStatic.geometry.attributes.uv && !this.tshirtStatic.geometry.attributes.uv2) {
            this.tshirtStatic.geometry.attributes.uv2 = this.tshirtStatic.geometry.attributes.uv;
          }
          this.tshirtStatic.material = this.shirtMaterial;
          this.tshirtStatic.castShadow = true;
          this.tshirtStatic.receiveShadow = true;
          this.tshirtStatic.position.set(0, -0.427445, 0);
          this.tshirtStatic.rotation.set(Math.PI / 2, 0, 0);
          this.tshirtStatic.scale.set(0.01, 0.01, 0.01);
          this.tshirtStatic.visible = true;

          // Cache base oversized geometry and generate tailored regular fit geometry
          if (this.tshirtStatic.geometry) {
            this.tshirtOversizedGeometry = this.tshirtStatic.geometry.clone();
            this.tshirtOversizedGeometry.name = 'tshirt_geometry_oversized';
            this.tshirtRegularGeometry = this.createRegularFitGeometry(this.tshirtOversizedGeometry);
            this.tshirtRegularGeometry.name = 'tshirt_geometry_regular';
          }
        }

        // 2. Wind Waves animated model (native meter coords centered at origin)
        if (this.tshirtWaves) {
          if (this.tshirtWaves.geometry && this.tshirtWaves.geometry.attributes.uv && !this.tshirtWaves.geometry.attributes.uv2) {
            this.tshirtWaves.geometry.attributes.uv2 = this.tshirtWaves.geometry.attributes.uv;
          }
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
          if (this.tshirtWalking.geometry && this.tshirtWalking.geometry.attributes.uv && !this.tshirtWalking.geometry.attributes.uv2) {
            this.tshirtWalking.geometry.attributes.uv2 = this.tshirtWalking.geometry.attributes.uv;
          }
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
        this.auditSceneMaterialsAndStrayPieces();
        this.inspectSceneMeshes('T-shirt Model Loaded: ' + this.garmentType);

        const cbs = [...this.tshirtCallbacks];
        this.tshirtCallbacks = [];
        cbs.forEach(cb => cb());
      },
      undefined,
      (err) => {
        console.warn('⚠️ GLTF apparel model load error, creating procedural garment fallback:', err);
        if (!this.tshirtStatic) {
          const fallbackGeo = ApparelMeshBuilder.createTShirtGeometry('oversized');
          this.tshirtStatic = new THREE.Mesh(fallbackGeo, this.fabricMaterial || this.shirtMaterial);
          this.tshirtStatic.name = 'tshirt_static';
          this.tshirtStatic.position.set(0, -0.427445, 0);
          this.tshirtStatic.scale.set(0.72, 0.72, 0.72);
          this.tshirtStatic.visible = true;
          this.scene.add(this.tshirtStatic);
          this.tshirtOversizedGeometry = fallbackGeo;
          this.tshirtRegularGeometry = this.createRegularFitGeometry(fallbackGeo);
        }
        this.modelsLoaded.tshirt = true;
        this.modelsLoading.tshirt = false;
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady(true);
        const cbs = [...this.tshirtCallbacks];
        this.tshirtCallbacks = [];
        cbs.forEach(cb => cb());
      }
    );
  }

  createRegularFitGeometry(sourceGeometry) {
    const geo = sourceGeometry.clone();
    const pos = geo.attributes.position;
    const count = pos.count;

    function smoothstep(min, max, value) {
      const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return t * t * (3 - 2 * t);
    }

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const absX = Math.abs(x);
      const signX = Math.sign(x) || 1;

      // 1. Neckline protection weight: keep collar opening natural around neck
      const neckDist = Math.hypot(absX * 1.1, z + 360);
      const neckWeight = smoothstep(65, 115, neckDist);

      // 2. Torso width scale (tailored silhouette with subtle natural waist suppression)
      const waistCurve = Math.exp(-Math.pow((z - 210) / 100, 2)) * 0.035;
      const baseTorsoScaleX = 0.88 - waistCurve;

      // 3. Shoulder and Sleeve scaling along X
      // Natural shoulder placement: bring shoulder seam inward from dropped position
      const shoulderT = smoothstep(80, 220, absX) * smoothstep(-150, -320, z);
      // Conventional sleeve length: bring sleeve tip inward
      const sleeveT = smoothstep(175, 340, absX) * smoothstep(125, -90, z);

      let scaleX = baseTorsoScaleX;
      scaleX = scaleX * (1 - shoulderT * 0.04);
      scaleX = scaleX * (1 - sleeveT * 0.06);

      // Blend with neck (keep collar opening intact)
      scaleX = 1.0 * (1 - neckWeight) + scaleX * neckWeight;

      let newX = signX * absX * scaleX;

      // 4. Depth (Y) scale: moderate torso and sleeve depth (no baggy puffing)
      const scaleY = 0.85 + (1 - neckWeight) * 0.15;
      let newY = y * scaleY;

      // 5. Vertical (Z) shaping:
      let newZ = z;

      // A. Natural shoulder slope (slopes naturally towards deltoids instead of horizontal drop)
      const shoulderSlope = 14 * shoulderT;
      newZ += shoulderSlope;

      // B. Conventional sleeve lift (lifts drooping sleeve hem to classic mid-bicep)
      const sleeveLift = -24 * sleeveT;
      newZ += sleeveLift;

      // C. Sleeve circumference slimming (narrower sleeve diameter around arm)
      if (sleeveT > 0.01) {
        const armProg = Math.max(0, Math.min(1, (absX - 175) / 170));
        const axisZ = -115 + armProg * 153;
        const axisY = 3 + armProg * 16;
        
        const radZ = newZ - axisZ;
        const radY = newY - axisY;

        const sleeveRadiusScale = 1.0 - (0.18 * sleeveT);
        newZ = axisZ + radZ * sleeveRadiusScale;
        newY = axisY + radY * sleeveRadiusScale;
      }

      // D. Standard body length: slightly adjusted body length (~6.5% shorter hem)
      const hemT = smoothstep(0, 360, z) * (1 - sleeveT);
      newZ -= (z * 0.065) * hemT;

      pos.setXYZ(i, newX, newY, newZ);
    }

    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
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
      if (this.renderer) this.renderer.domElement.style.cursor = (this.designGestureMode === 'resize') ? 'nwse-resize' : 'move';
    }
    if (this.onInteractionModeChange) {
      this.onInteractionModeChange(mode);
    }
  }

  setDesignGestureMode(mode) {
    this.designGestureMode = mode; // 'move' | 'resize'
    if (this.renderer && this.renderer.domElement && this.interactionMode === 'dragDesign') {
      this.renderer.domElement.style.cursor = (mode === 'resize') ? 'nwse-resize' : 'move';
    }
    if (this.onDesignGestureModeChange) {
      this.onDesignGestureModeChange(mode);
    }
  }

  setupInteractions() {
    this.interactionMode = 'orbit'; // 'orbit' | 'dragDesign'
    this.designGestureMode = 'move'; // 'move' | 'resize'
    this.onDesignGestureModeChange = null;
    this.onInteractionModeChange = null;
    this.longPressTimeout = null;
    this.isLongPressed = false;
    this.pointerDownTime = 0;
    this.pointerDownPos = { x: 0, y: 0 };
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.is3DDragging = false;
    this.dragStart = null;

    const dom = this.renderer.domElement;

    // Double-click / double-tap handler: activates moving and resizing of designs upon garments
    const handleDesignDoubleClick = (clientX, clientY) => {
      if (!this.designManager || !this.designManager.layers || this.designManager.layers.length === 0) {
        return;
      }

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const mesh = this.getActiveMesh();
      let matchedLayer = null;

      if (mesh) {
        const intersects = this.raycaster.intersectObject(mesh, false);
        if (intersects.length > 0 && intersects[0].uv) {
          const uv = intersects[0].uv;
          const hitX = Math.round(uv.x * 2048);
          const hitY = Math.round(uv.y * 2048);
          const hitSide = hitX < 1024 ? 'front' : 'back';

          const sideLayers = this.designManager.layers.filter(l => (l.side || 'front') === hitSide);
          if (sideLayers.length > 0) {
            let closestDist = Infinity;
            for (const layer of sideLayers) {
              const d = Math.hypot(hitX - layer.x, hitY - layer.y);
              const halfDim = Math.max(((layer.width || 400) * (layer.scale || 1.0)) / 2, 220);
              if (d < halfDim && d < closestDist) {
                closestDist = d;
                matchedLayer = layer;
              }
            }
            if (!matchedLayer) {
              matchedLayer = sideLayers.reduce((prev, curr) => {
                const dPrev = Math.hypot(hitX - prev.x, hitY - prev.y);
                const dCurr = Math.hypot(hitX - curr.x, hitY - curr.y);
                return dCurr < dPrev ? curr : prev;
              });
            }
          }
        }
      }

      if (!matchedLayer) {
        matchedLayer = this.designManager.getActiveLayer() || this.designManager.layers[this.designManager.layers.length - 1];
      }

      if (matchedLayer) {
        this.designManager.setActiveLayer(matchedLayer.id);

        if (this.interactionMode === 'dragDesign') {
          // If already in drag mode, double click toggles between Move and Resize
          const nextGesture = (this.designGestureMode === 'resize') ? 'move' : 'resize';
          this.setDesignGestureMode(nextGesture);
        } else {
          // Enable design move & resize upon garments
          this.setInteractionMode('dragDesign');
          this.setDesignGestureMode('move');
          if (this.onInteractionModeChange) {
            this.onInteractionModeChange('dragDesign');
          }
        }

        // Initialize immediate drag so user can drag right away
        this.controls.enabled = false;
        this.is3DDragging = true;
        this.pointerDownTime = performance.now();
        this.pointerDownPos = { x: clientX, y: clientY };
        this.dragStart = {
          clientX,
          clientY,
          startX: matchedLayer.x,
          startY: matchedLayer.y,
          startScale: matchedLayer.scale || 1.0,
          layerId: matchedLayer.id,
          side: matchedLayer.side || 'front',
          isResizing: this.designGestureMode === 'resize'
        };

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([30, 40, 30]); } catch (err) {}
        }
      }
    };

    // Desktop double-click
    dom.addEventListener('dblclick', (e) => {
      handleDesignDoubleClick(e.clientX, e.clientY);
    });

    // Mobile 2-finger pinch-to-resize gesture on garments & touchstart double-tap
    let pinchStartDist = 0;
    let pinchStartScale = 1.0;
    let lastTouchStartTime = 0;
    let lastTouchStartX = 0;
    let lastTouchStartY = 0;

    dom.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        const touch = e.touches[0];
        const now = performance.now();
        const dist = Math.hypot(touch.clientX - lastTouchStartX, touch.clientY - lastTouchStartY);
        if (now - lastTouchStartTime < 450 && dist < 50) {
          lastTouchStartTime = 0;
          handleDesignDoubleClick(touch.clientX, touch.clientY);
          return;
        }
        lastTouchStartTime = now;
        lastTouchStartX = touch.clientX;
        lastTouchStartY = touch.clientY;
      }

      if (this.interactionMode === 'dragDesign' && e.touches && e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const activeLayer = this.designManager?.getActiveLayer() || this.designManager?.layers[0];
        pinchStartScale = activeLayer ? (activeLayer.scale || 1.0) : 1.0;
      }
    }, { passive: true });

    dom.addEventListener('touchmove', (e) => {
      if (this.interactionMode === 'dragDesign') {
        if (e.cancelable) {
          e.preventDefault();
        }
        if (e.touches && e.touches.length === 2 && pinchStartDist > 0) {
          const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const scaleChange = (currentDist - pinchStartDist) * 0.004;
          const activeLayer = this.designManager?.getActiveLayer() || this.designManager?.layers[0];
          if (activeLayer) {
            const newScale = Math.max(0.15, Math.min(3.5, pinchStartScale + scaleChange));
            this.designManager.updateLayer(activeLayer.id, { scale: parseFloat(newScale.toFixed(2)) }, true);
          }
        }
      }
    }, { passive: false });

    dom.addEventListener('pointerdown', (e) => {
      // Mobile / Touch double-tap detection (<450ms, <50px)
      const now = performance.now();
      const distFromLastTap = Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY);
      if (now - lastTapTime < 450 && distFromLastTap < 50) {
        lastTapTime = 0;
        handleDesignDoubleClick(e.clientX, e.clientY);
        try { dom.setPointerCapture(e.pointerId); } catch (err) {}
        return;
      }
      lastTapTime = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;

      // Direct 3D dragging when interactionMode is 'dragDesign' or when holding Shift
      if (this.interactionMode === 'dragDesign' || e.shiftKey) {
        const activeLayer = this.designManager?.getActiveLayer() || this.designManager?.layers[0];
        if (!activeLayer) return;

        if (this.designManager.activeLayerId !== activeLayer.id) {
          this.designManager.setActiveLayer(activeLayer.id);
        }

        this.controls.enabled = false;
        this.is3DDragging = true;
        this.pointerDownTime = performance.now();
        this.pointerDownPos = { x: e.clientX, y: e.clientY };
        this.isLongPressed = false;
        try { dom.setPointerCapture(e.pointerId); } catch (err) {}

        this.dragStart = {
          clientX: e.clientX,
          clientY: e.clientY,
          startX: activeLayer.x,
          startY: activeLayer.y,
          startScale: activeLayer.scale || 1.0,
          layerId: activeLayer.id,
          side: activeLayer.side || 'front',
          isResizing: this.designGestureMode === 'resize' || e.altKey || false
        };

        // Long-press detection (380ms) enables Move Mode
        if (this.longPressTimeout) clearTimeout(this.longPressTimeout);
        this.longPressTimeout = setTimeout(() => {
          this.isLongPressed = true;
          this.designGestureMode = 'move';
          if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.cursor = 'move';
          }
          if (this.dragStart) {
            this.dragStart.isResizing = false;
          }
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(35); } catch (err) {}
          }
          if (this.onDesignGestureModeChange) {
            this.onDesignGestureModeChange('move');
          }
        }, 380);

      }
    });

    dom.addEventListener('pointermove', (e) => {
      if (this.is3DDragging && this.dragStart) {
        if (e.cancelable) e.preventDefault();
        const deltaX = (e.clientX - this.dragStart.clientX);
        const deltaY = (e.clientY - this.dragStart.clientY);
        const distFromStart = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);

        if (distFromStart > 8 && !this.isLongPressed && this.longPressTimeout) {
          clearTimeout(this.longPressTimeout);
          this.longPressTimeout = null;
        }

        // Resize mode (via Mode toggle, or Alt+Drag, or designGestureMode === 'resize')
        if (this.dragStart.isResizing || this.designGestureMode === 'resize' || e.altKey) {
          // Dragging right/up increases size; dragging left/down decreases size
          const scaleFactor = (deltaX - deltaY) * 0.005;
          const newScale = Math.max(0.15, Math.min(3.5, (this.dragStart.startScale || 1.0) + scaleFactor));
          this.designManager.updateLayer(this.dragStart.layerId, { scale: parseFloat(newScale.toFixed(2)) }, true);
          return;
        }

        // Move mode: translate coordinates across front or back UV layout
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

        this.designManager.updateLayer(this.dragStart.layerId, { x: newX, y: newY }, true);
      }
    });

    const stop3DDrag = (e) => {
      if (this.longPressTimeout) {
        clearTimeout(this.longPressTimeout);
        this.longPressTimeout = null;
      }

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
          const newScale = Math.max(0.15, Math.min(3.5, (activeLayer.scale || 1.0) + zoomDelta));
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
    this.backdropMode = preset;
    Object.values(this.lights).forEach((l) => this.scene.remove(l));
    this.lights = {};

    // Calibrated studio lighting rig for photorealistic fabric fidelity across all garment colors
    // Key light - crisp directional illumination from front-left
    const keyIntensity = preset === 'light' ? 1.35 : (preset === 'custom' ? 1.40 : 1.45);
    const keyLight = new THREE.DirectionalLight(0xffffff, keyIntensity);
    keyLight.position.set(-4, 7.5, 14);
    this.scene.add(keyLight);
    this.lights.key = keyLight;

    // Soft fill light opposite the key light (front-right) to soften shadow contrast
    const fillLight = new THREE.DirectionalLight(0xf0f4ff, 1.05);
    fillLight.position.set(6, 4, 12);
    this.scene.add(fillLight);
    this.lights.fill = fillLight;

    // Cool rim light positioned directly behind the shirt to sculpt silhouette and drape
    const coolRimIntensity = (this.blackPreset && this.blackPreset.rimIntensity !== undefined) ? this.blackPreset.rimIntensity : 2.5;
    const rimLight = new THREE.DirectionalLight(0x9db0ff, coolRimIntensity);
    rimLight.position.set(0, 6.5, -12);
    this.scene.add(rimLight);
    this.lights.rim = rimLight;

    // Lateral rim lights for shoulder and sleeve drape separation
    const rightSideRim = new THREE.DirectionalLight(0x9db0ff, 1.20);
    rightSideRim.position.set(10, 6, -8);
    this.scene.add(rightSideRim);
    this.lights.sideRim = rightSideRim;

    const leftSideRim = new THREE.DirectionalLight(0x9db0ff, 1.20);
    leftSideRim.position.set(-10, 6, -8);
    this.scene.add(leftSideRim);
    this.lights.leftSideRim = leftSideRim;

    // Back Key light - ensures back of garment is equally well-lit during 360 turntable
    const backKeyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    backKeyLight.position.set(-4, 7.5, -14);
    this.scene.add(backKeyLight);
    this.lights.backKey = backKeyLight;

    // Dedicated Front Graphic Light - keeps chest prints bright, vivid, and pop
    const frontGraphicLight = new THREE.DirectionalLight(0xffffff, 0.55);
    frontGraphicLight.position.set(0, 1.5, 14);
    this.scene.add(frontGraphicLight);
    this.lights.frontGraphic = frontGraphicLight;

    // Dedicated Back Graphic Light - keeps back prints bright and clear when rotated
    const backGraphicLight = new THREE.DirectionalLight(0xffffff, 0.55);
    backGraphicLight.position.set(0, 1.5, -14);
    this.scene.add(backGraphicLight);
    this.lights.backGraphic = backGraphicLight;

    // Balanced Hemisphere Light: provides soft ground bounce reflection
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4dbe6, 0.65);
    this.scene.add(hemiLight);
    this.lights.hemi = hemiLight;

    // Soft ambient fill
    const ambIntensity = preset === 'light' ? 0.30 : (preset === 'custom' ? 0.32 : 0.35);
    const ambLight = new THREE.AmbientLight(0xffffff, ambIntensity);
    this.scene.add(ambLight);
    this.lights.amb = ambLight;
  }

  setCustomBackground(dataUrl, onDone) {
    this.customBackground = dataUrl || null;
    if (this.customBackgroundTexture) {
      this.customBackgroundTexture.dispose();
      this.customBackgroundTexture = null;
    }
    this.customBackgroundImage = null;

    if (!dataUrl) {
      if (this.backdropMode === 'custom') {
        this.scene.background = null;
      }
      if (onDone) onDone();
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      dataUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        this.customBackgroundTexture = tex;
        const img = new Image();
        img.onload = () => {
          this.customBackgroundImage = img;
          if (onDone) onDone();
        };
        img.src = dataUrl;
      },
      undefined,
      (err) => {
        console.warn('Could not load custom background texture:', err);
        if (onDone) onDone();
      }
    );
  }

  fitTextureCover(texture, imgW, imgH, canvasW, canvasH) {
    if (!texture || !imgW || !imgH || !canvasW || !canvasH) return;
    const imgAspect = imgW / imgH;
    const canvasAspect = canvasW / canvasH;
    texture.matrixAutoUpdate = false;
    if (imgAspect > canvasAspect) {
      const scale = canvasAspect / imgAspect;
      texture.repeat.set(scale, 1);
      texture.offset.set((1 - scale) / 2, 0);
    } else {
      const scale = imgAspect / canvasAspect;
      texture.repeat.set(1, scale);
      texture.offset.set(0, (1 - scale) / 2);
    }
    texture.updateMatrix();
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
    const t = this.garmentType || 'regular_tee';
    if (t === 'hoodie' || t === 'zip_hoodie') {
      return this.realHoodieRoot;
    }
    return this.tshirtPivot;
  }

  triggerKnitAnimation() {
    // Procedural line-by-line thread weaving growth simulation
    this.knitTime = 0;
    this.knitProgress = 0.0;
    const updateShaderKnit = (p) => {
      [this.shirtMaterial, this.hoodieFabricMaterial, this.fabricMaterial, this.decalMaterial].forEach((mat) => {
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


  isBlackColor(hex) {
    if (!hex) return false;
    const h = hex.toLowerCase();
    if (h === '#24272e' || h === '#14161b' || h === '#000000' || h === '#111111' || h === '#181818' || h === '#1a1a1a') return true;
    try {
      const c = new THREE.Color(hex);
      const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      return lum < 0.05;
    } catch (e) {
      return false;
    }
  }

  isBlueColor(hex) {
    if (!hex) return false;
    const h = hex.toLowerCase();
    if (h === '#192848' || h === '#1e3a8a' || h === '#172554') return true;
    try {
      const c = new THREE.Color(hex);
      const hsl = {};
      c.getHSL(hsl);
      return hsl.h >= 0.55 && hsl.h <= 0.72 && hsl.l < 0.45;
    } catch (e) {
      return false;
    }
  }

  getMaterialPresetForColor(hex) {
    if (!hex) return { ...this.defaultPreset, color: '#ffffff' };
    
    // Check if black / dark
    if (this.isBlackColor(hex)) {
      return {
        color: this.blackPreset.color || '#24272e',
        roughness: this.blackPreset.roughness !== undefined ? this.blackPreset.roughness : 0.85,
        metalness: 0.0,
        sheen: this.blackPreset.sheen !== undefined ? this.blackPreset.sheen : 1.0,
        sheenRoughness: this.blackPreset.sheenRoughness !== undefined ? this.blackPreset.sheenRoughness : 0.4,
        sheenColor: this.blackPreset.sheenColor || '#5a5f6e',
        normalScale: this.blackPreset.normalScale !== undefined ? this.blackPreset.normalScale : 0.8,
        aoMapIntensity: 0.75
      };
    }

    // Check if blue / navy
    if (this.isBlueColor(hex)) {
      return {
        color: hex,
        roughness: this.bluePreset.roughness !== undefined ? this.bluePreset.roughness : 0.90,
        metalness: 0.0,
        sheen: this.bluePreset.sheen !== undefined ? this.bluePreset.sheen : 0.45,
        sheenRoughness: this.bluePreset.sheenRoughness !== undefined ? this.bluePreset.sheenRoughness : 0.5,
        sheenColor: this.bluePreset.sheenColor || '#506898',
        normalScale: this.bluePreset.normalScale !== undefined ? this.bluePreset.normalScale : 0.45,
        aoMapIntensity: 0.65
      };
    }

    // Balanced preset for other garment colors
    const col = new THREE.Color(hex);
    return {
      color: hex,
      roughness: 0.95,
      metalness: 0.0,
      sheen: 0.30,
      sheenRoughness: 0.5,
      sheenColor: col.clone().lerp(new THREE.Color(0xffffff), 0.55).getHexString(),
      normalScale: 0.35,
      aoMapIntensity: 0.65
    };
  }

  applyMaterialProps(props) {
    if (!props) return;
    const { color, sheenColor, roughness, sheen, sheenRoughness, normalScale, aoMapIntensity } = props;

    const colorObj = color instanceof THREE.Color ? color : (color ? new THREE.Color(color) : null);
    const parseColorSafe = (val) => {
      if (!val) return null;
      if (val instanceof THREE.Color) return val;
      if (typeof val === 'string') {
        const hex = val.startsWith('#') ? val : '#' + val;
        try { return new THREE.Color(hex); } catch (e) { return null; }
      }
      try { return new THREE.Color(val); } catch (e) { return null; }
    };
    const sheenColorObj = parseColorSafe(sheenColor);

    const applyToMaterial = (mat) => {
      if (!mat || mat === this.decalMaterial) return;
      const mName = (mat.name || '').toLowerCase();
      if (mName.includes('slider') || mName.includes('metal') || mName.includes('button')) return;

      if (colorObj && mat.color) {
        mat.color.copy(colorObj);
      }
      if (roughness !== undefined && mat.roughness !== undefined) {
        mat.roughness = roughness;
      }
      if (sheen !== undefined && mat.sheen !== undefined) {
        mat.sheen = sheen;
      }
      if (sheenRoughness !== undefined && mat.sheenRoughness !== undefined) {
        mat.sheenRoughness = sheenRoughness;
      }
      if (sheenColorObj && mat.sheenColor) {
        mat.sheenColor.copy(sheenColorObj);
      }
      if (normalScale !== undefined && mat.normalScale) {
        mat.normalScale.set(normalScale, normalScale);
      }
      if (aoMapIntensity !== undefined && mat.aoMapIntensity !== undefined) {
        mat.aoMapIntensity = aoMapIntensity;
      }
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;

      if (mat.userData?.shader?.uniforms?.uInsideColor && colorObj) {
        mat.userData.shader.uniforms.uInsideColor.value.copy(colorObj);
      }
    };

    applyToMaterial(this.shirtMaterial);
    applyToMaterial(this.fabricMaterial);
    applyToMaterial(this.hoodieFabricMaterial);

    const updateMeshColors = (root) => {
      if (!root) return;
      root.traverse((c) => {
        if (c.isMesh && c.material && c !== this.comparisonShirtMesh) {
          if (Array.isArray(c.material)) {
            c.material.forEach(applyToMaterial);
          } else {
            applyToMaterial(c.material);
          }
        }
      });
    };

    updateMeshColors(this.gltfScene);
    updateMeshColors(this.realHoodieRoot);
    updateMeshColors(this.realPantsRoot);
    updateMeshColors(this.realCapRoot);
    updateMeshColors(this.attachmentsGroup);
  }

  setGarmentColor(hex, immediate = false) {
    let resolvedHex = hex || '#ffffff';
    if (this.isBlackColor(resolvedHex)) {
      resolvedHex = this.blackPreset.color || '#24272e';
    }
    this.garmentColor = resolvedHex;

    if (this.designManager) {
      this.designManager.setGarmentColor(resolvedHex);
    }

    const preset = this.getMaterialPresetForColor(resolvedHex);
    const targetColor = new THREE.Color(preset.color);
    const sheenHex = typeof preset.sheenColor === 'string'
      ? (preset.sheenColor.startsWith('#') ? preset.sheenColor : '#' + preset.sheenColor)
      : (preset.sheenColor || '#5a5f6e');
    const targetSheenColor = new THREE.Color(sheenHex);

    if (immediate) {
      this.applyMaterialProps({
        color: targetColor,
        sheenColor: targetSheenColor,
        roughness: preset.roughness,
        sheen: preset.sheen,
        sheenRoughness: preset.sheenRoughness,
        normalScale: preset.normalScale,
        aoMapIntensity: preset.aoMapIntensity
      });
      this.targetMaterialProps = null;
    } else {
      this.targetMaterialProps = {
        color: targetColor,
        sheenColor: targetSheenColor,
        roughness: preset.roughness,
        sheen: preset.sheen,
        sheenRoughness: preset.sheenRoughness,
        normalScale: preset.normalScale,
        aoMapIntensity: preset.aoMapIntensity
      };
    }
  }

  setupContactShadow() {
    if (this.contactShadow) {
      this.scene.remove(this.contactShadow);
      if (this.contactShadow.geometry) this.contactShadow.geometry.dispose();
      if (this.contactShadow.material) {
        if (this.contactShadow.material.map) this.contactShadow.material.map.dispose();
        this.contactShadow.material.dispose();
      }
      this.contactShadow = null;
    }

    if (typeof document === 'undefined') return;

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.30)');
    grad.addColorStop(0.70, 'rgba(0, 0, 0, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(5.6, 3.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.60,
      depthWrite: false
    });

    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.name = 'garment_contact_shadow';
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(0, -4.32, 0);
    this.scene.add(this.contactShadow);
  }

  auditSceneMaterialsAndStrayPieces() {
    const strayNames = ['env_sphere', 'cameradefault_bg', 'camrotate_bg', 'camrotatezoom_bg', '3Dmodelexport', 'Plane.002', 'Plane.003', 'Plane.004', 'Plane.017'];
    const issuesFound = [];

    this.scene.traverse((obj) => {
      if (obj.isMesh && obj !== this.contactShadow && obj !== this.comparisonContactShadow) {
        const name = obj.name || '';
        const isStray = strayNames.some(s => name === s || name.includes(s));
        if (isStray) {
          obj.visible = false;
          if (obj.parent && obj.parent !== this.scene) {
            try { obj.parent.remove(obj); } catch (e) {}
          }
          issuesFound.push({ type: 'Stray leftover pattern piece hidden & removed', name: obj.name });
          return;
        }

        if (!obj.material) {
          console.warn('⚠️ [Scene Audit] Mesh has NO material! Assigning shared fabric material:', obj.name);
          obj.material = this.fabricMaterial || this.shirtMaterial;
          obj.visible = true;
          issuesFound.push({ type: 'Missing material fixed', name: obj.name });
        } else {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(mat => {
            if (mat !== this.decalMaterial && !mat.name?.toLowerCase().includes('button')) {
              mat.side = THREE.DoubleSide;
              if (mat.map && mat.map.colorSpace !== THREE.SRGBColorSpace) {
                mat.map.colorSpace = THREE.SRGBColorSpace;
              }
              mat.needsUpdate = true;
            }
          });
        }
      }
    });

    console.group('🔍 [Scene Audit: Materials & Stray Pieces]');
    if (issuesFound.length > 0) {
      console.table(issuesFound);
    } else {
      console.log('✅ All scene garment meshes have valid PBR materials, DoubleSide enabled, and stray pieces hidden.');
    }
    console.groupEnd();

    return issuesFound;
  }

  setSideBySideComparison(enable) {
    this.isSideBySideComparison = !!enable;

    if (!this.tshirtStatic && !this.realHoodieRoot) {
      console.warn('Model not loaded yet for side-by-side comparison');
      return;
    }

    if (this.isSideBySideComparison) {
      // 1. Prepare comparison material for black
      if (!this.comparisonShirtMaterial) {
        this.comparisonShirtMaterial = new THREE.MeshPhysicalMaterial({
          map: this.designManager?.texture || null,
          color: new THREE.Color(this.blackPreset.color || '#24272e'),
          roughness: this.blackPreset.roughness !== undefined ? this.blackPreset.roughness : 0.85,
          metalness: 0.0,
          sheen: this.blackPreset.sheen !== undefined ? this.blackPreset.sheen : 1.0,
          sheenRoughness: this.blackPreset.sheenRoughness !== undefined ? this.blackPreset.sheenRoughness : 0.4,
          sheenColor: new THREE.Color(this.blackPreset.sheenColor || '#5a5f6e'),
          normalMap: this.jerseyNormalMap || null,
          normalScale: new THREE.Vector2(this.blackPreset.normalScale || 0.8, this.blackPreset.normalScale || 0.8),
          aoMap: this.aoTexture || null,
          aoMapIntensity: 0.75,
          side: THREE.DoubleSide
        });
        applyInsideFabricShader(this.comparisonShirtMaterial, () => this.blackPreset.color || '#24272e', null, this.fabricMicroNormalMap);
      }

      // 2. Prepare comparison mesh (Black on the right: X = +2.85)
      if (!this.comparisonShirtMesh && this.tshirtStatic) {
        this.comparisonShirtMesh = new THREE.Mesh(this.tshirtStatic.geometry, this.comparisonShirtMaterial);
        this.comparisonShirtMesh.name = 'comparison_shirt_black';
        this.comparisonShirtMesh.rotation.copy(this.tshirtStatic.rotation);
        this.comparisonShirtMesh.scale.copy(this.tshirtStatic.scale);
        this.scene.add(this.comparisonShirtMesh);
      }

      if (this.comparisonShirtMesh && this.tshirtStatic) {
        this.comparisonShirtMesh.geometry = this.tshirtStatic.geometry;
        this.comparisonShirtMesh.position.set(2.85, this.tshirtStatic.position.y, this.tshirtStatic.position.z);
        this.comparisonShirtMesh.visible = true;
      }

      // 3. Primary shirt (Blue on the left: X = -2.85)
      if (this.tshirtPivot) {
        this.tshirtPivot.position.x = -2.85;
      } else if (this.tshirtStatic) {
        this.tshirtStatic.position.x = -2.85;
      }
      this.setGarmentColor('#192848', true);

      // 4. Contact shadows at -2.85 and +2.85
      if (this.contactShadow) {
        this.contactShadow.position.x = -2.85;
      }
      if (!this.comparisonContactShadow && this.contactShadow) {
        this.comparisonContactShadow = this.contactShadow.clone();
        this.comparisonContactShadow.name = 'comparison_contact_shadow';
        this.scene.add(this.comparisonContactShadow);
      }
      if (this.comparisonContactShadow) {
        this.comparisonContactShadow.position.set(2.85, -4.32, 0);
        this.comparisonContactShadow.visible = true;
      }

      // 5. Camera framing symmetrically to inspect both garments
      if (this.camera && this.controls) {
        if (!this.savedCameraState) {
          this.savedCameraState = {
            camPos: this.camera.position.clone(),
            target: this.controls.target.clone()
          };
        }
        this.camera.position.set(0, 0.75, 18.5);
        this.controls.target.set(0, 0.75, 0);
        this.controls.update();
      }
    } else {
      // Restore single garment view
      if (this.comparisonShirtMesh) {
        this.comparisonShirtMesh.visible = false;
      }
      if (this.comparisonContactShadow) {
        this.comparisonContactShadow.visible = false;
      }
      if (this.tshirtPivot) {
        this.tshirtPivot.position.x = 0;
      } else if (this.tshirtStatic) {
        this.tshirtStatic.position.x = 0;
      }
      if (this.contactShadow) {
        this.contactShadow.position.x = 0;
      }

      // Restore camera
      if (this.savedCameraState && this.camera && this.controls) {
        this.camera.position.copy(this.savedCameraState.camPos);
        this.controls.target.copy(this.savedCameraState.target);
        this.controls.update();
        this.savedCameraState = null;
      }

      // Restore garment color
      this.setGarmentColor(this.garmentColor, true);
    }
  }

  updateBlackPreset(overrides) {
    if (!overrides) return;
    this.blackPreset = { ...this.blackPreset, ...overrides };

    if (this.isBlackColor(this.garmentColor)) {
      this.setGarmentColor(this.blackPreset.color || '#24272e', true);
    }

    if (this.comparisonShirtMaterial) {
      if (overrides.color) {
        this.comparisonShirtMaterial.color.set(overrides.color);
        if (this.comparisonShirtMaterial.userData?.shader?.uniforms?.uInsideColor) {
          this.comparisonShirtMaterial.userData.shader.uniforms.uInsideColor.value.set(overrides.color);
        }
      }
      if (overrides.roughness !== undefined) {
        this.comparisonShirtMaterial.roughness = overrides.roughness;
      }
      if (overrides.sheen !== undefined) {
        this.comparisonShirtMaterial.sheen = overrides.sheen;
      }
      if (overrides.sheenRoughness !== undefined) {
        this.comparisonShirtMaterial.sheenRoughness = overrides.sheenRoughness;
      }
      if (overrides.sheenColor) {
        this.comparisonShirtMaterial.sheenColor.set(overrides.sheenColor);
      }
      if (overrides.normalScale !== undefined && this.comparisonShirtMaterial.normalScale) {
        this.comparisonShirtMaterial.normalScale.set(overrides.normalScale, overrides.normalScale);
      }
      this.comparisonShirtMaterial.needsUpdate = true;
    }

    if (overrides.rimIntensity !== undefined && this.lights.rim) {
      this.lights.rim.intensity = overrides.rimIntensity;
    }
  }

  // --- Dynamic Garment Type Switching (All 9 Garments in 3D) ---
  setGarmentType(type, onComplete) {
    this.garmentType = type || 'oversized_tee';
    if (this.designManager && this.designManager.setGarmentType) {
      this.designManager.setGarmentType(this.getGarmentFamily(this.garmentType));
    }

    const family = this.getGarmentFamily(this.garmentType);
    if (this.garmentType === 'polo' && (this.animationMode === 'walking' || this.animationMode === 'waves' || this.animationMode === 'rotate_walk')) {
      this.animationMode = 'static';
    }
    const isAlreadyLoaded = !!this.modelsLoaded[family];

    if (this.onGarmentLoading) {
      this.onGarmentLoading(true, this.garmentType);
    }

    const finish = () => {
      this.applyGarmentTypeVisibility();
      this.updateDecalVisibility();
      this.setAnimationMode(this.animationMode);
      this.triggerLoadedIfReady(true);
      if (this.controls && this.camera) {
        this.setCameraPreset(this.currentCameraView || 'front', this.isZoomed);
      }
      if (this.onGarmentLoading) {
        this.onGarmentLoading(false, this.garmentType);
      }
      this.inspectSceneMeshes('Garment Selected: ' + this.garmentType);
      if (onComplete) onComplete();
    };

    if (isAlreadyLoaded) {
      this.applyGarmentTypeVisibility();
      setTimeout(finish, 100);
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
    this.attachmentsGroup.visible = false;

    const fabMat = this.fabricMaterial || this.shirtMaterial;

    // 1. Sweatshirt: Authentic streetwear long sleeves, ribbed cuffs, waistband, and crewneck collar
    this.sweatshirtGroup = new THREE.Group();
    this.sweatshirtGroup.name = 'garment_sweatshirt_attachments';
    this.sweatshirtGroup.visible = false;
    this.crewCollarGroup = this.sweatshirtGroup;

    // Seamless left & right long sleeve extensions connecting directly inside drop-shoulder sleeve openings
    const armGeom = new THREE.CylinderGeometry(0.40, 0.52, 2.20, 24);
    
    // Left sleeve extension & ribbed cuff
    const leftArm = new THREE.Mesh(armGeom, fabMat);
    leftArm.name = 'attachment_sweatshirt_left_arm';
    leftArm.position.set(-4.08, 0.42, 0.04);
    leftArm.rotation.set(0.10, 0, 0.65);
    
    const cuffGeom = new THREE.CylinderGeometry(0.35, 0.38, 0.45, 24);
    const leftCuff = new THREE.Mesh(cuffGeom, fabMat);
    leftCuff.name = 'attachment_sweatshirt_left_cuff';
    leftCuff.position.set(-4.95, -0.38, 0.04);
    leftCuff.rotation.set(0.10, 0, 0.65);

    // Right sleeve extension & ribbed cuff
    const rightArm = new THREE.Mesh(armGeom, fabMat);
    rightArm.name = 'attachment_sweatshirt_right_arm';
    rightArm.position.set(4.08, 0.42, 0.04);
    rightArm.rotation.set(0.10, 0, -0.65);

    const rightCuff = new THREE.Mesh(cuffGeom, fabMat);
    rightCuff.name = 'attachment_sweatshirt_right_cuff';
    rightCuff.position.set(4.95, -0.38, 0.04);
    rightCuff.rotation.set(0.10, 0, -0.65);

    // Ribbed crewneck collar rim sitting flush on neckline (Y = 3.20)
    const crewGeom = new THREE.TorusGeometry(1.22, 0.10, 20, 48);
    crewGeom.rotateX(Math.PI * 0.45);
    const crewMesh = new THREE.Mesh(crewGeom, fabMat);
    crewMesh.name = 'attachment_sweatshirt_crew_collar';
    crewMesh.position.set(0, 3.20, 0.08);

    // Ribbed bottom hem waistband sitting flush at bottom hem (Y = -4.18)
    const waistGeom = new THREE.CylinderGeometry(2.18, 2.14, 0.46, 32);
    const waistHem = new THREE.Mesh(waistGeom, fabMat);
    waistHem.name = 'attachment_sweatshirt_waist_hem';
    waistHem.position.set(0, -4.18, 0.0);
    waistHem.scale.set(1.0, 1.0, 0.52);

    this.sweatshirtGroup.add(leftArm, leftCuff, rightArm, rightCuff, crewMesh, waistHem);
    this.attachmentsGroup.add(this.sweatshirtGroup);

    // 2. Polo Turned-down Folded Collar, 3-Button Placket & Ribbed Sleeve Cuffs (Envato Elements style)
    this.poloGroup = new THREE.Group();
    this.poloGroup.name = 'garment_polo_attachments';
    this.poloGroup.visible = false;

    // Fabric neck insert to completely mask and occlude the round crewneck rim underneath
    const neckCoverGeom = new THREE.CylinderGeometry(1.18, 1.25, 0.38, 32, 1, false);
    const neckCoverMesh = new THREE.Mesh(neckCoverGeom, fabMat);
    neckCoverMesh.name = 'attachment_polo_neck_cover';
    neckCoverMesh.position.set(0, 3.16, 0.50);
    neckCoverMesh.rotation.set(0.24, 0, 0);

    // Turned-down continuous collar band contouring the neck from back to front
    const poloCollarCurve = new THREE.CylinderGeometry(1.22, 1.36, 0.48, 36, 1, false, Math.PI * 0.18, Math.PI * 1.64);
    poloCollarCurve.rotateX(-0.16);
    const poloCollarMesh = new THREE.Mesh(poloCollarCurve, fabMat);
    poloCollarMesh.name = 'attachment_polo_collar';
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
    leftLapel.name = 'attachment_polo_left_lapel';
    leftLapel.position.set(-0.14, 3.20, 0.95);
    leftLapel.rotation.set(0.20, 0.10, -0.18);

    const rightLapel = new THREE.Mesh(lapelGeom, fabMat);
    rightLapel.name = 'attachment_polo_right_lapel';
    rightLapel.position.set(0.14, 3.20, 0.95);
    rightLapel.rotation.set(0.20, -0.10, 0.18);
    rightLapel.scale.set(-1, 1, 1);

    // Front center placket with stitch welt
    const placketGeom = new THREE.BoxGeometry(0.44, 1.62, 0.045);
    const placketMesh = new THREE.Mesh(placketGeom, fabMat);
    placketMesh.name = 'attachment_polo_placket';
    placketMesh.position.set(0, 2.14, 0.96);
    placketMesh.rotation.set(0.14, 0, 0);

    // Bottom box-stitch placket tab
    const placketTabGeom = new THREE.BoxGeometry(0.48, 0.22, 0.055);
    const placketTabMesh = new THREE.Mesh(placketTabGeom, fabMat);
    placketTabMesh.name = 'attachment_polo_placket_tab';
    placketTabMesh.position.set(0, 1.34, 0.88);
    placketTabMesh.rotation.set(0.14, 0, 0);

    // Pearlescent buttons (3-button authentic polo placket)
    const buttonMat = new THREE.MeshStandardMaterial({
      name: 'polo_button_material',
      color: 0xf4f4f4,
      roughness: 0.22,
      metalness: 0.12
    });
    const buttonGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.025, 20);
    buttonGeom.rotateX(Math.PI / 2 + 0.14);

    const b1 = new THREE.Mesh(buttonGeom, buttonMat);
    b1.name = 'attachment_polo_button_1';
    b1.position.set(0, 2.70, 1.00);
    const b2 = new THREE.Mesh(buttonGeom, buttonMat);
    b2.name = 'attachment_polo_button_2';
    b2.position.set(0, 2.22, 0.94);
    const b3 = new THREE.Mesh(buttonGeom, buttonMat);
    b3.name = 'attachment_polo_button_3';
    b3.position.set(0, 1.74, 0.88);

    this.poloNeckCover = neckCoverMesh;
    this.poloCollarMesh = poloCollarMesh;
    this.poloLeftLapel = leftLapel;
    this.poloRightLapel = rightLapel;
    this.poloPlacketMesh = placketMesh;
    this.poloPlacketTabMesh = placketTabMesh;
    this.poloB1 = b1;
    this.poloB2 = b2;
    this.poloB3 = b3;

    // Ribbed short-sleeve cuffs (left & right arm bands)
    const poloCuffGeom = new THREE.CylinderGeometry(0.82, 0.84, 0.26, 32, 1, true);
    const leftPoloCuff = new THREE.Mesh(poloCuffGeom, fabMat);
    leftPoloCuff.name = 'attachment_polo_cuff_left';
    leftPoloCuff.position.set(-3.25, 1.38, 0.06);
    leftPoloCuff.rotation.set(0, 0, -0.58);

    const rightPoloCuff = new THREE.Mesh(poloCuffGeom, fabMat);
    rightPoloCuff.name = 'attachment_polo_cuff_right';
    rightPoloCuff.position.set(3.25, 1.38, 0.06);
    rightPoloCuff.rotation.set(0, 0, 0.58);
    this.poloLeftCuff = leftPoloCuff;
    this.poloRightCuff = rightPoloCuff;

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

    this.hoodieFabricMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.garmentColor || '#ffffff'),
      normalMap: hoodieNormal,
      normalScale: new THREE.Vector2(0.32, 0.32),
      roughness: 1.0,
      metalness: 0.0,
      sheen: 0.0,
      clearcoat: 0.0,
      side: THREE.DoubleSide
    });
    applyInsideFabricShader(this.hoodieFabricMaterial, () => this.garmentColor, null, this.fabricMicroNormalMap);

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

        // Calibrated UV mapping (centered at 480 front, 1528 back)
        const fUvs = frontDecalGeom.attributes.uv;
        for (let i = 0; i < fUvs.count; i++) {
          const u = fUvs.getX(i);
          const v = fUvs.getY(i);
          fUvs.setXY(i, 0.0344 + u * 0.40, 0.5906 - v * 0.40);
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
          bUvs.setXY(i, 0.5461 + u * 0.40, 0.5906 - v * 0.40);
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
        console.warn('⚠️ Error loading virtualthreads hoodie GLB:', err);
        this.modelsLoaded.hoodie = true;
        this.modelsLoading.hoodie = false;
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady(true);
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
        console.warn('⚠️ Error loading real pants OBJ:', err);
        this.modelsLoaded.pants = true;
        this.modelsLoading.pants = false;
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady(true);
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
        console.warn('⚠️ Error loading real cap OBJ:', err);
        this.modelsLoaded.cap = true;
        this.modelsLoading.cap = false;
        this.applyGarmentTypeVisibility();
        this.triggerLoadedIfReady(true);
        const cbs = [...this.capCallbacks];
        this.capCallbacks = [];
        cbs.forEach(cb => cb());
      }
    );
  }

  loadRealGarmentModels() {
    this.ensureGarmentModelLoaded('hoodie');
  }

  applyGarmentTypeVisibility() {
    const t = this.garmentType || 'regular_tee';
    const isHoodieFamily = (t === 'hoodie' || t === 'zip_hoodie');
    const isPants = (t === 'sweatpants');
    const isCap = (t === 'cap');
    const isTshirtFamily = !isHoodieFamily && !isPants && !isCap;

    // Select authentic garment geometry matching selected fit
    if (this.tshirtStatic) {
      const isRegular = (t === 'regular_tee');
      const targetGeometry = isRegular ? this.tshirtRegularGeometry : this.tshirtOversizedGeometry;
      if (targetGeometry && this.tshirtStatic.geometry !== targetGeometry) {
        this.tshirtStatic.geometry = targetGeometry;
        this.tshirtStatic.geometry.attributes.position.needsUpdate = true;
        if (this.tshirtStatic.geometry.attributes.normal) {
          this.tshirtStatic.geometry.attributes.normal.needsUpdate = true;
        }
      }
    }

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

    // Upper body t-shirt scaling & positioning
    if (this.tshirtStatic) {
      if (t === 'cropped_tee') {
        // High-waisted boxy streetwear crop: wide drop-shoulder with clean raised hem
        this.tshirtStatic.scale.set(0.0104, 0.0078, 0.0102);
        this.tshirtStatic.position.set(0, -0.427445 + 0.35, 0);
      } else if (t === 'sweatshirt') {
        // Heavyweight fleece boxy drape matching long-sleeve sweatshirt attachments
        this.tshirtStatic.scale.set(0.0102, 0.0100, 0.0104);
        this.tshirtStatic.position.set(0, -0.427445, 0);
      } else if (t === 'polo') {
        // Tailored athletic polo shirt cut (Envato Elements style)
        this.tshirtStatic.scale.set(0.0094, 0.0096, 0.0090);
        this.tshirtStatic.position.set(0, -0.427445, 0);
      } else {
        // Both regular_tee and oversized_tee use authentic 1:1 scale (0.0100, 0.0100, 0.0100).
        // Their visible silhouette distinction is driven by the authentic 3D geometry vertices.
        this.tshirtStatic.scale.set(0.0100, 0.0100, 0.0100);
        this.tshirtStatic.position.set(0, -0.427445, 0);
      }
    }

    // Adapt animations to selected fit silhouette
    const isRegular = (t === 'regular_tee');
    if (this.tshirtWalking) {
      if (isRegular) {
        this.tshirtWalking.scale.set(0.88, 0.86, 0.94);
      } else {
        this.tshirtWalking.scale.set(1.0, 1.0, 1.0);
      }
    }
    if (this.tshirtWaves) {
      if (isRegular) {
        this.tshirtWaves.scale.set(0.88, 0.86, 0.94);
      } else {
        this.tshirtWaves.scale.set(1.0, 1.0, 1.0);
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

    // Attachments visibility: strictly hide procedural attachments when not sweatshirt or polo
    const isSweatshirt = (t === 'sweatshirt');
    const isPolo = (t === 'polo');
    if (this.attachmentsGroup) {
      this.attachmentsGroup.visible = isSweatshirt || isPolo;
    }
    if (this.sweatshirtGroup) {
      this.sweatshirtGroup.visible = isSweatshirt;
    }
    if (this.poloGroup) {
      this.poloGroup.visible = isPolo;
    }
    if (this.hoodieZipperMesh) {
      this.hoodieZipperMesh.visible = (t === 'zip_hoodie');
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

  inspectSceneMeshes(label = 'Scene Inspection') {
    const tableData = [];

    const isHierarchyVisible = (obj) => {
      let cur = obj;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    this.scene.traverse((obj) => {
      if (obj.isMesh) {
        const mat = obj.material;
        const matName = Array.isArray(mat)
          ? mat.map((m) => m?.name || m?.type || 'none').join(', ')
          : (mat?.name || mat?.type || 'none');
        const matColor = Array.isArray(mat)
          ? mat.map((m) => (m?.color ? '#' + m.color.getHexString() : 'none')).join(', ')
          : (mat?.color ? '#' + mat.color.getHexString() : 'none');
        const mapInfo = Array.isArray(mat)
          ? mat.map((m) => (m?.map ? (m.map.name || 'canvas/texture') + ` (cs:${m.map.colorSpace}, flipY:${m.map.flipY})` : 'none')).join(', ')
          : (mat?.map ? (mat.map.name || 'canvas/texture') + ` (cs:${mat.map.colorSpace}, flipY:${mat.map.flipY})` : 'none');
        const sideInfo = Array.isArray(mat)
          ? mat.map((m) => (m?.side === THREE.DoubleSide ? 'DoubleSide' : (m?.side === THREE.BackSide ? 'BackSide' : 'FrontSide'))).join(', ')
          : (mat?.side === THREE.DoubleSide ? 'DoubleSide' : (mat?.side === THREE.BackSide ? 'BackSide' : 'FrontSide'));
        const normalsCount = obj.geometry?.attributes?.normal ? obj.geometry.attributes.normal.count : 0;
        const vertexCount = obj.geometry?.attributes?.position ? obj.geometry.attributes.position.count : 0;

        tableData.push({
          Name: obj.name || '(unnamed mesh)',
          Parent: obj.parent?.name || '(root)',
          LocalVisible: obj.visible,
          EffectiveVisible: isHierarchyVisible(obj),
          Material: matName,
          Color: matColor,
          Side: sideInfo,
          TextureMap: mapInfo,
          Position: `${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}`,
          Rotation: `${obj.rotation.x.toFixed(2)}, ${obj.rotation.y.toFixed(2)}, ${obj.rotation.z.toFixed(2)}`,
          Scale: `${obj.scale.x.toFixed(3)}, ${obj.scale.y.toFixed(3)}, ${obj.scale.z.toFixed(3)}`,
          Normals: normalsCount > 0 ? `Yes (${normalsCount} norm / ${vertexCount} vert)` : 'NO NORMALS'
        });
      }
    });

    console.group(`🔍 [VirtualThread 3D Mesh Inspection] ${label} (Garment: ${this.garmentType}, Family: ${this.getGarmentFamily(this.garmentType)})`);
    console.table(tableData);
    console.groupEnd();

    return tableData;
  }

  setAnimationMode(mode) {
    if (mode === 'walk') mode = 'walking';
    if (mode === 'wind') mode = 'waves';
    if (mode === 'none') mode = 'static';
    const isNonWalkable = this.garmentType === 'polo';
    if (isNonWalkable && (mode === 'walking' || mode === 'waves')) {
      mode = 'static';
    }
    if (isNonWalkable && mode === 'rotate_walk') {
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
      const duration = 0.3;
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
    if (!this.container || this.isDisposed || this.isRecordingVideo) return;
    const w = this.container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = this.container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    if (w <= 0 || h <= 0) return;
    this.width = w;
    this.height = h;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const isMobilePortrait = window.innerWidth < 768;
    if (this.controls) {
      this.controls.minDistance = isMobilePortrait ? 6.5 : 5.0;
    }
  }

  pause() {
    if (this.isRecordingVideo) return; // Prevent background pause during video export
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

    // Throttle animation frame evaluation when tab is inactive to preserve thermal budget
    if (typeof document !== 'undefined' && document.hidden && !this.isRecordingVideo) {
      return;
    }

    // High-precision clock delta
    const rawDelta = this.clock.getDelta();
    // Do not strictly cap delta during video recording to ensure animation doesn't play in slow motion if frame rate drops
    const maxDelta = this.isRecordingVideo ? 0.33 : 0.05;
    const delta = Math.min(Math.max(rawDelta, 0.001), maxDelta);

    // Smooth material preset transition (color, sheenColor, roughness, sheen, normalScale)
    if (this.targetMaterialProps && (this.shirtMaterial || this.fabricMaterial || this.hoodieFabricMaterial)) {
      try {
        const lerpSpeed = Math.min(1.0, delta * 8.0);
        const activeMat = this.shirtMaterial || this.fabricMaterial || this.hoodieFabricMaterial;

        const targetColor = this.targetMaterialProps.color instanceof THREE.Color
          ? this.targetMaterialProps.color
          : new THREE.Color(this.targetMaterialProps.color || 0xffffff);

        const curColor = activeMat?.color ? activeMat.color.clone() : new THREE.Color(0xffffff);
        curColor.lerp(targetColor, lerpSpeed);

        const targetSheenColor = this.targetMaterialProps.sheenColor instanceof THREE.Color
          ? this.targetMaterialProps.sheenColor
          : new THREE.Color(
              typeof this.targetMaterialProps.sheenColor === 'string'
                ? (this.targetMaterialProps.sheenColor.startsWith('#') ? this.targetMaterialProps.sheenColor : '#' + this.targetMaterialProps.sheenColor)
                : (this.targetMaterialProps.sheenColor || 0xffffff)
            );

        let curSheenColor = activeMat?.sheenColor ? activeMat.sheenColor.clone() : new THREE.Color(0xffffff);
        curSheenColor.lerp(targetSheenColor, lerpSpeed);

        const curRoughness = typeof activeMat?.roughness === 'number' ? activeMat.roughness : 0.9;
        const targetRoughness = typeof this.targetMaterialProps.roughness === 'number' ? this.targetMaterialProps.roughness : 0.9;
        const nextRoughness = THREE.MathUtils.lerp(curRoughness, targetRoughness, lerpSpeed);

        const curSheen = typeof activeMat?.sheen === 'number' ? activeMat.sheen : 0.0;
        const targetSheen = typeof this.targetMaterialProps.sheen === 'number' ? this.targetMaterialProps.sheen : 0.0;
        const nextSheen = THREE.MathUtils.lerp(curSheen, targetSheen, lerpSpeed);

        const curSheenRoughness = typeof activeMat?.sheenRoughness === 'number' ? activeMat.sheenRoughness : 0.4;
        const targetSheenRoughness = typeof this.targetMaterialProps.sheenRoughness === 'number' ? this.targetMaterialProps.sheenRoughness : 0.4;
        const nextSheenRoughness = THREE.MathUtils.lerp(curSheenRoughness, targetSheenRoughness, lerpSpeed);

        const curNormalScale = activeMat?.normalScale ? activeMat.normalScale.x : 0.35;
        const targetNormalScale = typeof this.targetMaterialProps.normalScale === 'number' ? this.targetMaterialProps.normalScale : 0.35;
        const nextNormalScale = THREE.MathUtils.lerp(curNormalScale, targetNormalScale, lerpSpeed);

        // Euclidean RGB distance delta (THREE.Color has no distanceTo method)
        const dR = curColor.r - targetColor.r;
        const dG = curColor.g - targetColor.g;
        const dB = curColor.b - targetColor.b;
        const colorDist = Math.hypot(dR, dG, dB);
        const isConverged = colorDist < 0.003 && Math.abs(nextRoughness - targetRoughness) < 0.003;

        const propsToApply = isConverged ? this.targetMaterialProps : {
          color: curColor,
          sheenColor: curSheenColor,
          roughness: nextRoughness,
          sheen: nextSheen,
          sheenRoughness: nextSheenRoughness,
          normalScale: nextNormalScale,
          aoMapIntensity: this.targetMaterialProps.aoMapIntensity
        };

        this.applyMaterialProps(propsToApply);

        if (isConverged) {
          this.targetMaterialProps = null;
        }
      } catch (err) {
        console.error('⚠️ [VirtualThread] Error during material transition lerp:', err);
        if (this.targetMaterialProps) {
          this.applyMaterialProps(this.targetMaterialProps);
        }
        this.targetMaterialProps = null;
      }
    }

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
      updateKnitTime(this.decalMaterial);

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
      resetKnit(this.decalMaterial);

      // Restore accessories visibility when exiting knit mode
      if (this.garmentType === 'polo' && this.poloGroup) {
        if (this.poloB1) this.poloB1.visible = true;
        if (this.poloB2) this.poloB2.visible = true;
        if (this.poloB3) this.poloB3.visible = true;
        if (this.poloCollarMesh) this.poloCollarMesh.visible = true;
        if (this.poloNeckCover) this.poloNeckCover.visible = true;
        if (this.poloLeftLapel) this.poloLeftLapel.visible = true;
        if (this.poloRightLapel) this.poloRightLapel.visible = true;
        if (this.poloPlacketMesh) this.poloPlacketMesh.visible = true;
        if (this.poloPlacketTabMesh) this.poloPlacketTabMesh.visible = true;
        if (this.poloLeftCuff) this.poloLeftCuff.visible = true;
        if (this.poloRightCuff) this.poloRightCuff.visible = true;
      }
      if (this.pLeftStr && this.pRightStr) {
        this.pLeftStr.visible = true;
        this.pRightStr.visible = true;
      }
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

    // We no longer blit to an offscreen 2D canvas due to performance overhead.
    // The renderer.domElement itself is natively resized for optimal performance.
    
    // Synchronously blit frame directly after render for exact frame pacing
    if (this.isRecordingVideo && this.onRecordingFrame) {
      this.onRecordingFrame(this.recordingCanvas || this.renderer.domElement);
    }
  }



  startVideoRecording({
    fps = 24,
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

    // Determine the solid studio background color matching active studio lighting
    const isLight = this.backdropMode === 'light';
    const solidBg = (backgroundColor && backgroundColor !== 'transparent')
      ? backgroundColor
      : (isLight ? '#f3f4f6' : '#121318');

    this.recordingBgColor = solidBg;

    // Set 3D scene background to solid color or custom device background during recording
    this.originalSceneBackground = this.scene.background;
    if (this.backdropMode === 'custom' && this.customBackgroundTexture) {
      this.scene.background = this.customBackgroundTexture;
      const imgW = this.customBackgroundImage?.naturalWidth || this.customBackgroundImage?.width || targetW;
      const imgH = this.customBackgroundImage?.naturalHeight || this.customBackgroundImage?.height || targetH;
      this.fitTextureCover(this.customBackgroundTexture, imgW, imgH, targetW, targetH);
    } else {
      this.scene.background = new THREE.Color(solidBg);
    }

    // Save controls state and lock orbit interaction during capture to prevent mouse movement
    this.preRecordState = {
      controlsEnabled: this.controls ? this.controls.enabled : true,
      width: this.width,
      height: this.height,
      pixelRatio: this.renderer.getPixelRatio()
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

    let targetW = 1920;
    let targetH = 1080;
    if (format === 'mobile') {
      targetW = 1080;
      targetH = 1920;
    } else if (format === 'square') {
      targetW = 1080;
      targetH = 1080;
    }

    // Resize WebGL rendering context directly for zero-overhead native capture
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(targetW, targetH, false);
    this.camera.aspect = targetW / targetH;
    this.camera.updateProjectionMatrix();

    // Use renderer canvas directly for captureStream to avoid 2D canvas drawImage lag
    this.recordingCanvas = this.renderer.domElement;
  }

  stopVideoRecording() {
    if (!this.isRecordingVideo) return;
    this.isRecordingVideo = false;
    this.onRecordingFrame = null;
    this.recordingFrame = 0;

    // Restore background if modified
    if (this.originalSceneBackground !== undefined) {
      this.scene.background = this.originalSceneBackground;
      this.originalSceneBackground = undefined;
    }

    if (this.preRecordState) {
      if (this.controls) {
        this.controls.enabled = this.preRecordState.controlsEnabled;
      }
      this.renderer.setSize(this.preRecordState.width, this.preRecordState.height, false);
      this.renderer.setPixelRatio(this.preRecordState.pixelRatio);
      this.camera.aspect = this.preRecordState.width / this.preRecordState.height;
      this.camera.updateProjectionMatrix();
      this.preRecordState = null;
    }

    // Restore rotation to pre-recording base angle
    if (this.recordingBaseAngle !== undefined) {
      if (this.tshirtPivot) this.tshirtPivot.rotation.y = this.recordingBaseAngle;
      if (this.realHoodieRoot) this.realHoodieRoot.rotation.y = this.recordingBaseAngle;
      if (this.realPantsRoot) this.realPantsRoot.rotation.y = this.recordingBaseAngle;
      if (this.realCapRoot) this.realCapRoot.rotation.y = this.recordingBaseAngle;
      if (this.attachmentsGroup) this.attachmentsGroup.rotation.y = this.recordingBaseAngle;
    }

    this.recordingCanvas = null;
    this.recordingContext = null;
    this.clock.getDelta(); // Clear delta backlog
  }

  captureSnapshot(width = 3840, height = 2160, isTransparent = true) {
    const originalWidth = this.width;
    const originalHeight = this.height;
    const originalRatio = this.renderer.getPixelRatio();
    const origSceneBg = this.scene.background;

    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    if (!isTransparent && this.backdropMode === 'custom' && this.customBackgroundTexture) {
      this.scene.background = this.customBackgroundTexture;
      const imgW = this.customBackgroundImage?.naturalWidth || this.customBackgroundImage?.width || width;
      const imgH = this.customBackgroundImage?.naturalHeight || this.customBackgroundImage?.height || height;
      this.fitTextureCover(this.customBackgroundTexture, imgW, imgH, width, height);
    } else if (isTransparent) {
      this.scene.background = null;
    } else {
      const isLight = this.backdropMode === 'light';
      this.scene.background = new THREE.Color(isLight ? 0xf3f4f6 : 0x121318);
    }

    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', 0.95);

    this.scene.background = origSceneBg;
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
    if (this.renderer && this.renderer.domElement && this.handleCanvasPointerDown) {
      this.renderer.domElement.removeEventListener('pointerdown', this.handleCanvasPointerDown);
    }
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
