export interface CubicBezierCurve {
  id: string;
  name: string;
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  durationMs: number;
  note: string;
}

export const MOTION_PRESETS: CubicBezierCurve[] = [
  {
    id: 'architectural',
    name: 'Architectural Settle',
    p1x: 0.16,
    p1y: 1.0,
    p2x: 0.3,
    p2y: 1.0,
    durationMs: 420,
    note: 'Fast departure with long, poised deceleration. Ideal for gallery staging and drawers.',
  },
  {
    id: 'tactile',
    name: 'Tactile Detent',
    p1x: 0.22,
    p1y: 1.24,
    p2x: 0.36,
    p2y: 1.0,
    durationMs: 280,
    note: 'Subtle elastic overshoot that communicates physical mass on state selection.',
  },
  {
    id: 'editorial',
    name: 'Editorial Drift',
    p1x: 0.45,
    p1y: 0.0,
    p2x: 0.15,
    p2y: 1.0,
    durationMs: 680,
    note: 'Deliberate S-curve pacing for camera transitions and long-form narrative reveals.',
  },
  {
    id: 'mechanical',
    name: 'Linear Telemetry',
    p1x: 0.0,
    p1y: 0.0,
    p2x: 1.0,
    p2y: 1.0,
    durationMs: 320,
    note: 'Constant velocity for continuous scroll-linked uniforms and progress tracks.',
  },
];

function sampleBezierComponent(t: number, p1: number, p2: number): number {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
}

function sampleBezierDerivative(t: number, p1: number, p2: number): number {
  const u = 1 - t;
  return 3 * u * u * p1 + 6 * u * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

/**
 * Solves y(x) for a standard CSS cubic-bezier(p1x, p1y, p2x, p2y) curve at normalized time x in [0, 1].
 */
export function evaluateCubicBezier(
  x: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  let t = x;
  for (let i = 0; i < 8; i++) {
    const currentX = sampleBezierComponent(t, p1x, p2x) - x;
    if (Math.abs(currentX) < 1e-5) break;
    const dx = sampleBezierDerivative(t, p1x, p2x);
    if (Math.abs(dx) < 1e-6) break;
    t -= currentX / dx;
    t = Math.max(0, Math.min(1, t));
  }

  return sampleBezierComponent(t, p1y, p2y);
}

export function sampleCurvePoints(
  curve: Pick<CubicBezierCurve, 'p1x' | 'p1y' | 'p2x' | 'p2y'>,
  steps = 36
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    pts.push({
      x,
      y: evaluateCubicBezier(x, curve.p1x, curve.p1y, curve.p2x, curve.p2y),
    });
  }
  return pts;
}

export function formatCubicBezierCss(
  curve: Pick<CubicBezierCurve, 'p1x' | 'p1y' | 'p2x' | 'p2y'>
): string {
  return `cubic-bezier(${curve.p1x.toFixed(2)}, ${curve.p1y.toFixed(2)}, ${curve.p2x.toFixed(2)}, ${curve.p2y.toFixed(2)})`;
}
