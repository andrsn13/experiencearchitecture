export type Stratum =
  | 'Intent'
  | 'Content'
  | 'Form'
  | 'Substrate'
  | 'Constraint'
  | 'Outcome';

export type Modality =
  | 'Meaning'
  | 'Matter'
  | 'Cognition'
  | 'Sight'
  | 'Time'
  | 'Hearing'
  | 'Depth'
  | 'Code'
  | 'Body'
  | 'Any'
  | 'Perceiver';

export type SystemRole =
  | 'Root Cause'
  | 'Raw Matter'
  | 'Form Modality'
  | 'Implementation'
  | 'Cross-Cutting Quality'
  | 'Objective'
  | 'Feedback Proxy';

export type NodeId =
  | 'intent'
  | 'content'
  | 'ixd'
  | 'vis'
  | 'mot'
  | 'son'
  | 'spa'
  | 'fe'
  | 'gfx'
  | 'xr'
  | 'a11y'
  | 'perf'
  | 'exp'
  | 'eval';

export type LensId =
  | 'goal'
  | 'parts'
  | 'kinds'
  | 'borders'
  | 'causes'
  | 'order'
  | 'canon';

export type ClassificationAxis = 'Stratum' | 'Modality' | 'System Role';

export interface DomainNode {
  id: NodeId;
  name: string;
  shortName: string;
  stratum: Stratum;
  modality: Modality;
  systemRole: SystemRole;
  definition: string;
  dimensionalTier: 0 | 1 | 2 | 3 | null;
  pos2d: [number, number];
  pos3d: [number, number, number];
}

export interface BorderEdge {
  a: NodeId;
  b: NodeId;
  boundaryObject: string;
}

export interface CausalEdge {
  from: NodeId;
  to: NodeId;
  kind: 'produces' | 'constrains' | 'feedback';
}

export interface LearningEdge {
  from: NodeId;
  to: NodeId;
  strength: 'hard' | 'soft';
}

export interface CanonicalPrinciple {
  id: string;
  category: 'Principle' | 'Distinction' | 'Boundary';
  title: string;
  explanation: string;
  relatedNodes: NodeId[];
}

export interface DimensionalTier {
  tier: 0 | 1 | 2 | 3;
  label: string;
  subtitle: string;
  nodes: NodeId[];
  radius: number;
}

export interface AblationEffects {
  ablatedId: NodeId | null;
  downstreamCount: number;
  emptyTechDemo: boolean;
  stripVisuals: boolean;
  freezeMotion: boolean;
  muteSonic: boolean;
  flattenSpatial: boolean;
  suspendWebGL: boolean;
  disableInteraction: boolean;
  constraintBreach: boolean;
  summary: string;
}

export const STRATA: Stratum[] = [
  'Intent',
  'Content',
  'Form',
  'Substrate',
  'Constraint',
  'Outcome',
];

export const SYSTEM_ROLES: SystemRole[] = [
  'Root Cause',
  'Raw Matter',
  'Form Modality',
  'Implementation',
  'Cross-Cutting Quality',
  'Objective',
  'Feedback Proxy',
];

export const STRATUM_CSS_VAR: Record<Stratum, string> = {
  Intent: '--stratum-intent',
  Content: '--stratum-content',
  Form: '--stratum-form',
  Substrate: '--stratum-substrate',
  Constraint: '--stratum-constraint',
  Outcome: '--stratum-outcome',
};

export const STRATUM_HEX_LIGHT: Record<Stratum, string> = {
  Intent: '#6d28d9',
  Content: '#9a5b06',
  Form: '#0369a1',
  Substrate: '#15803d',
  Constraint: '#be123c',
  Outcome: '#475569',
};

export const STRATUM_HEX_DARK: Record<Stratum, string> = {
  Intent: '#a78bfa',
  Content: '#fbbf24',
  Form: '#38bdf8',
  Substrate: '#4ade80',
  Constraint: '#fb7185',
  Outcome: '#94a3b8',
};

export const DIMENSIONAL_TIERS: DimensionalTier[] = [
  {
    tier: 0,
    label: '2D Static',
    subtitle: 'Visual & Interaction foundations',
    nodes: ['ixd', 'vis'],
    radius: 1.85,
  },
  {
    tier: 1,
    label: '+ Time',
    subtitle: 'Motion & Sonic continuity',
    nodes: ['mot', 'son'],
    radius: 3.15,
  },
  {
    tier: 2,
    label: '+ Depth',
    subtitle: 'Spatial design & Graphics shaders',
    nodes: ['spa', 'gfx'],
    radius: 4.5,
  },
  {
    tier: 3,
    label: '+ Body',
    subtitle: 'Sensors, orientation & XR',
    nodes: ['xr'],
    radius: 5.85,
  },
];

export const DOMAIN_NODES: Record<NodeId, DomainNode> = {
  intent: {
    id: 'intent',
    name: 'Intent & narrative',
    shortName: 'Intent',
    stratum: 'Intent',
    modality: 'Meaning',
    systemRole: 'Root Cause',
    definition:
      'Why the artifact exists and what a person should feel or understand. Every form decision derives from it.',
    dimensionalTier: null,
    pos2d: [70, 150],
    pos3d: [-4.8, 1.85, 0.0],
  },
  content: {
    id: 'content',
    name: 'Content',
    shortName: 'Content',
    stratum: 'Content',
    modality: 'Matter',
    systemRole: 'Raw Matter',
    definition:
      'Copy, photography, 3D models, and recorded audio: the raw matter shaped by every form modality.',
    dimensionalTier: null,
    pos2d: [70, 330],
    pos3d: [-4.8, -1.55, 0.4],
  },
  ixd: {
    id: 'ixd',
    name: 'Interaction design',
    shortName: 'Interaction',
    stratum: 'Form',
    modality: 'Cognition',
    systemRole: 'Form Modality',
    definition:
      'How a person understands, navigates, and acts: information architecture, flows, affordances, and feedback.',
    dimensionalTier: 0,
    pos2d: [270, 50],
    pos3d: [-1.7, 2.1, -0.9],
  },
  vis: {
    id: 'vis',
    name: 'Visual design',
    shortName: 'Visual',
    stratum: 'Form',
    modality: 'Sight',
    systemRole: 'Form Modality',
    definition:
      'Static spatial rules: typographic hierarchy, grid discipline, color grammar, composition, and brand.',
    dimensionalTier: 0,
    pos2d: [270, 130],
    pos3d: [-1.7, 1.0, 0.9],
  },
  mot: {
    id: 'mot',
    name: 'Motion design',
    shortName: 'Motion',
    stratum: 'Form',
    modality: 'Time',
    systemRole: 'Form Modality',
    definition:
      'Change over time: pacing, easing, staging, and continuity. A cross-cutting dimension rather than an isolated silo.',
    dimensionalTier: 1,
    pos2d: [270, 210],
    pos3d: [-1.4, -0.1, -0.35],
  },
  son: {
    id: 'son',
    name: 'Sonic design',
    shortName: 'Sonic',
    stratum: 'Form',
    modality: 'Hearing',
    systemRole: 'Form Modality',
    definition:
      'Audio feedback, tactile micro-acoustics, and procedural or recorded soundscapes synchronized with interaction.',
    dimensionalTier: 1,
    pos2d: [270, 290],
    pos3d: [-1.5, -1.15, 1.05],
  },
  spa: {
    id: 'spa',
    name: 'Spatial design',
    shortName: 'Spatial',
    stratum: 'Form',
    modality: 'Depth',
    systemRole: 'Form Modality',
    definition:
      'Camera framing, depth layering, studio lighting, and 3D scene composition: the design discipline of spatial artifacts.',
    dimensionalTier: 2,
    pos2d: [270, 370],
    pos3d: [-1.3, -2.2, -1.1],
  },
  fe: {
    id: 'fe',
    name: 'Front-end eng.',
    shortName: 'Front-end',
    stratum: 'Substrate',
    modality: 'Code',
    systemRole: 'Implementation',
    definition:
      'DOM architecture, CSS tokens, TypeScript state, scroll choreography, Web Audio wiring, and the browser rendering pipeline.',
    dimensionalTier: null,
    pos2d: [490, 90],
    pos3d: [1.65, 1.45, 0.65],
  },
  gfx: {
    id: 'gfx',
    name: 'Graphics eng.',
    shortName: 'Graphics',
    stratum: 'Substrate',
    modality: 'Code',
    systemRole: 'Implementation',
    definition:
      'Canvas, WebGL, GLSL shaders, and 3D mathematics. A specialist branch rather than a universal prerequisite.',
    dimensionalTier: 2,
    pos2d: [490, 210],
    pos3d: [1.85, -0.2, -1.0],
  },
  xr: {
    id: 'xr',
    name: 'Sensors & XR',
    shortName: 'Sensors & XR',
    stratum: 'Substrate',
    modality: 'Body',
    systemRole: 'Implementation',
    definition:
      'Gyroscope orientation, pointer tilt, camera tracking, and WebXR spatial presence grounded in bodily input.',
    dimensionalTier: 3,
    pos2d: [490, 330],
    pos3d: [1.75, -1.75, 1.15],
  },
  a11y: {
    id: 'a11y',
    name: 'Accessibility',
    shortName: 'Accessibility',
    stratum: 'Constraint',
    modality: 'Any',
    systemRole: 'Cross-Cutting Quality',
    definition:
      'Reduced motion, keyboard navigation, contrast ratios, and semantics. A quality every part must uphold, not a standalone feature.',
    dimensionalTier: null,
    pos2d: [270, 460],
    pos3d: [-0.2, -3.15, 0.25],
  },
  perf: {
    id: 'perf',
    name: 'Performance',
    shortName: 'Performance',
    stratum: 'Constraint',
    modality: 'Any',
    systemRole: 'Cross-Cutting Quality',
    definition:
      'Frame budget, load latency, and memory ceiling. Governs how much motion, media, and shader complexity remains fluid.',
    dimensionalTier: null,
    pos2d: [490, 460],
    pos3d: [2.1, -3.15, -0.25],
  },
  exp: {
    id: 'exp',
    name: 'Experience',
    shortName: 'Experience',
    stratum: 'Outcome',
    modality: 'Perceiver',
    systemRole: 'Objective',
    definition:
      'What a person actually perceives, feels, and comprehends. The true terminal outcome produced by the whole system.',
    dimensionalTier: null,
    pos2d: [700, 150],
    pos3d: [4.8, 1.35, 0.0],
  },
  eval: {
    id: 'eval',
    name: 'Evaluation',
    shortName: 'Evaluation',
    stratum: 'Outcome',
    modality: 'Perceiver',
    systemRole: 'Feedback Proxy',
    definition:
      'Usability studies, analytics, and design juries. A proxy measurement that feeds back to refine Intent, never the goal itself.',
    dimensionalTier: null,
    pos2d: [700, 300],
    pos3d: [4.8, -1.45, 0.2],
  },
};

export const NODE_IDS = Object.keys(DOMAIN_NODES) as NodeId[];

export const BORDER_EDGES: BorderEdge[] = [
  { a: 'ixd', b: 'vis', boundaryObject: 'layout, affordance' },
  { a: 'ixd', b: 'mot', boundaryObject: 'feedback, transitions' },
  { a: 'vis', b: 'mot', boundaryObject: 'kinetic type, staging' },
  { a: 'vis', b: 'fe', boundaryObject: 'design tokens, CSS' },
  { a: 'ixd', b: 'fe', boundaryObject: 'state, routing' },
  { a: 'mot', b: 'fe', boundaryObject: 'easing, timelines' },
  { a: 'mot', b: 'gfx', boundaryObject: 'time uniforms' },
  { a: 'spa', b: 'gfx', boundaryObject: 'camera, scene graph' },
  { a: 'spa', b: 'xr', boundaryObject: 'pose, depth' },
  { a: 'vis', b: 'spa', boundaryObject: 'composition, lighting' },
  { a: 'son', b: 'mot', boundaryObject: 'scroll and beat sync' },
  { a: 'son', b: 'fe', boundaryObject: 'Web Audio API' },
  { a: 'content', b: 'vis', boundaryObject: 'type, imagery' },
  { a: 'content', b: 'son', boundaryObject: 'recorded audio' },
  { a: 'content', b: 'spa', boundaryObject: '3D assets' },
  { a: 'intent', b: 'ixd', boundaryObject: 'goals, flows' },
  { a: 'intent', b: 'vis', boundaryObject: 'brand, tone' },
];

export const CAUSAL_EDGES: CausalEdge[] = [
  { from: 'intent', to: 'ixd', kind: 'produces' },
  { from: 'intent', to: 'vis', kind: 'produces' },
  { from: 'intent', to: 'mot', kind: 'produces' },
  { from: 'intent', to: 'son', kind: 'produces' },
  { from: 'intent', to: 'spa', kind: 'produces' },
  { from: 'content', to: 'vis', kind: 'produces' },
  { from: 'content', to: 'son', kind: 'produces' },
  { from: 'content', to: 'spa', kind: 'produces' },
  { from: 'ixd', to: 'fe', kind: 'produces' },
  { from: 'vis', to: 'fe', kind: 'produces' },
  { from: 'mot', to: 'fe', kind: 'produces' },
  { from: 'mot', to: 'gfx', kind: 'produces' },
  { from: 'spa', to: 'gfx', kind: 'produces' },
  { from: 'spa', to: 'xr', kind: 'produces' },
  { from: 'son', to: 'fe', kind: 'produces' },
  { from: 'fe', to: 'exp', kind: 'produces' },
  { from: 'gfx', to: 'exp', kind: 'produces' },
  { from: 'xr', to: 'exp', kind: 'produces' },
  { from: 'exp', to: 'eval', kind: 'produces' },
  { from: 'eval', to: 'intent', kind: 'feedback' },
  { from: 'a11y', to: 'ixd', kind: 'constrains' },
  { from: 'a11y', to: 'vis', kind: 'constrains' },
  { from: 'a11y', to: 'mot', kind: 'constrains' },
  { from: 'perf', to: 'fe', kind: 'constrains' },
  { from: 'perf', to: 'gfx', kind: 'constrains' },
];

export const LEARNING_EDGES: LearningEdge[] = [
  { from: 'fe', to: 'mot', strength: 'hard' },
  { from: 'ixd', to: 'mot', strength: 'hard' },
  { from: 'vis', to: 'mot', strength: 'soft' },
  { from: 'fe', to: 'gfx', strength: 'hard' },
  { from: 'mot', to: 'gfx', strength: 'soft' },
  { from: 'gfx', to: 'spa', strength: 'hard' },
  { from: 'vis', to: 'spa', strength: 'soft' },
  { from: 'gfx', to: 'xr', strength: 'hard' },
  { from: 'spa', to: 'xr', strength: 'hard' },
  { from: 'fe', to: 'son', strength: 'hard' },
  { from: 'mot', to: 'son', strength: 'soft' },
  { from: 'fe', to: 'a11y', strength: 'hard' },
  { from: 'ixd', to: 'a11y', strength: 'hard' },
  { from: 'fe', to: 'perf', strength: 'hard' },
  { from: 'gfx', to: 'perf', strength: 'soft' },
];

export const CANONICAL_PRINCIPLES: CanonicalPrinciple[] = [
  {
    id: 'ux-ui-unity',
    category: 'Principle',
    title: 'Usability and experience are complementary halves, not opposites',
    explanation:
      'Interaction design governs cognition, flows, and affordances (UX); Visual design governs grid, type, color, and composition (UI). Framing utility against experience creates a false dichotomy—high-craft artifacts achieve clarity and emotional resonance simultaneously.',
    relatedNodes: ['ixd', 'vis'],
  },
  {
    id: 'overlapping-boundaries',
    category: 'Boundary',
    title: 'Disciplines overlap through concrete boundary objects',
    explanation:
      'Parts of the domain are not sealed silos. They interlock along shared artifacts: design tokens bridge Visual and Front-end; easing curves and timelines bridge Motion and Front-end; time uniforms bridge Motion and Graphics; scene graphs bridge Spatial and Graphics.',
    relatedNodes: ['ixd', 'vis', 'mot', 'fe', 'gfx'],
  },
  {
    id: 'execution-completeness',
    category: 'Principle',
    title: 'Execution requires matter, depth, and constraints alongside core craft',
    explanation:
      'Visual, Interaction, Motion, and Engineering alone cannot ship a complete artifact. Content provides the raw matter, Spatial design provides 3D framing and lighting, and Accessibility and Performance constrain every decision.',
    relatedNodes: ['a11y', 'perf', 'content', 'spa'],
  },
  {
    id: 'intent-root-cause',
    category: 'Principle',
    title: 'Without Intent & narrative, technical polish collapses into an empty demo',
    explanation:
      'Ablating Intent leaves every engineering and visual layer compiling cleanly, yet nothing determines why any transition, shader, or sound exists. Narrative intent is the root cause from which every form decision is derived.',
    relatedNodes: ['intent', 'exp'],
  },
  {
    id: 'peripheral-and-universal',
    category: 'Distinction',
    title: 'Universal constraints outrank peripheral hardware modalities',
    explanation:
      'Sonic design enriches feedback and atmosphere, while Sensors and WebXR remain specialized peripheral channels. Accessibility, Performance, Spatial design, and Evaluation govern nearly every production artifact.',
    relatedNodes: ['son', 'xr', 'a11y', 'perf', 'eval'],
  },
  {
    id: 'partial-order-mastery',
    category: 'Principle',
    title: 'Mastery follows a partial order, not a single linear chain',
    explanation:
      'Visual design, Interaction design, and Front-end engineering can begin concurrently in Wave 0. Motion builds upon Front-end and Interaction; Graphics branches from Front-end without blocking DOM-first interactive work.',
    relatedNodes: ['vis', 'ixd', 'fe', 'mot', 'gfx'],
  },
  {
    id: 'graphics-is-a-branch',
    category: 'Distinction',
    title: 'Graphics engineering is a specialist branch, not the universal summit',
    explanation:
      'Much landmark interactive work relies on typography, DOM choreography, scroll staging, and selective WebGL rather than full 3D worlds. The progression 2D Static ⊂ Time ⊂ Depth ⊂ Body describes nested capability, not a mandatory curriculum.',
    relatedNodes: ['gfx', 'spa', 'xr'],
  },
  {
    id: 'practice-vs-artifact',
    category: 'Distinction',
    title: 'Separate the artifact from the roles that build it',
    explanation:
      'A Design Engineer bridges design systems and front-end architecture; a Creative Developer leans toward motion and graphics; an Interactive Experience is the produced artifact itself. Modeling the artifact reveals causal dependencies roles alone obscure.',
    relatedNodes: ['fe', 'gfx', 'exp'],
  },
  {
    id: 'experience-over-proxy',
    category: 'Principle',
    title: 'Optimize Experience for Intent; treat Evaluation as feedback',
    explanation:
      'Juries, engagement scores, and analytics belong to Evaluation—a proxy measurement. Optimizing the proxy directly produces superficial novelty; using Evaluation to refine Intent closes the learning loop.',
    relatedNodes: ['eval', 'exp', 'intent'],
  },
];

export const LENSES: { id: LensId; label: string; index: string; summary: string }[] = [
  {
    id: 'goal',
    label: 'Overview',
    index: '01',
    summary: 'Terminal objective and six analytical lenses',
  },
  {
    id: 'parts',
    label: 'Parts',
    index: '02',
    summary: 'Fourteen parts across six structural strata',
  },
  {
    id: 'kinds',
    label: 'Kinds',
    index: '03',
    summary: 'Orthogonal grouping by stratum, modality, and role',
  },
  {
    id: 'borders',
    label: 'Borders',
    index: '04',
    summary: 'Seventeen shared boundary objects and dimensional nesting',
  },
  {
    id: 'causes',
    label: 'Causes',
    index: '05',
    summary: 'Causal flow, constraint bounds, and live self-ablation',
  },
  {
    id: 'order',
    label: 'Order',
    index: '06',
    summary: 'Four-wave partial order of prerequisite mastery',
  },
  {
    id: 'canon',
    label: 'Principles',
    index: '07',
    summary: 'Canonical axioms, role distinctions, and boundaries',
  },
];

/**
 * Computes all nodes degraded or broken when `startId` is ablated.
 * Traverses directed causal and constraint edges (excluding feedback edges).
 */
export function computeDownstreamAblation(startId: NodeId): Set<NodeId> {
  const affected = new Set<NodeId>([startId]);
  const queue: NodeId[] = [startId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const edge of CAUSAL_EDGES) {
      if (edge.from === current && edge.kind !== 'feedback' && !affected.has(edge.to)) {
        affected.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return affected;
}

/**
 * Computes longest-path prerequisite wave for every node appearing in the learning DAG.
 */
export function computeLearningWaves(): Partial<Record<NodeId, number>> {
  const hardEdges = LEARNING_EDGES.filter((e) => e.strength === 'hard');
  const waves: Partial<Record<NodeId, number>> = {};

  const calc = (id: NodeId): number => {
    const existing = waves[id];
    if (existing !== undefined) return existing;
    const prereqs = hardEdges.filter((e) => e.to === id).map((e) => calc(e.from));
    const wave = prereqs.length === 0 ? 0 : Math.max(...prereqs) + 1;
    waves[id] = wave;
    return wave;
  };

  for (const edge of LEARNING_EDGES) {
    calc(edge.from);
    calc(edge.to);
  }
  return waves;
}

export const LEARNING_WAVES = computeLearningWaves();

export function getBoundaryObjectsFor(id: NodeId): { other: DomainNode; boundaryObject: string }[] {
  return BORDER_EDGES.filter((e) => e.a === id || e.b === id).map((e) => ({
    other: DOMAIN_NODES[e.a === id ? e.b : e.a],
    boundaryObject: e.boundaryObject,
  }));
}

export function getCausalLinksFor(id: NodeId): {
  upstream: { node: DomainNode; kind: CausalEdge['kind'] }[];
  downstream: { node: DomainNode; kind: CausalEdge['kind'] }[];
} {
  const upstream = CAUSAL_EDGES.filter((e) => e.to === id && e.kind !== 'feedback').map((e) => ({
    node: DOMAIN_NODES[e.from],
    kind: e.kind,
  }));
  const downstream = CAUSAL_EDGES.filter((e) => e.from === id).map((e) => ({
    node: DOMAIN_NODES[e.to],
    kind: e.kind,
  }));
  return { upstream, downstream };
}

export function getPrerequisitesFor(id: NodeId): {
  wave: number | null;
  prerequisites: { node: DomainNode; strength: LearningEdge['strength'] }[];
} {
  const wave = LEARNING_WAVES[id] ?? null;
  const prerequisites = LEARNING_EDGES.filter((e) => e.to === id).map((e) => ({
    node: DOMAIN_NODES[e.from],
    strength: e.strength,
  }));
  return { wave, prerequisites };
}

export function groupNodesByAxis(
  axis: ClassificationAxis
): { group: string; nodes: DomainNode[] }[] {
  const map = new Map<string, DomainNode[]>();
  const order =
    axis === 'Stratum' ? STRATA : axis === 'System Role' ? SYSTEM_ROLES : null;

  if (order) {
    for (const key of order) map.set(key, []);
  }

  for (const id of NODE_IDS) {
    const node = DOMAIN_NODES[id];
    const key =
      axis === 'Stratum'
        ? node.stratum
        : axis === 'Modality'
        ? node.modality
        : node.systemRole;
    const list = map.get(key) ?? [];
    list.push(node);
    map.set(key, list);
  }

  return Array.from(map.entries()).map(([group, nodes]) => ({ group, nodes }));
}

/**
 * Translates an ablated node into live architectural degradation flags
 * so the website itself behaves as a self-demonstrating specimen of the model.
 */
export function getAblationEffects(ablatedId: NodeId | null): AblationEffects {
  if (!ablatedId) {
    return {
      ablatedId: null,
      downstreamCount: 0,
      emptyTechDemo: false,
      stripVisuals: false,
      freezeMotion: false,
      muteSonic: false,
      flattenSpatial: false,
      suspendWebGL: false,
      disableInteraction: false,
      constraintBreach: false,
      summary: 'All 14 parts active. Every form, substrate, and constraint is engaged.',
    };
  }

  const affected = computeDownstreamAblation(ablatedId);
  const downstreamCount = Math.max(0, affected.size - 1);

  const emptyTechDemo = ablatedId === 'intent';
  const stripVisuals = ablatedId === 'vis';
  const freezeMotion = ablatedId === 'mot';
  const muteSonic = ablatedId === 'son';
  const flattenSpatial = ablatedId === 'spa';
  const suspendWebGL = ablatedId === 'gfx';
  const disableInteraction = ablatedId === 'ixd';
  const constraintBreach = ablatedId === 'a11y' || ablatedId === 'perf';

  let summary = `Removing ${DOMAIN_NODES[ablatedId].name} degrades ${downstreamCount} downstream part${downstreamCount === 1 ? '' : 's'}.`;

  if (ablatedId === 'intent') {
    summary =
      'Intent ablated: every form and engineering layer still executes, yet narrative direction vanishes—producing an empty tech demo.';
  } else if (ablatedId === 'vis') {
    summary =
      'Visual design ablated: typographic hierarchy, tokens, and color grammar collapse into raw structural wireframe.';
  } else if (ablatedId === 'mot') {
    summary =
      'Motion design ablated: temporal continuity, easing, and kinetic staging freeze into abrupt state cuts.';
  } else if (ablatedId === 'son') {
    summary =
      'Sonic design ablated: procedural audio feedback and scroll-beat synchronization fall silent.';
  } else if (ablatedId === 'spa') {
    summary =
      'Spatial design ablated: 3D camera framing, lighting hierarchy, and depth separation collapse onto a flat 2D plane.';
  } else if (ablatedId === 'gfx') {
    summary =
      'Graphics engineering ablated: WebGL shaders suspend, yet the DOM-based interactive architecture continues functioning.';
  } else if (ablatedId === 'a11y') {
    summary =
      'Accessibility ablated: semantic boundaries, keyboard focus affordances, and motion safety guarantees are compromised across Form.';
  } else if (ablatedId === 'perf') {
    summary =
      'Performance ablated: frame-budget governance drops, leaving substrate rendering unbounded.';
  }

  return {
    ablatedId,
    downstreamCount,
    emptyTechDemo,
    stripVisuals,
    freezeMotion,
    muteSonic,
    flattenSpatial,
    suspendWebGL,
    disableInteraction,
    constraintBreach,
    summary,
  };
}
