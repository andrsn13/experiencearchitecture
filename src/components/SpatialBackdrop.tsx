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
  type NodeId,
} from '../domain/model';
import { RotateCcw } from 'lucide-react';

interface SpatialBackdropProps {
  theme: 'light' | 'dark';
  selectedId: NodeId | null;
  ablation: AblationEffects;
  ablatedSet: Set<NodeId> | null;
  reducedMotion: boolean;
  frameBudgetCap: boolean;
  sensorTilt: { x: number; y: number };
  scrollProgress: number;
  zenOrbit: boolean;
  onSelectNode: (id: NodeId) => void;
  onRestoreAblation: () => void;
  onExitZen: () => void;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _splinePos = new THREE.Vector3();
const _splineTarget = new THREE.Vector3();
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

export const SpatialBackdrop: React.FC<SpatialBackdropProps> = ({
  theme,
  selectedId,
  ablation,
  ablatedSet,
  reducedMotion,
  frameBudgetCap,
  sensorTilt,
  scrollProgress,
  zenOrbit,
  onSelectNode,
  onRestoreAblation,
  onExitZen,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const stateRef = useRef({
    theme,
    selectedId,
    ablation,
    ablatedSet,
    reducedMotion,
    frameBudgetCap,
    sensorTilt,
    scrollProgress,
    zenOrbit,
  });
  stateRef.current = {
    theme,
    selectedId,
    ablation,
    ablatedSet,
    reducedMotion,
    frameBudgetCap,
    sensorTilt,
    scrollProgress,
    zenOrbit,
  };

  const onSelectRef = useRef(onSelectNode);
  onSelectRef.current = onSelectNode;

  useEffect(() => {
    const container = mountRef.current;
    if (!container || ablation.suspendWebGL) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

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
    const bgHex = stateRef.current.theme === 'dark' ? 0x0d0d0c : 0xf5f2eb;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.036);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.5;
    controls.maxDistance = 19;
    controls.enabled = stateRef.current.zenOrbit;

    // Studio Environment Map (PMREM)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    // Three-point studio lighting
    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x3b352d, 0.78);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.8);
    keyLight.position.set(6.5, 9.5, 6.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
    rimLight.position.set(-7.0, 4.5, -6.5);
    scene.add(rimLight);

    // Scroll-Driven Camera & LookAt Spline Paths (CatmullRomCurve3 — Awwwards One-Value Rule)
    const camPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.8, 2.35, 12.6), // t=0.00 Thesis & Intent (frames constellation in right aperture)
      new THREE.Vector3(0.4, 4.4, 11.4),   // t=0.25 Taxonomy Strata
      new THREE.Vector3(-4.2, 2.2, 8.8),   // t=0.50 Borders & Dimensional Rings
      new THREE.Vector3(4.8, 3.6, 9.4),    // t=0.75 Causality & Ablation
      new THREE.Vector3(0.0, 7.6, 7.4),    // t=1.00 Order & Provenance Ledger
    ]);

    const targetPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.6, -0.3, 0.0),
      new THREE.Vector3(0.0, -0.2, 0.0),
      new THREE.Vector3(-0.6, -1.2, 0.0),
      new THREE.Vector3(0.4, -0.1, 0.0),
      new THREE.Vector3(0.0, -0.4, 0.0),
    ]);

    const initT = Math.max(0, Math.min(1, stateRef.current.scrollProgress));
    camPath.getPointAt(initT, camera.position);
    targetPath.getPointAt(initT, controls.target);
    camera.lookAt(controls.target);

    // Custom GLSL Time-Uniform Substrate Plane
    const waveUniforms = {
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(0x1f2937) },
      uLineColor: { value: new THREE.Color(0x64748b) },
      uAccentColor: { value: new THREE.Color(0xe87b54) },
      uFlatten: { value: 0 },
    };

    const substrateGeo = new THREE.PlaneGeometry(26, 18, 48, 32);
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
          float wave = sin(d * 1.1 - uTime * 1.35) * 0.12 * (1.0 - uFlatten);
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
          vec2 grid = abs(fract(vUv * vec2(26.0, 18.0) - 0.5) - 0.5) / fwidth(vUv * vec2(26.0, 18.0));
          float line = 1.0 - min(min(grid.x, grid.y), 1.0);
          float radial = 1.0 - smoothstep(0.14, 0.52, length(vUv - 0.5));
          vec3 col = mix(uBaseColor, uLineColor, line * 0.42);
          col = mix(col, uAccentColor, max(0.0, vElevation * 3.5) * 0.35);
          float alpha = (line * 0.28 + 0.06) * radial;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    const substrateMesh = new THREE.Mesh(substrateGeo, substrateMat);
    substrateMesh.position.y = -3.65;
    scene.add(substrateMesh);

    // Concentric Dimensional Nesting Rings
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
        opacity: 0.48,
      });
      ringMats.push(rMat);
      const rMesh = new THREE.Mesh(ringGeo, rMat);
      rMesh.position.y = tIdx * 0.04;
      ringGroup.add(rMesh);
    });

    // Composite 4-Part Procedural Node Sculptures
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
    const hitGeo = new THREE.SphereGeometry(0.65, 10, 10);
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
        basePos: new THREE.Vector3(...node.pos3d),
        stratumIndex,
      });
    });

    // Edge Lines connecting Topology in 3D space
    const edgeGroup = new THREE.Group();
    scene.add(edgeGroup);

    interface EdgeLineEntry {
      a: NodeId;
      b: NodeId;
      kind: 'border' | 'constraint';
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
        opacity: 0.22,
      });
      const line = new THREE.Line(geo, mat);
      edgeGroup.add(line);
      edgeLines.push({ a, b, kind, line, mat, positions });
    };

    BORDER_EDGES.forEach((e) => addEdgeLine(e.a, e.b, 'border'));
    CAUSAL_EDGES.filter((e) => e.kind === 'constrains').forEach((e) =>
      addEdgeLine(e.from, e.to, 'constraint')
    );

    // Raycasting in Zen Orbit mode
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const onPointerDown = (ev: PointerEvent) => {
      downPos = { x: ev.clientX, y: ev.clientY };
    };
    const onPointerUp = (ev: PointerEvent) => {
      if (!stateRef.current.zenOrbit) return;
      if (Math.hypot(ev.clientX - downPos.x, ev.clientY - downPos.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.nodeId as NodeId | undefined;
        if (hitId) onSelectRef.current(hitId);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', onResize);

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

      elapsedTime += dt;

      const isDark = s.theme === 'dark';
      const targetBg = s.ablation.stripVisuals
        ? isDark
          ? 0x000000
          : 0xffffff
        : isDark
        ? 0x0d0d0c
        : 0xf5f2eb;
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

      controls.enabled = s.zenOrbit;

      if (!s.zenOrbit) {
        if (s.ablation.flattenSpatial) {
          _splinePos.set(0, 12.6, 0.01);
          _splineTarget.set(0, 0, 0);
        } else {
          const t = Math.max(0, Math.min(1, s.scrollProgress));
          camPath.getPointAt(t, _splinePos);
          targetPath.getPointAt(t, _splineTarget);
        }
        const dampAlpha = isFrozen ? 1 : 1 - Math.exp(-5.2 * rawDt);
        camera.position.lerp(_splinePos, dampAlpha);
        controls.target.lerp(_splineTarget, dampAlpha);
        camera.lookAt(controls.target);
      } else {
        controls.update();
      }

      // Subtle Body / Sensor Tilt applied to sculptureGroup
      const targetRotY = s.ablation.flattenSpatial ? 0 : s.sensorTilt.x * 0.25;
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

      const palette = isDark ? STRATUM_HEX_DARK : STRATUM_HEX_LIGHT;
      const zFlatten = s.ablation.flattenSpatial ? 0.02 : 1;

      sculptures.forEach((sc, id) => {
        const node = DOMAIN_NODES[id];
        const isSelected = s.selectedId === id;
        const isDegraded = s.ablatedSet?.has(id) ?? false;

        const floatY = isFrozen
          ? 0
          : Math.sin(elapsedTime * 1.1 + sc.stratumIndex * 0.9) * 0.08;
        const targetY = (s.ablation.flattenSpatial ? 0 : sc.basePos.y) + floatY;
        const targetZ = sc.basePos.z * zFlatten;

        const posAlpha = isFrozen ? 1 : 1 - Math.exp(-8 * rawDt);
        sc.group.position.x = THREE.MathUtils.lerp(sc.group.position.x, sc.basePos.x, posAlpha);
        sc.group.position.y = THREE.MathUtils.lerp(sc.group.position.y, targetY, posAlpha);
        sc.group.position.z = THREE.MathUtils.lerp(sc.group.position.z, targetZ, posAlpha);

        const targetScale = isSelected ? 1.25 : 1.0;
        const nextScale = THREE.MathUtils.lerp(sc.group.scale.x, targetScale, posAlpha);
        sc.group.scale.setScalar(nextScale);

        if (!isFrozen) {
          sc.core.rotation.y += dt * (isSelected ? 1.15 : 0.35);
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
        sc.coreMat.emissiveIntensity = isSelected ? 0.38 : 0.0;
        sc.coreMat.opacity = isDegraded ? 0.28 : 1.0;
        sc.coreMat.transparent = isDegraded;
        sc.plinthMat.color.setHex(isDark ? 0x2c2a26 : 0x57534e);
      });

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
        edge.mat.opacity = isHot ? 0.9 : edge.kind === 'constraint' ? 0.1 : 0.18;
        if (isHot) {
          edge.mat.color.setHex(
            edge.kind === 'constraint' ? 0xe11d48 : isDark ? 0xe87b54 : 0xb4431e
          );
        } else {
          edge.mat.color.setHex(
            edge.kind === 'constraint' ? 0xbe123c : isDark ? 0x78716c : 0x57534e
          );
        }
      });

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
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
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

  if (ablation.suspendWebGL || contextLost) {
    return (
      <div
        data-testid="spatial-backdrop"
        className="fixed inset-0 z-0 flex items-center justify-center bg-[var(--bg-canvas)] p-8 text-center"
      >
        {ablation.suspendWebGL && (
          <div className="pointer-events-auto max-w-md rounded-xl border border-[var(--line-strong)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
              Graphics Engineering Ablated
            </p>
            <p className="mt-2 text-sm text-[var(--ink-secondary)]">
              WebGL spatial rendering is suspended. The DOM monograph, typography, and topological schematics continue operating normally.
            </p>
            <button
              type="button"
              onClick={onRestoreAblation}
              className="cursor-pointer mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--ink-primary)] px-4 py-2 text-xs font-semibold text-[var(--bg-canvas)]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restore Graphics Engineering
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="spatial-backdrop"
      data-zen-orbit={zenOrbit ? 'true' : 'false'}
      className={`fixed inset-0 ${zenOrbit ? 'z-30 pointer-events-auto' : 'z-0 pointer-events-none'}`}
    >
      <div ref={mountRef} className="h-full w-full" />

      {zenOrbit && (
        <div className="pointer-events-auto fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-[var(--line-strong)] bg-[var(--bg-surface)] px-4 py-2.5 shadow-lg">
          <span className="font-mono-tech text-xs text-[var(--ink-secondary)]">
            Drag to orbit · Scroll to zoom · Click any sculpture to inspect
          </span>
          <button
            type="button"
            onClick={onExitZen}
            className="cursor-pointer rounded-md bg-[var(--ink-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--bg-canvas)]"
          >
            Return to Monograph
          </button>
        </div>
      )}
    </div>
  );
};
