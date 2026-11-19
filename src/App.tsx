import { useEffect, useMemo, useState } from 'react';
import {
  BORDER_EDGES,
  CANONICAL_PRINCIPLES,
  DIMENSIONAL_TIERS,
  DOMAIN_NODES,
  LEARNING_WAVES,
  NODE_IDS,
  STRATUM_CSS_VAR,
  computeDownstreamAblation,
  getAblationEffects,
  groupNodesByAxis,
  type ClassificationAxis,
  type NodeId,
} from './domain/model';
import { DESIGN_PROVENANCE } from './domain/provenance';
import { sonicEngine } from './audio/sonicEngine';
import { Header } from './components/Header';
import { SpatialBackdrop } from './components/SpatialBackdrop';
import { SpecimenDrawer } from './components/SpecimenDrawer';
import { TopologySvg } from './components/TopologySvg';
import { ModalityLab } from './components/ModalityLab';
import {
  ArrowUpRight,
  Compass,
  Moon,
  PanelRightOpen,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
  ZapOff,
} from 'lucide-react';

const ABLATION_CONTROLS: { id: NodeId; label: string; consequence: string }[] = [
  { id: 'intent', label: 'Intent', consequence: 'Empty tech demo' },
  { id: 'vis', label: 'Visual', consequence: 'Wireframe collapse' },
  { id: 'mot', label: 'Motion', consequence: 'Transitions freeze' },
  { id: 'son', label: 'Sonic', consequence: 'Acoustics mute' },
  { id: 'spa', label: 'Spatial', consequence: '3D flattens to 2D' },
  { id: 'gfx', label: 'Graphics', consequence: 'WebGL suspends' },
  { id: 'a11y', label: 'Accessibility', consequence: 'Bounds compromised' },
  { id: 'perf', label: 'Performance', consequence: 'Budget uncapped' },
];

const CLASSIFICATION_AXES: ClassificationAxis[] = [
  'Stratum',
  'Modality',
  'System Role',
];

const WAVE_DESCRIPTIONS: { wave: number; title: string; role: string }[] = [
  {
    wave: 0,
    title: 'Wave 0 · Root Foundations',
    role: 'Visual design, Interaction design, and Front-end engineering can begin concurrently.',
  },
  {
    wave: 1,
    title: 'Wave 1 · Temporal & Constraints',
    role: 'Motion, Accessibility, and Performance build directly on Front-end and Interaction.',
  },
  {
    wave: 2,
    title: 'Wave 2 · Graphics & Acoustic',
    role: 'Graphics engineering and Sonic design branch cleanly without blocking DOM-first craft.',
  },
  {
    wave: 3,
    title: 'Wave 3 · Spatial & Bodily',
    role: 'Spatial composition and Sensor/XR presence synthesize Graphics with 3D framing.',
  },
];

const SPREAD_LABELS = [
  { threshold: 0, label: '01 Thesis' },
  { threshold: 0.18, label: '02 Taxonomy' },
  { threshold: 0.38, label: '03 Borders' },
  { threshold: 0.56, label: '04 Causality' },
  { threshold: 0.74, label: '05 Order & Instruments' },
  { threshold: 0.88, label: '06 Provenance' },
];

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  const [selectedId, setSelectedId] = useState<NodeId | null>('intent');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [axis, setAxis] = useState<ClassificationAxis>('Stratum');
  const [activeTier, setActiveTier] = useState<0 | 1 | 2 | 3 | null>(null);
  const [ablatedId, setAblatedId] = useState<NodeId | null>(null);
  const [principleFilter, setPrincipleFilter] = useState<
    'All' | 'Principle' | 'Distinction' | 'Boundary'
  >('All');

  // Scroll Progress & Zen Orbit State (One-Value Spine)
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [zenOrbit, setZenOrbit] = useState<boolean>(false);

  // Live Studio Modalities & Constraint Governors
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [scrollSyncEnabled, setScrollSyncEnabled] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [a11yAudit, setA11yAudit] = useState<boolean>(false);
  const [frameBudgetCap, setFrameBudgetCap] = useState<boolean>(false);
  const [sensorTilt, setSensorTilt] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const ablation = useMemo(() => getAblationEffects(ablatedId), [ablatedId]);
  const ablatedSet = useMemo(
    () => (ablatedId ? computeDownstreamAblation(ablatedId) : null),
    [ablatedId]
  );

  const groupedTaxonomy = useMemo(() => groupNodesByAxis(axis), [axis]);

  const filteredPrinciples = useMemo(
    () =>
      principleFilter === 'All'
        ? CANONICAL_PRINCIPLES
        : CANONICAL_PRINCIPLES.filter((p) => p.category === principleFilter),
    [principleFilter]
  );

  const activeSpreadLabel = useMemo(() => {
    let current = SPREAD_LABELS[0].label;
    for (const s of SPREAD_LABELS) {
      if (scrollProgress >= s.threshold) current = s.label;
    }
    return current;
  }, [scrollProgress]);

  // Sync theme class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('ea-theme', theme);
    } catch {
      // ignore storage failure
    }
  }, [theme]);

  // Sync ablation mute to procedural sonic engine
  useEffect(() => {
    sonicEngine.setMutedByAblation(ablation.muteSonic);
  }, [ablation.muteSonic]);

  // Continuous normalized scroll progress + optional beat sync
  useEffect(() => {
    let raf = 0;
    const updateScroll = () => {
      raf = 0;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const p = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      setScrollProgress(p);
      if (scrollSyncEnabled && soundEnabled && !ablation.muteSonic) {
        sonicEngine.playScrollSync(p);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(updateScroll);
    };
    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [scrollSyncEnabled, soundEnabled, ablation.muteSonic]);

  // Escape exits Zen Orbit cleanly
  useEffect(() => {
    if (!zenOrbit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZenOrbit(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zenOrbit]);

  const jumpSpread = (id: string) => {
    setZenOrbit(false);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({
          behavior: reducedMotion || ablation.freezeMotion ? 'auto' : 'smooth',
        });
      }
    });
  };

  const handleSelectNode = (id: NodeId, openDrawer = false) => {
    setSelectedId(id);
    setActiveTier(null);
    sonicEngine.playNodeSelect(id);
    if (openDrawer) setDrawerOpen(true);
  };

  const handleSelectTier = (tier: 0 | 1 | 2 | 3) => {
    const next = activeTier === tier ? null : tier;
    setActiveTier(next);
    if (next !== null) {
      const firstNode = DIMENSIONAL_TIERS[next].nodes[0];
      setSelectedId(firstNode);
      sonicEngine.playNodeSelect(firstNode);
    }
  };

  const handleToggleAblate = (id: NodeId) => {
    if (ablatedId === id) {
      setAblatedId(null);
      sonicEngine.playRestore();
    } else {
      setAblatedId(id);
      const next = getAblationEffects(id);
      sonicEngine.playAblate(next.downstreamCount);
    }
  };

  const handleRestoreAblation = () => {
    setAblatedId(null);
    sonicEngine.playRestore();
  };

  const handleToggleSound = async () => {
    const next = await sonicEngine.toggle();
    setSoundEnabled(next);
  };

  const rootClasses = [
    'relative min-h-screen bg-[var(--bg-canvas)] text-[var(--ink-primary)] transition-colors duration-200',
    reducedMotion || ablation.freezeMotion ? 'motion-frozen' : '',
    a11yAudit ? 'a11y-audit' : '',
    ablation.stripVisuals ? 'ablate-visual' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const selectedNode = selectedId ? DOMAIN_NODES[selectedId] : null;
  const activeTierNodes =
    activeTier !== null ? new Set(DIMENSIONAL_TIERS[activeTier].nodes) : null;

  return (
    <div id="top" className={rootClasses}>
      {/* Persistent Full-Viewport Scroll-Choreographed 3D Spatial Spine */}
      <SpatialBackdrop
        theme={theme}
        selectedId={selectedId}
        ablation={ablation}
        ablatedSet={ablatedSet}
        reducedMotion={reducedMotion}
        frameBudgetCap={frameBudgetCap}
        sensorTilt={sensorTilt}
        scrollProgress={scrollProgress}
        zenOrbit={zenOrbit}
        onSelectNode={(id) => {
          setSelectedId(id);
          sonicEngine.playNodeSelect(id);
          setDrawerOpen(true);
        }}
        onRestoreAblation={handleRestoreAblation}
        onExitZen={() => setZenOrbit(false)}
      />

      {/* Structural 12-Column Swiss Hairline Grid Overlay (Josef Müller-Brockmann) */}
      <div
        aria-hidden="true"
        className="swiss-grid-overlay pointer-events-none fixed inset-y-0 left-1/2 z-[1] w-full max-w-[1440px] -translate-x-1/2"
      />

      <Header
        emptyTechDemo={ablation.emptyTechDemo}
        selectedName={selectedNode ? selectedNode.shortName : null}
        onJumpSpread={jumpSpread}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      {/* Live Self-Referential Ablation Banner */}
      {ablatedId && (
        <div
          role="region"
          aria-label="Active Causal Ablation Status"
          className="relative z-20 border-b border-[var(--stratum-constraint)]/45 bg-[var(--bg-elevated)]"
        >
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-2.5 md:px-10">
            <p className="text-xs font-medium text-[var(--ink-primary)]">
              <strong className="font-mono-tech uppercase tracking-wider text-[var(--stratum-constraint)]">
                Ablation Active:
              </strong>{' '}
              {ablation.summary}
            </p>
            <button
              type="button"
              onClick={handleRestoreAblation}
              className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--line-strong)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Restore {DOMAIN_NODES[ablatedId].shortName}
            </button>
          </div>
        </div>
      )}

      {/* Main Architectural Monograph Flow */}
      <main
        className={`relative z-10 transition-opacity duration-200 ${
          zenOrbit ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {/* ================================================================
            SPREAD 01 · THESIS & INTENT (Law of Prägnanz · Von Restorff Effect)
            ================================================================ */}
        <section
          id="spread-thesis"
          aria-label="Thesis and Intent"
          className="scroll-mt-16 mx-auto flex min-h-[calc(100vh-58px)] max-w-[1440px] items-center px-5 py-10 md:px-10 md:py-14"
        >
          <div className="grid w-full gap-8 lg:grid-cols-12 lg:items-end">
            {/* Left 7 Columns: Monumental Typography & Thesis Plate */}
            <div className="lg:col-span-7 border border-[var(--line-hairline)] bg-[var(--bg-canvas)] p-6 md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[var(--line-hairline)] pb-4">
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  {ablation.emptyTechDemo
                    ? 'Artifact Specimen · Unanchored Mode'
                    : '01 · Canonical Domain Reference'}
                </p>
                <span className="font-mono-tech text-xs text-[var(--ink-muted)]">
                  14 Parts · 6 Strata · 4 Dimensions
                </span>
              </div>

              <h1
                className="font-editorial mt-6 font-medium leading-[0.98] tracking-tight text-[var(--ink-primary)] text-balance"
                style={{ fontSize: 'clamp(2.75rem, 5.6vw, 5.15rem)' }}
              >
                {ablation.emptyTechDemo
                  ? 'Interactive Canvas & Graph Nodes'
                  : 'Interactive Experience Engineering'}
              </h1>

              <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--ink-secondary)] md:text-lg">
                {ablation.emptyTechDemo
                  ? 'Intent and narrative have been ablated. Controls, GLSL shaders, Web Audio synthesis, and layout grids remain executable without overarching human purpose.'
                  : 'A canonical specification of how interactive digital artifacts are conceived, structured, engineered, constrained, and experienced—applying every discipline it models across this living instrument.'}
              </p>

              {/* Direct Studio Action Strip */}
              <div className="mt-8 flex flex-wrap items-center gap-2.5 border-t border-[var(--line-hairline)] pt-6">
                <button
                  type="button"
                  onClick={() => setZenOrbit(true)}
                  className="cursor-pointer inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-[var(--ink-primary)] px-4 py-2.5 text-xs font-semibold tracking-wide text-[var(--bg-canvas)] transition-opacity hover:opacity-90"
                >
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  Enter 3D Orbit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
                  }
                  aria-label={`Switch to ${
                    theme === 'light' ? 'dark' : 'light'
                  } studio theme`}
                  className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--line-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs font-medium text-[var(--ink-primary)] hover:border-[var(--line-strong)]"
                >
                  {theme === 'light' ? (
                    <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {theme === 'light' ? 'Dark Studio' : 'Light Studio'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleSound}
                  disabled={ablation.muteSonic}
                  aria-pressed={soundEnabled && !ablation.muteSonic}
                  className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--line-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs font-medium text-[var(--ink-primary)] hover:border-[var(--line-strong)] disabled:opacity-50"
                >
                  {soundEnabled && !ablation.muteSonic ? (
                    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {soundEnabled && !ablation.muteSonic
                    ? 'Sonic On'
                    : 'Enable Sonic'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleAblate('intent')}
                  className={`cursor-pointer whitespace-nowrap rounded-md border px-3.5 py-2.5 text-xs font-medium transition-colors ${
                    ablation.emptyTechDemo
                      ? 'border-[var(--stratum-constraint)] bg-[var(--stratum-constraint)] text-white'
                      : 'border-[var(--line-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {ablation.emptyTechDemo
                    ? 'Restore Intent'
                    : 'Test Intent Ablation'}
                </button>
              </div>

              <p className="font-mono-tech mt-5 text-[11px] text-[var(--ink-muted)]">
                Design Basis: Law of Prägnanz · Von Restorff Effect · Perfect Fifth Scale (Bringhurst)
              </p>
            </div>

            {/* Right 5 Columns: Open Aperture Revealing the Live 3D Constellation */}
            <div className="lg:col-span-5 flex min-h-[240px] flex-col justify-end lg:min-h-[480px]">
              <div className="border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                    Active Specimen
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="cursor-pointer inline-flex items-center gap-1.5 font-mono-tech text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    Inspect <PanelRightOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p className="font-editorial mt-1.5 text-xl font-medium text-[var(--ink-primary)]">
                  {selectedNode ? selectedNode.name : 'Intent & narrative'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-secondary)]">
                  {selectedNode
                    ? selectedNode.definition
                    : DOMAIN_NODES.intent.definition}
                </p>
                <p className="font-mono-tech mt-3 border-t border-[var(--line-hairline)] pt-2.5 text-[11px] text-[var(--ink-muted)]">
                  Scroll drives the spatial camera along a continuous CatmullRomCurve3 spline.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SPREAD 02 · TAXONOMY (Miller's Law 7±2 · Law of Common Region)
            ================================================================ */}
        <section
          id="spread-taxonomy"
          aria-label="14 Parts and 3-Axis Taxonomy"
          className="scroll-mt-16 border-t border-[var(--line-hairline)] bg-[var(--bg-canvas)] pb-16 pt-20"
        >
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <div className="grid gap-6 border-b border-[var(--line-hairline)] pb-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  02 · Complete Decomposition
                </p>
                <h2 className="font-editorial mt-2 text-3xl font-medium tracking-tight text-[var(--ink-primary)] md:text-4xl text-balance">
                  Fourteen Parts Across Three Orthogonal Axes
                </h2>
                <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-secondary)]">
                  Interactive experience engineering decomposes cleanly into 14 distinct parts. Re-index the same 14 artifacts by Structural Stratum, Sensory Modality, or System Role—click any part to highlight it in 3D and open its Specimen Drawer.
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col items-start gap-2 lg:items-end">
                <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                  Classification Axis
                </span>
                <div
                  role="group"
                  aria-label="Classification axis selector"
                  className="inline-flex border border-[var(--line-strong)] bg-[var(--bg-surface)]"
                >
                  {CLASSIFICATION_AXES.map((ax) => (
                    <button
                      key={ax}
                      type="button"
                      aria-pressed={axis === ax}
                      onClick={() => setAxis(ax)}
                      className={`cursor-pointer px-3.5 py-2 text-xs font-semibold transition-colors ${
                        axis === ax
                          ? 'bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                          : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                      }`}
                    >
                      {ax}
                    </button>
                  ))}
                </div>
                <p className="font-mono-tech text-[11px] text-[var(--ink-muted)]">
                  Basis: Miller’s Law (7±2 chunks) · Law of Common Region · Jakob’s Law
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {groupedTaxonomy.map((group) => (
                <div
                  key={group.group}
                  className="border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-5"
                >
                  <div className="flex items-baseline justify-between border-b border-[var(--line-hairline)] pb-2.5">
                    <h3 className="font-editorial text-lg font-medium text-[var(--ink-primary)]">
                      {group.group}
                    </h3>
                    <span className="font-mono-tech text-xs text-[var(--ink-muted)]">
                      {group.nodes.length}{' '}
                      {group.nodes.length === 1 ? 'part' : 'parts'}
                    </span>
                  </div>

                  <ul className="mt-3 divide-y divide-[var(--line-hairline)]">
                    {group.nodes.map((node) => {
                      const isSelected = selectedId === node.id;
                      const isDegraded = ablatedSet?.has(node.id) ?? false;
                      return (
                        <li key={node.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectNode(node.id, true)}
                            className={`cursor-pointer flex w-full items-start justify-between gap-3 py-2.5 text-left transition-colors ${
                              isSelected
                                ? 'text-[var(--ink-primary)]'
                                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                aria-hidden="true"
                                className="mt-1.5 h-2.5 w-2.5 shrink-0"
                                style={{
                                  backgroundColor: isDegraded
                                    ? 'var(--stratum-constraint)'
                                    : `var(${STRATUM_CSS_VAR[node.stratum]})`,
                                }}
                              />
                              <div>
                                <p
                                  className={`text-sm font-semibold ${
                                    isDegraded ? 'line-through text-[var(--ink-muted)]' : ''
                                  }`}
                                >
                                  {node.name}
                                </p>
                                <p className="font-mono-tech mt-0.5 text-[11px] text-[var(--ink-muted)]">
                                  {node.stratum} · {node.modality}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono-tech mt-1 text-[11px] text-[var(--accent-primary)]">
                              {isSelected ? 'Active' : 'Inspect'}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
            SPREAD 03 · BORDERS & DIMENSIONAL NESTING (7/5 Swiss Exhibition)
            ================================================================ */}
        <section
          id="spread-borders"
          aria-label="Boundary Objects and Dimensional Nesting"
          className="scroll-mt-16 border-t border-[var(--line-hairline)] pb-16 pt-20"
        >
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <div className="mb-8 grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7 border border-[var(--line-hairline)] bg-[var(--bg-canvas)] p-6">
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  03 · Boundary Objects &amp; Dimensional Nesting
                </p>
                <h2 className="font-editorial mt-2 text-3xl font-medium tracking-tight text-[var(--ink-primary)] md:text-4xl text-balance">
                  Seventeen Shared Seams &amp; Four Nested Dimensions
                </h2>
                <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-secondary)]">
                  Parts interlock along concrete boundary objects—design tokens, easing timelines, time uniforms, and scene graphs. Select a node in the diagram or click a dimensional ring tier to isolate its seams.
                </p>
                <p className="font-mono-tech mt-3 text-[11px] text-[var(--ink-muted)]">
                  Basis: Edward Tufte Data-Ink Isolation · Law of Proximity · Müller-Brockmann 7/5 Grid
                </p>
              </div>
              <div className="lg:col-span-5" />
            </div>

            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              {/* Left 7 Columns: Interactive Borders Topology */}
              <div className="lg:col-span-7 space-y-3">
                <TopologySvg
                  mode="borders"
                  selectedId={selectedId}
                  ablatedSet={ablatedSet}
                  onSelect={(id) => handleSelectNode(id, false)}
                  onHover={() => sonicEngine.playHoverDetent()}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--line-hairline)] bg-[var(--bg-surface)] px-4 py-3 text-xs">
                  <span className="text-[var(--ink-secondary)]">
                    Focused node:{' '}
                    <strong className="font-semibold text-[var(--ink-primary)]">
                      {selectedNode ? selectedNode.name : 'None'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="cursor-pointer font-mono-tech font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    Open {selectedNode ? selectedNode.shortName : 'Specimen'} in Drawer →
                  </button>
                </div>
              </div>

              {/* Right 5 Columns: 4 Nested Dimensions + 17 Boundary Objects Ledger */}
              <div className="lg:col-span-5 space-y-6">
                <div className="border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-5">
                  <h3 className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                    Dimensional Progression (2D ⊂ Time ⊂ Depth ⊂ Body)
                  </h3>
                  <div className="mt-3.5 space-y-2">
                    {DIMENSIONAL_TIERS.map((tier) => {
                      const isActive = activeTier === tier.tier;
                      return (
                        <button
                          key={tier.tier}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => handleSelectTier(tier.tier)}
                          className={`cursor-pointer flex w-full items-center justify-between border px-3.5 py-2.5 text-left transition-colors ${
                            isActive
                              ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                              : 'border-[var(--line-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--line-strong)]'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold text-[var(--ink-primary)]">
                              Tier {tier.tier} · {tier.label}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                              {tier.subtitle}
                            </p>
                          </div>
                          <span className="font-mono-tech text-[11px] text-[var(--ink-secondary)]">
                            {tier.nodes
                              .map((nid) => DOMAIN_NODES[nid].shortName)
                              .join(' + ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-5">
                  <div className="flex items-baseline justify-between border-b border-[var(--line-hairline)] pb-2.5">
                    <h3 className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                      17 Boundary Objects
                    </h3>
                    <span className="font-mono-tech text-[11px] text-[var(--ink-muted)]">
                      {selectedId
                        ? `Highlighting ${DOMAIN_NODES[selectedId].shortName}`
                        : 'All Seams'}
                    </span>
                  </div>
                  <ul className="mt-3 max-h-[260px] space-y-1.5 overflow-y-auto pr-1 text-xs">
                    {BORDER_EDGES.map((edge) => {
                      const hot =
                        selectedId === edge.a ||
                        selectedId === edge.b ||
                        (activeTierNodes !== null &&
                          (activeTierNodes.has(edge.a) ||
                            activeTierNodes.has(edge.b)));
                      return (
                        <li
                          key={`${edge.a}-${edge.b}`}
                          className={`flex items-baseline justify-between gap-2 border-b border-[var(--line-hairline)]/60 py-1.5 ${
                            selectedId && !hot ? 'opacity-45' : 'opacity-100'
                          }`}
                        >
                          <span className="font-medium text-[var(--ink-primary)]">
                            {DOMAIN_NODES[edge.a].shortName} ↔{' '}
                            {DOMAIN_NODES[edge.b].shortName}
                          </span>
                          <span className="font-mono-tech text-right text-[11px] text-[var(--ink-muted)]">
                            {edge.boundaryObject}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SPREAD 04 · CAUSALITY & SELF-REFERENTIAL ABLATION (Tesler's Law)
            ================================================================ */}
        <section
          id="spread-causality"
          aria-label="Causality and Self-Referential Ablation"
          className="scroll-mt-16 border-t border-[var(--line-hairline)] bg-[var(--bg-canvas)] pb-16 pt-20"
        >
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <div className="grid gap-6 border-b border-[var(--line-hairline)] pb-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  04 · Falsifiable Causality
                </p>
                <h2 className="font-editorial mt-2 text-3xl font-medium tracking-tight text-[var(--ink-primary)] md:text-4xl text-balance">
                  Ablate Any Part to Degrade This Website Live
                </h2>
                <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-secondary)]">
                  Cause flows from Intent and Content through Form and Substrate into Experience, constrained by Accessibility and Performance, with Evaluation looping back into Intent. Trigger any ablation below to verify the model empirically.
                </p>
              </div>
              <div className="lg:col-span-5 lg:text-right">
                <p className="font-mono-tech text-[11px] text-[var(--ink-muted)]">
                  Basis: Tesler’s Law · Falsifiable Causal Modeling
                </p>
                {ablatedId && (
                  <button
                    type="button"
                    onClick={handleRestoreAblation}
                    className="cursor-pointer mt-3 inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-primary)] px-4 py-2 text-xs font-semibold text-[var(--bg-canvas)]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Restore All 14 Parts
                  </button>
                )}
              </div>
            </div>

            {/* Quick Ablation Trigger Strip */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
              {ABLATION_CONTROLS.map((item) => {
                const isActive = ablatedId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleToggleAblate(item.id)}
                    className={`cursor-pointer flex flex-col justify-between border p-3 text-left transition-colors ${
                      isActive
                        ? 'border-[var(--stratum-constraint)] bg-[var(--stratum-constraint)] text-white'
                        : 'border-[var(--line-hairline)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:border-[var(--line-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold">{item.label}</span>
                      <ZapOff className="h-3 w-3 shrink-0 opacity-75" aria-hidden="true" />
                    </div>
                    <span
                      className={`font-mono-tech mt-1.5 text-[10px] leading-tight ${
                        isActive ? 'text-white/90' : 'text-[var(--ink-muted)]'
                      }`}
                    >
                      {isActive ? 'Click to restore' : item.consequence}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-8">
                <TopologySvg
                  mode="causes"
                  selectedId={selectedId}
                  ablatedSet={ablatedSet}
                  onSelect={(id) => handleSelectNode(id, false)}
                  onHover={() => sonicEngine.playHoverDetent()}
                />
              </div>

              <div className="lg:col-span-4 border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-6">
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  Empirical System Readout
                </p>
                <h3 className="font-editorial mt-2 text-2xl font-medium text-[var(--ink-primary)]">
                  {ablatedId
                    ? `${DOMAIN_NODES[ablatedId].shortName} Ablated`
                    : 'Nominal System State'}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  {ablation.summary}
                </p>

                <dl className="mt-5 space-y-2.5 border-t border-[var(--line-hairline)] pt-4 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[var(--ink-muted)]">Affected Parts</dt>
                    <dd className="font-mono-tech font-semibold text-[var(--ink-primary)]">
                      {ablatedSet ? `${ablatedSet.size} / 14` : '0 / 14'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--ink-muted)]">Visual Grammar</dt>
                    <dd className="font-mono-tech text-[var(--ink-primary)]">
                      {ablation.stripVisuals ? 'Stripped' : 'Active'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--ink-muted)]">Temporal Continuity</dt>
                    <dd className="font-mono-tech text-[var(--ink-primary)]">
                      {ablation.freezeMotion ? 'Frozen' : 'Active'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--ink-muted)]">WebGL Depth Stage</dt>
                    <dd className="font-mono-tech text-[var(--ink-primary)]">
                      {ablation.suspendWebGL
                        ? 'Suspended'
                        : ablation.flattenSpatial
                        ? 'Flattened 2D'
                        : '3D Active'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--ink-muted)]">Sonic Feedback</dt>
                    <dd className="font-mono-tech text-[var(--ink-primary)]">
                      {ablation.muteSonic
                        ? 'Muted'
                        : soundEnabled
                        ? 'Synthesizing'
                        : 'Standby'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SPREAD 05A · PARTIAL ORDER MASTERY (Hick's Law)
            ================================================================ */}
        <section
          id="spread-order"
          aria-label="Four-Wave Learning Partial Order"
          className="scroll-mt-16 border-t border-[var(--line-hairline)] pb-16 pt-20"
        >
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <div className="mb-8 grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7 border border-[var(--line-hairline)] bg-[var(--bg-canvas)] p-6">
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  05A · Partial Order Mastery
                </p>
                <h2 className="font-editorial mt-2 text-3xl font-medium tracking-tight text-[var(--ink-primary)] md:text-4xl text-balance">
                  Four Prerequisite Waves — Not a Linear Ladder
                </h2>
                <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-secondary)]">
                  Visual design, Interaction design, and Front-end engineering launch concurrently in Wave 0. Graphics engineering branches cleanly from Front-end without blocking DOM-first craft.
                </p>
                <p className="font-mono-tech mt-3 text-[11px] text-[var(--ink-muted)]">
                  Basis: Hick’s Law · Directed Acyclic Prerequisite Ordering
                </p>
              </div>
              <div className="lg:col-span-5" />
            </div>

            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <TopologySvg
                  mode="order"
                  selectedId={selectedId}
                  ablatedSet={ablatedSet}
                  onSelect={(id) => handleSelectNode(id, false)}
                  onHover={() => sonicEngine.playHoverDetent()}
                />
              </div>

              <div className="lg:col-span-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {WAVE_DESCRIPTIONS.map((w) => {
                  const waveNodes = NODE_IDS.filter(
                    (id) => LEARNING_WAVES[id] === w.wave
                  );
                  return (
                    <div
                      key={w.wave}
                      className="border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-4"
                    >
                      <h3 className="font-mono-tech text-xs font-semibold uppercase tracking-wider text-[var(--ink-primary)]">
                        {w.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {w.role}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {waveNodes.map((id) => {
                          const node = DOMAIN_NODES[id];
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => handleSelectNode(id, true)}
                              className={`cursor-pointer border px-2.5 py-1 text-xs font-medium transition-colors ${
                                selectedId === id
                                  ? 'border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                                  : 'border-[var(--line-hairline)] bg-[var(--bg-canvas)] text-[var(--ink-primary)] hover:border-[var(--line-strong)]'
                              }`}
                            >
                              {node.shortName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SPREAD 05B · LIVE MODALITY & CONSTRAINT INSTRUMENTS
            ================================================================ */}
        <ModalityLab
          soundEnabled={soundEnabled}
          scrollSyncEnabled={scrollSyncEnabled}
          reducedMotion={reducedMotion}
          a11yAudit={a11yAudit}
          frameBudgetCap={frameBudgetCap}
          freezeMotionByAblation={ablation.freezeMotion}
          muteSonicByAblation={ablation.muteSonic}
          sensorTilt={sensorTilt}
          onToggleSound={handleToggleSound}
          onToggleScrollSync={() => setScrollSyncEnabled((v) => !v)}
          onToggleReducedMotion={() => setReducedMotion((v) => !v)}
          onToggleA11yAudit={() => setA11yAudit((v) => !v)}
          onToggleFrameBudgetCap={() => setFrameBudgetCap((v) => !v)}
          onChangeSensorTilt={setSensorTilt}
          onSelectNode={(id) => handleSelectNode(id, true)}
        />

        {/* ================================================================
            SPREAD 06 · CANONICAL PRINCIPLES & OBJECTIVE DESIGN PROVENANCE
            ================================================================ */}
        <section
          id="spread-provenance"
          aria-label="Canonical Principles and Objective Design Provenance"
          className="scroll-mt-16 border-t border-[var(--line-hairline)] bg-[var(--bg-canvas)] pb-16 pt-20"
        >
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            {/* 9 Canonical Principles */}
            <div className="grid gap-6 border-b border-[var(--line-hairline)] pb-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  06A · Canonical Rules &amp; Distinctions
                </p>
                <h2 className="font-editorial mt-2 text-3xl font-medium tracking-tight text-[var(--ink-primary)] md:text-4xl text-balance">
                  Nine Invariant Principles of the Domain
                </h2>
              </div>
              <div className="lg:col-span-5 flex flex-wrap items-center gap-1 lg:justify-end">
                {(['All', 'Principle', 'Distinction', 'Boundary'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={principleFilter === cat}
                      onClick={() => setPrincipleFilter(cat)}
                      className={`cursor-pointer border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        principleFilter === cat
                          ? 'border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                          : 'border-[var(--line-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrinciples.map((p, idx) => (
                <article
                  key={p.id}
                  className="flex flex-col justify-between border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono-tech text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
                      <span>{p.category}</span>
                      <span>{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="font-editorial mt-2 text-lg font-medium leading-snug text-[var(--ink-primary)]">
                      {p.title}
                    </h3>
                    <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-secondary)]">
                      {p.explanation}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--line-hairline)] pt-3 text-[11px]">
                    {p.relatedNodes.map((nid) => (
                      <button
                        key={nid}
                        type="button"
                        onClick={() => handleSelectNode(nid, true)}
                        className="cursor-pointer font-mono-tech text-[var(--accent-primary)] hover:underline"
                      >
                        {DOMAIN_NODES[nid].shortName}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {/* Objective Design Provenance Ledger */}
            <div className="mt-16 border-t border-[var(--line-strong)] pt-12">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-7">
                  <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                    06B · Objective Design Provenance Ledger
                  </p>
                  <h2 className="font-editorial mt-2 text-3xl font-medium tracking-tight text-[var(--ink-primary)] md:text-4xl text-balance">
                    Zero Arbitrary Choices — Full Axiom Traceability
                  </h2>
                </div>
                <div className="lg:col-span-5">
                  <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                    Every layout proportion, typographic interval, interaction boundary, and constraint governor on this site traces directly to an external axiom and maps back to the 14-part model.
                  </p>
                  <p className="font-mono-tech mt-2 text-[11px] text-[var(--ink-muted)]">
                    Basis: Peak-End Rule · Full Architectural Transparency
                  </p>
                </div>
              </div>

              <div className="mt-8 divide-y divide-[var(--line-hairline)] border border-[var(--line-hairline)] bg-[var(--bg-surface)]">
                {DESIGN_PROVENANCE.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid gap-4 p-5 lg:grid-cols-12 lg:items-start"
                  >
                    <div className="lg:col-span-3">
                      <p className="font-mono-tech text-xs font-semibold text-[var(--ink-primary)]">
                        {entry.phase}
                      </p>
                      <p className="font-mono-tech mt-1 text-[11px] text-[var(--accent-primary)]">
                        {entry.modelMapping}
                      </p>
                    </div>
                    <div className="lg:col-span-5">
                      <p className="text-sm font-semibold text-[var(--ink-primary)]">
                        {entry.decision}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-secondary)]">
                        {entry.rationale}
                      </p>
                    </div>
                    <div className="lg:col-span-4 lg:text-right">
                      <p className="font-mono-tech text-[11px] text-[var(--ink-muted)]">
                        {entry.reference}
                      </p>
                      {entry.sourceUrl && (
                        <a
                          href={entry.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 font-mono-tech text-[11px] font-semibold text-[var(--accent-primary)] hover:underline"
                        >
                          lawsofux.com specification
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--line-hairline)] bg-[var(--bg-canvas)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-7 pb-16 text-xs text-[var(--ink-muted)] md:px-10 md:pb-7">
          <p className="font-editorial text-sm text-[var(--ink-secondary)]">
            Experience Architecture — Canonical Domain Reference
          </p>
          <p className="font-mono-tech">
            14 Parts · 6 Strata · 4 Dimensions · WebGL &amp; Web Audio Live
          </p>
        </div>
      </footer>

      {/* Minimal Bottom-Left Scroll Spine & 3D Orbit Dock (Hidden in Zen Orbit) */}
      {!zenOrbit && (
        <div
          aria-label="Scroll spine and 3D camera status"
          className="fixed bottom-4 left-4 z-30 flex items-center gap-3 border border-[var(--line-strong)] bg-[var(--bg-surface)]/95 px-3 py-2 text-xs shadow-sm"
        >
          <span className="font-mono-tech tabular-nums text-[11px] font-semibold text-[var(--ink-primary)]">
            {String(Math.round(scrollProgress * 100)).padStart(2, '0')}%
          </span>
          <span className="hidden font-mono-tech text-[11px] text-[var(--ink-muted)] sm:inline">
            {activeSpreadLabel}
          </span>
          <button
            type="button"
            onClick={() => setZenOrbit(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 border-l border-[var(--line-hairline)] pl-3 font-mono-tech text-[11px] font-semibold text-[var(--accent-primary)] hover:underline"
          >
            <Compass className="h-3 w-3" aria-hidden="true" />
            3D Orbit
          </button>
        </div>
      )}

      {/* Slide-Over Specimen Drawer */}
      <SpecimenDrawer
        open={drawerOpen}
        selectedId={selectedId}
        ablatedId={ablatedId}
        onClose={() => setDrawerOpen(false)}
        onSelectNode={(id) => handleSelectNode(id, false)}
        onToggleAblate={handleToggleAblate}
        onRestoreAblation={handleRestoreAblation}
      />
    </div>
  );
}
