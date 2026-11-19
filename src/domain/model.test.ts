import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BORDER_EDGES,
  CAUSAL_EDGES,
  DOMAIN_NODES,
  LEARNING_WAVES,
  NODE_IDS,
  STRATA,
  computeDownstreamAblation,
  getAblationEffects,
  groupNodesByAxis,
} from './model';
import { evaluateCubicBezier, sampleCurvePoints } from './motion';
import { DESIGN_PROVENANCE } from './provenance';

test('domain model preserves all 14 parts across 6 strata and 17 boundary edges', () => {
  assert.equal(NODE_IDS.length, 14);
  assert.equal(STRATA.length, 6);
  assert.equal(BORDER_EDGES.length, 17);
  assert.ok(CAUSAL_EDGES.some((e) => e.from === 'eval' && e.to === 'intent' && e.kind === 'feedback'));
});

test('ablating Intent degrades all downstream form, substrate, and outcome nodes without crossing feedback loop', () => {
  const affected = computeDownstreamAblation('intent');
  assert.equal(affected.has('intent'), true);
  assert.equal(affected.has('ixd'), true);
  assert.equal(affected.has('vis'), true);
  assert.equal(affected.has('mot'), true);
  assert.equal(affected.has('son'), true);
  assert.equal(affected.has('spa'), true);
  assert.equal(affected.has('fe'), true);
  assert.equal(affected.has('gfx'), true);
  assert.equal(affected.has('xr'), true);
  assert.equal(affected.has('exp'), true);
  assert.equal(affected.has('eval'), true);
  // Content, Accessibility, and Performance are independent inputs/constraints
  assert.equal(affected.has('content'), false);
  assert.equal(affected.has('a11y'), false);
  assert.equal(affected.has('perf'), false);
  assert.equal(affected.size, 11);
});

test('ablating Graphics leaves DOM front-end, interaction, visual, and spatial design intact', () => {
  const affected = computeDownstreamAblation('gfx');
  assert.deepEqual(
    Array.from(affected).sort(),
    ['eval', 'exp', 'gfx'].sort()
  );
  assert.equal(affected.has('fe'), false);
  assert.equal(affected.has('ixd'), false);
  assert.equal(affected.has('vis'), false);
  assert.equal(affected.has('spa'), false);
});

test('learning wave partial order computes exact 4-stage DAG waves', () => {
  assert.equal(LEARNING_WAVES.vis, 0);
  assert.equal(LEARNING_WAVES.ixd, 0);
  assert.equal(LEARNING_WAVES.fe, 0);
  assert.equal(LEARNING_WAVES.mot, 1);
  assert.equal(LEARNING_WAVES.gfx, 1);
  assert.equal(LEARNING_WAVES.son, 1);
  assert.equal(LEARNING_WAVES.a11y, 1);
  assert.equal(LEARNING_WAVES.perf, 1);
  assert.equal(LEARNING_WAVES.spa, 2);
  assert.equal(LEARNING_WAVES.xr, 3);
  assert.equal(LEARNING_WAVES.intent, undefined);
});

test('groupNodesByAxis covers all 14 parts on every axis', () => {
  for (const axis of ['Stratum', 'Modality', 'System Role'] as const) {
    const groups = groupNodesByAxis(axis);
    const total = groups.reduce((acc, g) => acc + g.nodes.length, 0);
    assert.equal(total, 14, `Axis ${axis} must partition all 14 nodes`);
  }
  assert.equal(DOMAIN_NODES.content.stratum, 'Content');
});

test('getAblationEffects activates exact self-referential mode per node', () => {
  assert.equal(getAblationEffects('intent').emptyTechDemo, true);
  assert.equal(getAblationEffects('vis').stripVisuals, true);
  assert.equal(getAblationEffects('mot').freezeMotion, true);
  assert.equal(getAblationEffects('son').muteSonic, true);
  assert.equal(getAblationEffects('spa').flattenSpatial, true);
  assert.equal(getAblationEffects('gfx').suspendWebGL, true);
  assert.equal(getAblationEffects(null).downstreamCount, 0);
});

test('cubic-bezier motion evaluator satisfies boundary and monotonicity properties', () => {
  assert.equal(evaluateCubicBezier(0, 0.16, 1, 0.3, 1), 0);
  assert.equal(evaluateCubicBezier(1, 0.16, 1, 0.3, 1), 1);
  const mid = evaluateCubicBezier(0.5, 0, 0, 1, 1);
  assert.ok(Math.abs(mid - 0.5) < 1e-4);

  const pts = sampleCurvePoints({ p1x: 0.16, p1y: 1, p2x: 0.3, p2y: 1 }, 20);
  assert.equal(pts.length, 21);
  assert.ok(pts[4].y > pts[4].x, 'Ease-out curve should lead linear progression early');
});

test('design provenance traces every architectural phase to an objective reference', () => {
  assert.equal(DESIGN_PROVENANCE.length, 8);
  for (const entry of DESIGN_PROVENANCE) {
    assert.ok(entry.reference.length > 5);
    assert.ok(entry.modelMapping.length > 3);
    assert.ok(entry.rationale.length > 10);
  }
});
