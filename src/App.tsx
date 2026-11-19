import { useEffect, useMemo, useState } from 'react';
import {
  DOMAIN_NODES,
  LENSES,
  computeDownstreamAblation,
  getAblationEffects,
  type ClassificationAxis,
  type LensId,
  type NodeId,
} from './domain/model';
import { sonicEngine } from './audio/sonicEngine';
import { Header } from './components/Header';
import { SpatialStage } from './components/SpatialStage';
import { Workbench } from './components/Workbench';
import { ModalityLab } from './components/ModalityLab';
import { Moon, RotateCcw, Sun, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  const [activeLens, setActiveLens] = useState<LensId>('goal');
  const [selectedId, setSelectedId] = useState<NodeId | null>('intent');
  const [axis, setAxis] = useState<ClassificationAxis>('Stratum');
  const [ablatedId, setAblatedId] = useState<NodeId | null>(null);

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

  // Scroll-and-Beat Synchronization when enabled
  useEffect(() => {
    if (!scrollSyncEnabled || !soundEnabled || ablation.muteSonic) return;
    const onScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      sonicEngine.playScrollSync(progress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollSyncEnabled, soundEnabled, ablation.muteSonic]);

  // Keyboard shortcuts 1-7 for Lenses
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }
      const num = Number(e.key);
      if (num >= 1 && num <= 7) {
        const targetLens = LENSES[num - 1];
        if (targetLens) {
          setActiveLens(targetLens.id);
          sonicEngine.playLensSwitch(num - 1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const jumpTo = (id: string) => {
    if (id === 'dimensional-nesting') {
      setActiveLens('borders');
    } else if (id === 'principles') {
      setActiveLens('canon');
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({
          behavior: reducedMotion || ablation.freezeMotion ? 'auto' : 'smooth',
        });
      }
    });
  };

  const handleSelectNode = (id: NodeId) => {
    setSelectedId(id);
    sonicEngine.playNodeSelect(id);
  };

  const handleChangeLens = (lens: LensId) => {
    setActiveLens(lens);
    const idx = LENSES.findIndex((l) => l.id === lens);
    if (idx >= 0) sonicEngine.playLensSwitch(idx);
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
    'min-h-screen bg-[var(--bg-canvas)] text-[var(--ink-primary)] transition-colors duration-200',
    reducedMotion || ablation.freezeMotion ? 'motion-frozen' : '',
    a11yAudit ? 'a11y-audit' : '',
    ablation.stripVisuals ? 'ablate-visual' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div id="top" className={rootClasses}>
      <Header
        emptyTechDemo={ablation.emptyTechDemo}
        onJumpSection={jumpTo}
        onOpenOverview={() => {
          setActiveLens('parts');
          jumpTo('workbench');
        }}
      />

      {/* Live Self-Referential Ablation Banner */}
      {ablatedId && (
        <div
          role="region"
          aria-label="Active Causal Ablation Status"
          className="border-b border-[var(--stratum-constraint)]/40 bg-[var(--bg-elevated)]"
        >
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-2.5 md:px-8">
            <p className="text-xs font-medium text-[var(--ink-primary)]">
              <strong className="font-mono-tech uppercase tracking-wider text-[var(--stratum-constraint)]">
                Ablation Active:
              </strong>{' '}
              {ablation.summary}
            </p>
            <button
              type="button"
              onClick={handleRestoreAblation}
              className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-[var(--line-strong)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Restore {DOMAIN_NODES[ablatedId].shortName}
            </button>
          </div>
        </div>
      )}

      <main>
        {/* Editorial Monograph Hero */}
        <section
          aria-label="Introduction"
          className="mx-auto max-w-[1280px] px-5 pb-6 pt-7 md:px-8 md:pb-6 md:pt-9"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)] lg:items-end">
            <div>
              <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                {ablation.emptyTechDemo
                  ? 'Artifact Specimen · Unanchored Mode'
                  : 'Canonical Reference · Domain Architecture'}
              </p>
              <h1 className="font-editorial mt-3 text-4xl font-medium leading-[1.08] tracking-tight text-[var(--ink-primary)] md:text-5xl lg:text-[3.4rem] text-balance">
                {ablation.emptyTechDemo
                  ? 'Interactive Canvas & Graph Nodes'
                  : 'Interactive Experience Engineering'}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-secondary)]">
                {ablation.emptyTechDemo
                  ? 'Intent and narrative have been ablated. Controls, shaders, and layout remain executable without overarching purpose.'
                  : 'A single source of truth modeling how interactive digital artifacts are conceived, structured, built, constrained, and experienced—applying every discipline it describes within one living instrument.'}
              </p>
            </div>

            {/* Studio Control & Operational Specification Strip */}
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-hairline)] pb-3 text-xs text-[var(--ink-muted)]">
                <span className="font-mono-tech">
                  14 Parts · 6 Strata · 4 Dimensions · 17 Borders
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
                  }
                  aria-label={`Switch to ${
                    theme === 'light' ? 'dark' : 'light'
                  } studio theme`}
                  className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--line-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--ink-primary)] transition-colors hover:border-[var(--line-strong)]"
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
                  className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--line-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--ink-primary)] transition-colors hover:border-[var(--line-strong)] disabled:opacity-50"
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
                  className={`cursor-pointer whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    ablation.emptyTechDemo
                      ? 'border-[var(--stratum-constraint)] bg-[var(--stratum-constraint)] text-white'
                      : 'border-[var(--line-hairline)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {ablation.emptyTechDemo
                    ? 'Restore Intent'
                    : 'Test Intent Ablation'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Live 3D Spatial Architecture Stage */}
        <SpatialStage
          theme={theme}
          selectedId={selectedId}
          activeLens={activeLens}
          ablation={ablation}
          ablatedSet={ablatedSet}
          reducedMotion={reducedMotion}
          frameBudgetCap={frameBudgetCap}
          sensorTilt={sensorTilt}
          onSelectNode={handleSelectNode}
          onRestoreAblation={handleRestoreAblation}
        />

        {/* Seven-Lens Domain Workbench + Inspector */}
        <Workbench
          activeLens={activeLens}
          selectedId={selectedId}
          axis={axis}
          ablatedId={ablatedId}
          emptyTechDemo={ablation.emptyTechDemo}
          onChangeLens={handleChangeLens}
          onSelectNode={handleSelectNode}
          onHoverNode={() => sonicEngine.playHoverDetent()}
          onChangeAxis={setAxis}
          onToggleAblate={handleToggleAblate}
          onRestoreAblation={handleRestoreAblation}
        />

        {/* Live Modality & Constraint Instrument Deck */}
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
          onSelectNode={handleSelectNode}
        />
      </main>

      <footer className="border-t border-[var(--line-hairline)] bg-[var(--bg-canvas)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-6 text-xs text-[var(--ink-muted)] md:px-8">
          <p className="font-editorial text-sm text-[var(--ink-secondary)]">
            Experience Architecture — Canonical Domain Reference
          </p>
          <p className="font-mono-tech">
            14 Parts · 6 Strata · 4 Nested Dimensions · WebGL &amp; Web Audio Live
          </p>
        </div>
      </footer>
    </div>
  );
}
