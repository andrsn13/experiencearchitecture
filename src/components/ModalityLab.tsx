import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MOTION_PRESETS,
  evaluateCubicBezier,
  formatCubicBezierCss,
  sampleCurvePoints,
  type CubicBezierCurve,
} from '../domain/motion';
import {
  DOMAIN_NODES,
  STRATA,
  STRATUM_CSS_VAR,
  type NodeId,
  type Stratum,
} from '../domain/model';
import { sonicEngine } from '../audio/sonicEngine';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface ModalityLabProps {
  soundEnabled: boolean;
  scrollSyncEnabled: boolean;
  reducedMotion: boolean;
  a11yAudit: boolean;
  frameBudgetCap: boolean;
  freezeMotionByAblation: boolean;
  muteSonicByAblation: boolean;
  sensorTilt: { x: number; y: number };
  onToggleSound: () => void;
  onToggleScrollSync: () => void;
  onToggleReducedMotion: () => void;
  onToggleA11yAudit: () => void;
  onToggleFrameBudgetCap: () => void;
  onChangeSensorTilt: (tilt: { x: number; y: number }) => void;
  onSelectNode: (id: NodeId) => void;
}

const STRATUM_REPRESENTATIVE: Record<Stratum, NodeId> = {
  Intent: 'intent',
  Content: 'content',
  Form: 'mot',
  Substrate: 'fe',
  Constraint: 'a11y',
  Outcome: 'exp',
};

export const ModalityLab: React.FC<ModalityLabProps> = ({
  soundEnabled,
  scrollSyncEnabled,
  reducedMotion,
  a11yAudit,
  frameBudgetCap,
  freezeMotionByAblation,
  muteSonicByAblation,
  sensorTilt,
  onToggleSound,
  onToggleScrollSync,
  onToggleReducedMotion,
  onToggleA11yAudit,
  onToggleFrameBudgetCap,
  onChangeSensorTilt,
  onSelectNode,
}) => {
  const [curve, setCurve] = useState<CubicBezierCurve>(MOTION_PRESETS[0]);
  const [motionProgress, setMotionProgress] = useState<number>(0);
  const [isPlayingMotion, setIsPlayingMotion] = useState<boolean>(false);
  const [gyroActive, setGyroActive] = useState<boolean>(false);
  const [frameDeltaMs, setFrameDeltaMs] = useState<number>(16.7);

  const curvePoints = useMemo(() => sampleCurvePoints(curve, 36), [curve]);
  const svgPath = useMemo(() => {
    return curvePoints
      .map((pt, i) => {
        const sx = 24 + pt.x * 192;
        const sy = 156 - pt.y * 120;
        return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(' ');
  }, [curvePoints]);

  const easedPosition = useMemo(
    () =>
      evaluateCubicBezier(
        motionProgress,
        curve.p1x,
        curve.p1y,
        curve.p2x,
        curve.p2y
      ),
    [motionProgress, curve]
  );

  // Kinetic Curve Playback Specimen
  useEffect(() => {
    if (!isPlayingMotion) return;
    if (reducedMotion || freezeMotionByAblation) {
      setMotionProgress(1);
      setIsPlayingMotion(false);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / curve.durationMs);
      setMotionProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setIsPlayingMotion(false);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlayingMotion, curve.durationMs, reducedMotion, freezeMotionByAblation]);

  // Real rAF Frame Budget Measurement (for Performance Constraint Governor)
  const lastFrameRef = useRef<number>(performance.now());
  useEffect(() => {
    let raf = 0;
    let count = 0;
    let accum = 0;
    const measure = (now: number) => {
      const dt = now - lastFrameRef.current;
      lastFrameRef.current = now;
      if (dt > 0 && dt < 250) {
        accum += dt;
        count += 1;
      }
      if (count >= 18) {
        setFrameDeltaMs(Number((accum / count).toFixed(1)));
        accum = 0;
        count = 0;
      }
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Optional DeviceOrientation Sensor Listener
  useEffect(() => {
    if (!gyroActive) return;
    const handler = (ev: DeviceOrientationEvent) => {
      if (ev.gamma === null || ev.beta === null) return;
      const nx = Math.max(-1, Math.min(1, ev.gamma / 35));
      const ny = Math.max(-1, Math.min(1, (ev.beta - 35) / 35));
      onChangeSensorTilt({ x: nx, y: ny });
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, [gyroActive, onChangeSensorTilt]);

  const handlePadPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 && e.type === 'pointermove') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    onChangeSensorTilt({
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny)),
    });
  };

  return (
    <section
      id="instruments"
      aria-label="Live Modality and Constraint Instruments"
      className="scroll-mt-20 mx-auto max-w-[1280px] border-t border-[var(--line-hairline)] px-5 py-14 md:px-8"
    >
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
            Live Boundary Instruments
          </p>
          <h2 className="font-editorial mt-2 text-2xl font-medium tracking-tight text-[var(--ink-primary)] md:text-3xl text-balance">
            Modalities &amp; Constraints Applied Directly
          </h2>
        </div>
        <p className="max-w-md text-sm text-[var(--ink-secondary)]">
          Every cross-cutting discipline in the model—Motion, Sonic, Body Sensors, Accessibility, and Performance—is wired as a live instrument below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Motion & Timeline Boundary Instrument */}
        <div className="rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono-tech text-xs text-[var(--ink-muted)]">
                Motion ↔ Front-end · Easing &amp; Timelines
              </p>
              <h3 className="font-editorial mt-1 text-xl font-medium text-[var(--ink-primary)]">
                Cubic-Bezier Velocity Curve
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setMotionProgress(0);
                setIsPlayingMotion(true);
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--line-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]"
            >
              <Play className="h-3 w-3" aria-hidden="true" />
              Trigger
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {MOTION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setCurve(preset);
                  setMotionProgress(0);
                  setIsPlayingMotion(true);
                }}
                className={`cursor-pointer whitespace-nowrap rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                  curve.id === preset.id
                    ? 'border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                    : 'border-[var(--line-hairline)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="mt-4 grid items-center gap-5 sm:grid-cols-[240px_minmax(0,1fr)]">
            <svg
              viewBox="0 0 240 180"
              className="w-full rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-canvas)]"
              role="img"
              aria-label={`Cubic bezier curve for ${curve.name}`}
            >
              <line
                x1={24}
                y1={156}
                x2={216}
                y2={36}
                stroke="var(--line-hairline)"
                strokeDasharray="3 3"
              />
              <line
                x1={24}
                y1={156}
                x2={24 + curve.p1x * 192}
                y2={156 - curve.p1y * 120}
                stroke="var(--ink-muted)"
                strokeWidth={1.2}
              />
              <line
                x1={216}
                y1={36}
                x2={24 + curve.p2x * 192}
                y2={156 - curve.p2y * 120}
                stroke="var(--ink-muted)"
                strokeWidth={1.2}
              />
              <path
                d={svgPath}
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth={2.5}
              />
              <circle
                cx={24 + curve.p1x * 192}
                cy={156 - curve.p1y * 120}
                r={4.5}
                fill="var(--ink-primary)"
              />
              <circle
                cx={24 + curve.p2x * 192}
                cy={156 - curve.p2y * 120}
                r={4.5}
                fill="var(--accent-primary)"
              />
              <circle
                cx={24 + motionProgress * 192}
                cy={156 - easedPosition * 120}
                r={5}
                fill="var(--stratum-form)"
              />
            </svg>

            <div className="space-y-3">
              <p className="font-mono-tech text-xs text-[var(--ink-primary)]">
                {formatCubicBezierCss(curve)} · {curve.durationMs}ms
              </p>
              <p className="text-xs leading-relaxed text-[var(--ink-secondary)]">
                {curve.note}
              </p>
              <label className="block text-xs text-[var(--ink-muted)]">
                Scrub Time ({Math.round(motionProgress * 100)}%)
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={motionProgress}
                  onChange={(e) => {
                    setIsPlayingMotion(false);
                    setMotionProgress(parseFloat(e.target.value));
                  }}
                  className="mt-1 block w-full accent-[var(--accent-primary)]"
                />
              </label>
              {/* Kinetic Translation Specimen (100% container span via compositor transform) */}
              <div className="relative h-8 overflow-hidden rounded border border-[var(--line-hairline)] bg-[var(--bg-elevated)] px-1.5 py-1.5">
                <div
                  className="h-full w-full"
                  style={{
                    transform: `translateX(${Math.max(0, Math.min(1.06, easedPosition)) * 100}%)`,
                  }}
                >
                  <div
                    className="h-5 w-9 rounded-sm bg-[var(--accent-primary)]"
                    style={{
                      transform: `translateX(${-Math.max(0, Math.min(1.06, easedPosition)) * 100}%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sonic Synthesis & Beat Sync */}
        <div className="rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono-tech text-xs text-[var(--ink-muted)]">
                Sonic ↔ Motion ↔ Front-end · Web Audio API
              </p>
              <h3 className="font-editorial mt-1 text-xl font-medium text-[var(--ink-primary)]">
                Procedural Harmonic Matrix
              </h3>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              disabled={muteSonicByAblation}
              aria-pressed={soundEnabled && !muteSonicByAblation}
              className={`cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                soundEnabled && !muteSonicByAblation
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-canvas)]'
                  : 'border border-[var(--line-strong)] bg-[var(--bg-elevated)] text-[var(--ink-primary)]'
              } disabled:opacity-50`}
            >
              {soundEnabled && !muteSonicByAblation ? (
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {muteSonicByAblation
                ? 'Ablated'
                : soundEnabled
                ? 'Audio Active'
                : 'Enable Audio'}
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[var(--ink-secondary)]">
            Zero external audio files: oscillators and low-pass envelopes synthesize distinct intervals for each of the six strata directly in the browser.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STRATA.map((stratum) => {
              const repId = STRATUM_REPRESENTATIVE[stratum];
              return (
                <button
                  key={stratum}
                  type="button"
                  onClick={async () => {
                    if (!soundEnabled && !muteSonicByAblation) {
                      await onToggleSound();
                    }
                    sonicEngine.playNodeSelect(repId);
                    onSelectNode(repId);
                  }}
                  className="cursor-pointer flex items-center gap-2 rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 text-left text-xs font-medium text-[var(--ink-primary)] transition-colors hover:border-[var(--line-strong)]"
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: `var(${STRATUM_CSS_VAR[stratum]})` }}
                  />
                  <span className="truncate">{stratum}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5">
            <div>
              <p className="text-xs font-semibold text-[var(--ink-primary)]">
                Scroll &amp; Beat Sync
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Triggers quiet harmonic steps as reading depth advances
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={scrollSyncEnabled}
              onClick={onToggleScrollSync}
              className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                scrollSyncEnabled
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-ink)]'
                  : 'border border-[var(--line-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)]'
              }`}
            >
              {scrollSyncEnabled ? 'Synced' : 'Off'}
            </button>
          </div>
        </div>

        {/* 3. Body & Sensor Input Rig */}
        <div className="rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono-tech text-xs text-[var(--ink-muted)]">
                Spatial ↔ Sensors &amp; XR · Pose &amp; Depth
              </p>
              <h3 className="font-editorial mt-1 text-xl font-medium text-[var(--ink-primary)]">
                Bodily Orientation &amp; Tilt Rig
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onChangeSensorTilt({ x: 0, y: 0 })}
              className="cursor-pointer whitespace-nowrap rounded-md border border-[var(--line-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            >
              Center Pose
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[var(--ink-secondary)]">
            Drag inside the planar vector field below—or enable device gyroscope input—to tilt the 3D spatial constellation in real time.
          </p>

          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div
              role="slider"
              tabIndex={0}
              aria-label="Spatial sensor tilt pad"
              aria-valuetext={`X ${sensorTilt.x.toFixed(2)}, Y ${sensorTilt.y.toFixed(2)}`}
              onPointerDown={handlePadPointer}
              onPointerMove={handlePadPointer}
              onKeyDown={(e) => {
                const step = 0.15;
                if (e.key === 'ArrowLeft')
                  onChangeSensorTilt({ ...sensorTilt, x: Math.max(-1, sensorTilt.x - step) });
                if (e.key === 'ArrowRight')
                  onChangeSensorTilt({ ...sensorTilt, x: Math.min(1, sensorTilt.x + step) });
                if (e.key === 'ArrowUp')
                  onChangeSensorTilt({ ...sensorTilt, y: Math.max(-1, sensorTilt.y - step) });
                if (e.key === 'ArrowDown')
                  onChangeSensorTilt({ ...sensorTilt, y: Math.min(1, sensorTilt.y + step) });
              }}
              className="relative h-36 w-full cursor-crosshair touch-none rounded-lg border border-[var(--line-strong)] bg-[var(--bg-canvas)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--line-hairline)]" />
              <div className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-[var(--line-hairline)]" />
              <div
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--bg-canvas)] bg-[var(--accent-primary)]"
                style={{
                  left: `${(sensorTilt.x * 0.5 + 0.5) * 100}%`,
                  top: `${(sensorTilt.y * 0.5 + 0.5) * 100}%`,
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-elevated)]/60 p-3 font-mono-tech text-xs">
                <div>
                  <span className="text-[var(--ink-muted)]">Yaw X</span>
                  <p className="mt-0.5 font-semibold text-[var(--ink-primary)]">
                    {sensorTilt.x >= 0 ? '+' : ''}
                    {(sensorTilt.x * 14).toFixed(1)}°
                  </p>
                </div>
                <div>
                  <span className="text-[var(--ink-muted)]">Pitch Y</span>
                  <p className="mt-0.5 font-semibold text-[var(--ink-primary)]">
                    {sensorTilt.y >= 0 ? '+' : ''}
                    {(sensorTilt.y * 9).toFixed(1)}°
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGyroActive((v) => !v)}
                aria-pressed={gyroActive}
                className={`cursor-pointer w-full rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  gyroActive
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--ink-primary)]'
                    : 'border-[var(--line-hairline)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {gyroActive
                  ? 'Device Gyroscope Listening'
                  : 'Bind Hardware Gyroscope (Mobile)'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Constraint Governors */}
        <div className="rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono-tech text-xs text-[var(--ink-muted)]">
                Constraint Stratum · Live System Bounds
              </p>
              <h3 className="font-editorial mt-1 text-xl font-medium text-[var(--ink-primary)]">
                Accessibility &amp; Performance Governors
              </h3>
            </div>
            <span className="font-mono-tech text-xs text-[var(--ink-muted)]">
              {frameDeltaMs.toFixed(1)} ms / frame
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[var(--ink-secondary)]">
            Constraints are qualities every part must uphold. Toggle these governors to observe how Accessibility and Performance actively constrain Motion, Visuals, and WebGL rendering.
          </p>

          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5">
              <div>
                <p className="text-xs font-semibold text-[var(--ink-primary)]">
                  Reduced Motion Governor
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Halts shader waves, oscillation, and spring transitions
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reducedMotion}
                onClick={onToggleReducedMotion}
                className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  reducedMotion
                    ? 'bg-[var(--stratum-constraint)] text-white'
                    : 'border border-[var(--line-hairline)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)]'
                }`}
              >
                {reducedMotion ? 'Enforced' : 'Standard'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5">
              <div>
                <p className="text-xs font-semibold text-[var(--ink-primary)]">
                  Semantic &amp; Contrast Overlay
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Reveals landmark boundaries and strengthens hairline rules
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={a11yAudit}
                onClick={onToggleA11yAudit}
                className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  a11yAudit
                    ? 'bg-[var(--stratum-constraint)] text-white'
                    : 'border border-[var(--line-hairline)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)]'
                }`}
              >
                {a11yAudit ? 'Auditing' : 'Off'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5">
              <div>
                <p className="text-xs font-semibold text-[var(--ink-primary)]">
                  Frame Budget Cap (1x DPR / 30Hz)
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Bounds WebGL pixel ratio and shader draw cadence
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={frameBudgetCap}
                onClick={onToggleFrameBudgetCap}
                className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  frameBudgetCap
                    ? 'bg-[var(--stratum-constraint)] text-white'
                    : 'border border-[var(--line-hairline)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)]'
                }`}
              >
                {frameBudgetCap ? 'Capped' : 'Unbounded'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
