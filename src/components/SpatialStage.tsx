import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BORDER_EDGES,
  CAUSAL_EDGES,
  DIMENSIONAL_TIERS,
  DOMAIN_NODES,
  NODE_IDS,
  STRATA,
  STRATUM_HEX_DARK,
  STRATUM_HEX_LIGHT,
  type AblationEffects,
  type LensId,
  type NodeId,
} from '../domain/model';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export type CameraPreset = 'studio' | 'exploded' | 'top' | 'depth';

interface SpatialStageProps {
  theme: 'light' | 'dark';
  selectedId: NodeId | null;
  activeLens: LensId;
  ablation: AblationEffects;
  ablatedSet: Set<NodeId> | null;
  reducedMotion: boolean;
  frameBudgetCap: boolean;
  sensorTilt: { x: number; y: number };
  onSelectNode: (id: NodeId) => void;
  onRestoreAblation: () => void;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _color = new THREE.Color();

function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param) ?? '');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  studio: { pos: [0.4, 5.1, 10.6], target: [0, -0.35, 0], label: 'Studio' },
  exploded: { pos: [7.8, 4.6, 8.8], target: [0, 0.1, 0], label: 'Exploded' },
  top: { pos: [0.0, 12.2, 0.01], target: [0, 0, 0], label: 'Top Plan' },
  depth: { pos: [-5.6, 3.2, 8.9], target: [0, -0.5, 0], label: 'Depth Rings' },
};

export const SpatialStage: React.FC<SpatialStageProps> = ({
  theme,
  selectedId,
  activeLens,
  ablation,
  ablatedSet,
  reducedMotion,
  frameBudgetCap,
  sensorTilt,
  onSelectNode,
  onRestoreAblation,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('studio');
  const [explodeFactor, setExplodeFactor] = useState<number>(0.25);
  const [timeSpeed, setTimeSpeed] = useState<number>(1.0);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [hoveredId, setHoveredId] = useState<NodeId | null>(null);

  const stateRef = useRef({
    theme,
    selectedId,
    activeLens,
    ablation,
    ablatedSet,
    reducedMotion,
    frameBudgetCap,
    sensorTilt,
    cameraPreset,
    explodeFactor,
    timeSpeed,
  });

  stateRef.current = {
    theme,
    selectedId,
    activeLens,
    ablation,
    ablatedSet,
    reducedMotion,
    frameBudgetCap,
    sensorTilt,
    cameraPreset,
    explodeFactor,
    timeSpeed,
  };

  const onSelectRef = useRef(onSelectNode);
  onSelectRef.current = onSelectNode;

  const manualControlRef = useRef(false);
  const cameraGoalRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS.studio.pos),
    target: new THREE.Vector3(...CAMERA_PRESETS.studio.target),
  });

  // Trigger smooth camera preset transitions
  useEffect(() => {
    const presetKey = ablation.flattenSpatial ? 'top' : cameraPreset;
    const preset = CAMERA_PRESETS[presetKey];
    cameraGoalRef.current.pos.set(...preset.pos);
    cameraGoalRef.current.target.set(...preset.target);
    cameraGoalRef.current.active = true;
    manualControlRef.current = false;
  }, [cameraPreset, ablation.flattenSpatial]);

  // Keyboard shortcut 'H' to toggle bottom dock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || ablation.suspendWebGL) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 480;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(
      isSoftwareGl || stateRef.current.frameBudgetCap
        ? 1
        : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => setContextLost(false);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const bgHex = stateRef.current.theme === 'dark' ? 0x151513 : 0xf1eee7;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.032);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(...CAMERA_PRESETS.studio.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(...CAMERA_PRESETS.studio.target);
    controls.addEventListener('start', () => {
      manualControlRef.current = true;
      cameraGoalRef.current.active = false;
    });

    // Studio Environment Map (PMREM)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    // 3-Point Architectural Lighting
    const hemiLight = new THREE.HemisphereLight(0xeef2ff, 0x3b352d, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.85);
    keyLight.position.set(6.5, 9.5, 6.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.85);
    rimLight.position.set(-7.0, 4.5, -6.5);
    scene.add(rimLight);

    // Custom GLSL Time-Uniform Substrate Plane (Motion <-> Graphics Boundary Object)
    const waveUniforms = {
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(0x1f2937) },
      uLineColor: { value: new THREE.Color(0x64748b) },
      uAccentColor: { value: new THREE.Color(0xe87b54) },
      uFlatten: { value: 0 },
    };

    const substrateGeo = new THREE.PlaneGeometry(24, 16, 48, 32);
    substrateGeo.rotateX(-Math.PI / 2);
    const substrateMat = new THREE.ShaderMaterial({
      uniforms: waveUniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        uniform float uTime;
        uniform float uFlatten;
        varying vec2 vUv;
        varying float vElevation;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float d = length(pos.xz);
          float wave = sin(d * 1.15 - uTime * 1.4) * 0.11 * (1.0 - uFlatten);
          pos.y += wave;
          vElevation = wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uBaseColor;
        uniform vec3 uLineColor;
        uniform vec3 uAccentColor;
        varying vec2 vUv;
        varying float vElevation;
        void main() {
          vec2 grid = abs(fract(vUv * vec2(24.0, 16.0) - 0.5) - 0.5) / fwidth(vUv * vec2(24.0, 16.0));
          float line = 1.0 - min(min(grid.x, grid.y), 1.0);
          float radial = 1.0 - smoothstep(0.15, 0.52, length(vUv - 0.5));
          vec3 col = mix(uBaseColor, uLineColor, line * 0.45);
          col = mix(col, uAccentColor, max(0.0, vElevation * 3.5) * 0.35);
          float alpha = (line * 0.32 + 0.08) * radial;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    const substrateMesh = new THREE.Mesh(substrateGeo, substrateMat);
    substrateMesh.position.y = -3.65;
    scene.add(substrateMesh);

    // InstancedMesh Architectural Calibration Markers
    const markerGeo = new THREE.BoxGeometry(0.045, 0.045, 0.045);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0x8c877c,
      roughness: 0.6,
      metalness: 0.3,
    });
    const markerCount = 9 * 7;
    const markers = new THREE.InstancedMesh(markerGeo, markerMat, markerCount);
    const dummyMat = new THREE.Matrix4();
    let idx = 0;
    for (let ix = -4; ix <= 4; ix++) {
      for (let iz = -3; iz <= 3; iz++) {
        dummyMat.makeTranslation(ix * 1.65, -3.62, iz * 1.65);
        markers.setMatrixAt(idx++, dummyMat);
      }
    }
    markers.computeBoundingSphere();
    scene.add(markers);

    // Concentric Dimensional Nesting Rings (2D Static -> Time -> Depth -> Body)
    const ringGroup = new THREE.Group();
    ringGroup.position.y = -3.55;
    scene.add(ringGroup);
    const ringMats: THREE.MeshStandardMaterial[] = [];
    DIMENSIONAL_TIERS.forEach((tier, tIdx) => {
      const ringGeo = new THREE.TorusGeometry(tier.radius, 0.022, 12, 96);
      ringGeo.rotateX(Math.PI / 2);
      const rMat = new THREE.MeshStandardMaterial({
        color: tIdx === 0 ? 0x0369a1 : tIdx === 1 ? 0x0284c7 : tIdx === 2 ? 0x15803d : 0xb4431e,
        roughness: 0.35,
        metalness: 0.65,
        transparent: true,
        opacity: 0.55,
      });
      ringMats.push(rMat);
      const rMesh = new THREE.Mesh(ringGeo, rMat);
      rMesh.position.y = tIdx * 0.035;
      ringGroup.add(rMesh);
    });

    // Composite 4-Part Procedural Sculptures for All 14 Nodes
    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    interface NodeSculpture {
      id: NodeId;
      group: THREE.Group;
      core: THREE.Mesh;
      ring: THREE.Mesh;
      beacon: THREE.Mesh;
      coreMat: THREE.MeshPhysicalMaterial;
      plinthMat: THREE.MeshStandardMaterial;
      hitProxy: THREE.Mesh;
      basePos: THREE.Vector3;
      stratumIndex: number;
    }

    const plinthGeo = new THREE.CylinderGeometry(0.42, 0.5, 0.14, 8);
    const coreGeos = [
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.IcosahedronGeometry(0.3, 0),
      new THREE.BoxGeometry(0.44, 0.44, 0.44),
      new THREE.DodecahedronGeometry(0.3, 0),
    ];
    const haloGeo = new THREE.TorusGeometry(0.48, 0.022, 10, 48);
    const beaconGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8);
    const hitGeo = new THREE.SphereGeometry(0.62, 10, 10);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    const sculptures = new Map<NodeId, NodeSculpture>();
    const interactables: THREE.Object3D[] = [];

    NODE_IDS.forEach((id, nIdx) => {
      const node = DOMAIN_NODES[id];
      const stratumIndex = STRATA.indexOf(node.stratum);
      const group = new THREE.Group();
      group.position.set(...node.pos3d);

      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x3b3935,
        roughness: 0.78,
        metalness: 0.15,
      });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.y = -0.34;
      plinth.castShadow = !isSoftwareGl;
      plinth.receiveShadow = !isSoftwareGl;
      group.add(plinth);

      const coreMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.22,
        metalness: 0.35,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15,
      });
      const core = new THREE.Mesh(coreGeos[nIdx % coreGeos.length], coreMat);
      core.position.y = 0.02;
      core.castShadow = !isSoftwareGl;
      group.add(core);

      const ring = new THREE.Mesh(haloGeo, plinthMat);
      ring.rotation.x = Math.PI / 2.6;
      group.add(ring);

      const beacon = new THREE.Mesh(beaconGeo, coreMat);
      beacon.position.y = 0.48;
      group.add(beacon);

      const hitProxy = new THREE.Mesh(hitGeo, hitMat);
      hitProxy.userData.nodeId = id;
      group.add(hitProxy);
      interactables.push(hitProxy);

      sculptureGroup.add(group);
      sculptures.set(id, {
        id,
        group,
        core,
        ring,
        beacon,
        coreMat,
        plinthMat,
        hitProxy,
        basePos: new THREE.Vector3(...node.pos3d),
        stratumIndex,
      });
    });

    // Edge Lines connecting Causal & Border topology in 3D space
    const edgeGroup = new THREE.Group();
    scene.add(edgeGroup);

    interface EdgeLineEntry {
      a: NodeId;
      b: NodeId;
      kind: 'border' | 'causal' | 'constraint';
      line: THREE.Line;
      mat: THREE.LineBasicMaterial;
      positions: Float32Array;
    }

    const edgeLines: EdgeLineEntry[] = [];
    const addEdgeLine = (a: NodeId, b: NodeId, kind: EdgeLineEntry['kind']) => {
      const positions = new Float32Array(6);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: kind === 'constraint' ? 0xbe123c : 0x78716c,
        transparent: true,
        opacity: 0.28,
      });
      const line = new THREE.Line(geo, mat);
      edgeGroup.add(line);
      edgeLines.push({ a, b, kind, line, mat, positions });
    };

    BORDER_EDGES.forEach((e) => addEdgeLine(e.a, e.b, 'border'));
    CAUSAL_EDGES.filter((e) => e.kind === 'constrains').forEach((e) =>
      addEdgeLine(e.from, e.to, 'constraint')
    );

    // Raycasting for 3D Node Selection & Hover
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const updateNdc = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const onPointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(
        ev.clientX - pointerDownPos.x,
        ev.clientY - pointerDownPos.y
      );
      if (dist > 6) return; // Ignore orbit drag
      updateNdc(ev);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.nodeId as NodeId | undefined;
        if (hitId) onSelectRef.current(hitId);
      }
    };

    let lastHoverRay = 0;
    const onPointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverRay < 45) return;
      lastHoverRay = now;
      updateNdc(ev);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.nodeId as NodeId | undefined;
        renderer.domElement.style.cursor = 'pointer';
        if (hitId) setHoveredId(hitId);
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredId(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(320, entry.contentRect.width);
      const h = Math.max(320, entry.contentRect.height);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Pre-warm shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsedTime = 0;
    let frameSkipToggle = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const status = sync
            ? gl.getSyncParameter(sync, gl.SYNC_STATUS)
            : gl.SIGNALED;
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const rawDt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const s = stateRef.current;
      const isFrozen = s.reducedMotion || s.ablation.freezeMotion;
      const dt = isFrozen ? 0 : rawDt;

      // Apply Frame Budget Cap constraint live
      const targetPixelRatio =
        isSoftwareGl || s.frameBudgetCap
          ? 1
          : Math.min(window.devicePixelRatio || 1, 2);
      if (Math.abs(renderer.getPixelRatio() - targetPixelRatio) > 0.05) {
        renderer.setPixelRatio(targetPixelRatio);
      }

      if (s.frameBudgetCap && !isSoftwareGl) {
        frameSkipToggle = !frameSkipToggle;
        if (frameSkipToggle) {
          frameId = requestAnimationFrame(tick);
          return;
        }
      }

      elapsedTime += dt * s.timeSpeed;

      // Sync Light / Dark Architectural Theme
      const isDark = s.theme === 'dark';
      const targetBg = s.ablation.stripVisuals
        ? isDark
          ? 0x000000
          : 0xffffff
        : isDark
        ? 0x151513
        : 0xf1eee7;
      _color.setHex(targetBg);
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(_color, 0.15);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(scene.background as THREE.Color);
      }

      waveUniforms.uTime.value = elapsedTime;
      waveUniforms.uFlatten.value = s.ablation.flattenSpatial ? 1.0 : 0.0;
      waveUniforms.uBaseColor.value.setHex(isDark ? 0x1e1e1b : 0xe5e0d5);
      waveUniforms.uLineColor.value.setHex(isDark ? 0x57534e : 0xa8a29e);
      waveUniforms.uAccentColor.value.setHex(isDark ? 0xe87b54 : 0xb4431e);

      const palette = isDark ? STRATUM_HEX_DARK : STRATUM_HEX_LIGHT;

      // Smooth Camera Preset & Body-Sensor Parallax
      if (cameraGoalRef.current.active && !manualControlRef.current) {
        const dampAlpha = isFrozen ? 1 : 1 - Math.exp(-5.5 * rawDt);
        camera.position.lerp(cameraGoalRef.current.pos, dampAlpha);
        controls.target.lerp(cameraGoalRef.current.target, dampAlpha);
        if (camera.position.distanceTo(cameraGoalRef.current.pos) < 0.02) {
          cameraGoalRef.current.active = false;
        }
      }

      // Subtle Body / Sensor Tilt applied to sculptureGroup
      const targetRotY = s.ablation.flattenSpatial ? 0 : s.sensorTilt.x * 0.24;
      const targetRotX = s.ablation.flattenSpatial ? 0 : s.sensorTilt.y * 0.16;
      const tiltAlpha = isFrozen ? 1 : 1 - Math.exp(-7 * rawDt);
      sculptureGroup.rotation.y = THREE.MathUtils.lerp(
        sculptureGroup.rotation.y,
        targetRotY,
        tiltAlpha
      );
      sculptureGroup.rotation.x = THREE.MathUtils.lerp(
        sculptureGroup.rotation.x,
        targetRotX,
        tiltAlpha
      );

      // Update each 4-part Node Sculpture
      const explode = s.ablation.flattenSpatial ? 0 : s.explodeFactor;
      const zFlatten = s.ablation.flattenSpatial ? 0.02 : 1;

      sculptures.forEach((sc, id) => {
        const node = DOMAIN_NODES[id];
        const isSelected = s.selectedId === id;
        const isDegraded = s.ablatedSet?.has(id) ?? false;

        // Exploded Stratum Separation + 2D Spatial Flattening
        const stratumShiftX = (sc.stratumIndex - 2.5) * explode * 0.65;
        const floatY = isFrozen
          ? 0
          : Math.sin(elapsedTime * 1.15 + sc.stratumIndex * 0.9) * 0.08;
        const targetX = sc.basePos.x + stratumShiftX;
        const targetY =
          (s.ablation.flattenSpatial ? 0.0 : sc.basePos.y) + floatY;
        const targetZ = sc.basePos.z * zFlatten;

        const posAlpha = isFrozen ? 1 : 1 - Math.exp(-8 * rawDt);
        sc.group.position.x = THREE.MathUtils.lerp(sc.group.position.x, targetX, posAlpha);
        sc.group.position.y = THREE.MathUtils.lerp(sc.group.position.y, targetY, posAlpha);
        sc.group.position.z = THREE.MathUtils.lerp(sc.group.position.z, targetZ, posAlpha);

        const targetScale = isSelected ? 1.24 : 1.0;
        const nextScale = THREE.MathUtils.lerp(sc.group.scale.x, targetScale, posAlpha);
        sc.group.scale.setScalar(nextScale);

        if (!isFrozen) {
          sc.core.rotation.y += dt * (isSelected ? 1.1 : 0.35);
          sc.ring.rotation.z += dt * (isSelected ? 0.9 : 0.25);
        }

        const hex = s.ablation.stripVisuals
          ? isDark
            ? '#ffffff'
            : '#111111'
          : isDegraded
          ? '#be123c'
          : palette[node.stratum];
        sc.coreMat.color.set(hex);
        sc.coreMat.emissive.set(isSelected ? hex : '#000000');
        sc.coreMat.emissiveIntensity = isSelected ? 0.35 : 0.0;
        sc.coreMat.opacity = isDegraded ? 0.32 : 1.0;
        sc.coreMat.transparent = isDegraded;
        sc.plinthMat.color.setHex(isDark ? 0x2c2a26 : 0x57534e);
      });

      // Update topological lines between moving sculptures
      edgeLines.forEach((edge) => {
        const scA = sculptures.get(edge.a);
        const scB = sculptures.get(edge.b);
        if (!scA || !scB) return;

        scA.group.getWorldPosition(_vec3A);
        scB.group.getWorldPosition(_vec3B);

        edge.positions[0] = _vec3A.x;
        edge.positions[1] = _vec3A.y;
        edge.positions[2] = _vec3A.z;
        edge.positions[3] = _vec3B.x;
        edge.positions[4] = _vec3B.y;
        edge.positions[5] = _vec3B.z;
        edge.line.geometry.attributes.position.needsUpdate = true;

        const isHot = s.selectedId === edge.a || s.selectedId === edge.b;
        edge.mat.opacity = isHot ? 0.92 : edge.kind === 'constraint' ? 0.14 : 0.24;
        if (isHot) {
          edge.mat.color.setHex(
            edge.kind === 'constraint'
              ? 0xe11d48
              : isDark
              ? 0xe87b54
              : 0xb4431e
          );
        } else {
          edge.mat.color.setHex(
            edge.kind === 'constraint' ? 0xbe123c : isDark ? 0x78716c : 0x57534e
          );
        }
      });

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      envTex.dispose();
      plinthGeo.dispose();
      coreGeos.forEach((g) => g.dispose());
      haloGeo.dispose();
      beaconGeo.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      substrateGeo.dispose();
      substrateMat.dispose();
      markerGeo.dispose();
      markerMat.dispose();
      ringMats.forEach((m) => m.dispose());
      sculptures.forEach((sc) => {
        sc.coreMat.dispose();
        sc.plinthMat.dispose();
      });
      edgeLines.forEach((e) => {
        e.line.geometry.dispose();
        e.mat.dispose();
      });
      renderer.dispose();
    };
  }, [ablation.suspendWebGL]);

  const activeNode = (hoveredId || selectedId)
    ? DOMAIN_NODES[(hoveredId || selectedId)!]
    : null;

  return (
    <section
      id="spatial-stage"
      aria-label="Interactive 3D Spatial Architecture Stage"
      data-testid="spatial-stage"
      data-camera-preset={ablation.flattenSpatial ? 'top' : cameraPreset}
      data-selected-node={selectedId ?? 'none'}
      className="scroll-mt-20 relative mx-auto max-w-[1280px] px-5 md:px-8"
    >
      <div className="relative h-[410px] w-full overflow-hidden rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] md:h-[470px]">
        {/* Suspended WebGL Fallback (when Graphics engineering is ablated or WebGL lost) */}
        {ablation.suspendWebGL || contextLost ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[var(--bg-elevated)] p-8 text-center">
            <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
              {ablation.suspendWebGL
                ? 'Graphics Engineering Ablated — DOM Schematic Fallback'
                : 'Spatial Context Suspended'}
            </p>
            <h3 className="font-editorial text-2xl font-medium text-[var(--ink-primary)]">
              DOM Architecture Operates Independently of WebGL
            </h3>
            <p className="max-w-xl text-sm text-[var(--ink-secondary)]">
              Because Graphics engineering is a specialist branch rather than a universal prerequisite, the 14-part domain model, inspection rail, and typographic hierarchy remain fully navigable without a 3D canvas.
            </p>
            {ablation.suspendWebGL && (
              <button
                type="button"
                onClick={onRestoreAblation}
                className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-[var(--line-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Restore Graphics Engineering
              </button>
            )}
          </div>
        ) : (
          <div ref={mountRef} className="h-full w-full" />
        )}

        {/* Minimal Top-Left Specification Readout (Non-intrusive, no backdrop-blur) */}
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-md border border-[var(--line-hairline)] bg-[var(--bg-surface)]/92 px-3.5 py-2.5">
          <p className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
            {ablation.flattenSpatial
              ? 'Spatial Ablated · 2D Projection'
              : 'Spatial Architecture · 4 Nested Tiers'}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">
            {activeNode
              ? `${activeNode.name} — ${activeNode.stratum}`
              : 'Click any sculpture to inspect'}
          </p>
        </div>

        {/* Collapsible Bottom Control Dock (Unified, no side clutter, no backdrop-blur) */}
        {!ablation.suspendWebGL && (
          <div className="absolute bottom-3 left-1/2 z-10 w-[min(900px,calc(100%-1.5rem))] -translate-x-1/2">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setDockCollapsed((v) => !v)}
                aria-expanded={!dockCollapsed}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-t-md border border-b-0 border-[var(--line-hairline)] bg-[var(--bg-surface)]/95 px-3 py-1 text-[11px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                {dockCollapsed ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    Show Stage Controls
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    Hide Controls
                  </>
                )}
              </button>
            </div>

            {!dockCollapsed && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-surface)]/96 px-3.5 py-2 shadow-sm md:gap-4 md:px-4 md:py-2.5">
                {/* Camera Framing (Spatial Design) */}
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Camera framing">
                  <span className="mr-1 hidden font-mono-tech text-[11px] uppercase tracking-wider text-[var(--ink-muted)] sm:inline">
                    Camera
                  </span>
                  {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((key) => {
                    const active =
                      (ablation.flattenSpatial ? 'top' : cameraPreset) === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={ablation.flattenSpatial}
                        onClick={() => setCameraPreset(key)}
                        className={`cursor-pointer whitespace-nowrap shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors sm:px-2.5 ${
                          active
                            ? 'bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                            : 'bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {CAMERA_PRESETS[key].label}
                      </button>
                    );
                  })}
                </div>

                {/* Exploded Strata Slider */}
                <label className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
                  <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
                    Strata Split
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    disabled={ablation.flattenSpatial}
                    value={ablation.flattenSpatial ? 0 : explodeFactor}
                    onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                    className="h-1.5 w-20 accent-[var(--accent-primary)] sm:w-24"
                  />
                  <span className="font-mono-tech w-8 text-right text-[11px]">
                    {Math.round((ablation.flattenSpatial ? 0 : explodeFactor) * 100)}%
                  </span>
                </label>

                {/* Time Uniform Speed */}
                <label className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
                  <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
                    Time Uniform
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    disabled={reducedMotion || ablation.freezeMotion}
                    value={reducedMotion || ablation.freezeMotion ? 0 : timeSpeed}
                    onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
                    className="h-1.5 w-16 accent-[var(--accent-primary)] sm:w-20"
                  />
                  <span className="font-mono-tech w-8 text-right text-[11px]">
                    {(reducedMotion || ablation.freezeMotion ? 0 : timeSpeed).toFixed(1)}x
                  </span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
