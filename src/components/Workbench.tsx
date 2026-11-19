import React from 'react';
import {
  CANONICAL_PRINCIPLES,
  DIMENSIONAL_TIERS,
  DOMAIN_NODES,
  LEARNING_WAVES,
  LENSES,
  STRATA,
  STRATUM_CSS_VAR,
  computeDownstreamAblation,
  getAblationEffects,
  getBoundaryObjectsFor,
  getCausalLinksFor,
  getPrerequisitesFor,
  groupNodesByAxis,
  type ClassificationAxis,
  type DomainNode,
  type LensId,
  type NodeId,
} from '../domain/model';
import { TopologySvg } from './TopologySvg';
import { ArrowRight, RotateCcw, ZapOff } from 'lucide-react';

interface WorkbenchProps {
  activeLens: LensId;
  selectedId: NodeId | null;
  axis: ClassificationAxis;
  ablatedId: NodeId | null;
  emptyTechDemo: boolean;
  onChangeLens: (lens: LensId) => void;
  onSelectNode: (id: NodeId) => void;
  onHoverNode: () => void;
  onChangeAxis: (axis: ClassificationAxis) => void;
  onToggleAblate: (id: NodeId) => void;
  onRestoreAblation: () => void;
}

export const Workbench: React.FC<WorkbenchProps> = ({
  activeLens,
  selectedId,
  axis,
  ablatedId,
  emptyTechDemo,
  onChangeLens,
  onSelectNode,
  onHoverNode,
  onChangeAxis,
  onToggleAblate,
  onRestoreAblation,
}) => {
  const ablatedSet = ablatedId ? computeDownstreamAblation(ablatedId) : null;
  const ablationEffects = getAblationEffects(ablatedId);
  const selectedNode = selectedId ? DOMAIN_NODES[selectedId] : null;

  const renderNodeButton = (node: DomainNode) => {
    const isSelected = selectedId === node.id;
    const isDegraded = ablatedSet?.has(node.id) ?? false;
    const stratumColor = `var(${STRATUM_CSS_VAR[node.stratum]})`;

    return (
      <button
        key={node.id}
        type="button"
        onClick={() => onSelectNode(node.id)}
        onMouseEnter={onHoverNode}
        aria-pressed={isSelected}
        className={`cursor-pointer group w-full rounded-lg border p-3 text-left transition-colors ${
          isSelected
            ? 'border-[var(--ink-primary)] bg-[var(--bg-surface)] shadow-sm'
            : 'border-[var(--line-hairline)] bg-[var(--bg-surface)] hover:border-[var(--line-strong)]'
        } ${isDegraded ? 'opacity-65' : ''}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: isDegraded
                  ? 'var(--stratum-constraint)'
                  : stratumColor,
              }}
            />
            <span
              className={`truncate text-sm font-semibold ${
                isDegraded
                  ? 'line-through text-[var(--ink-muted)]'
                  : 'text-[var(--ink-primary)]'
              }`}
            >
              {node.name}
            </span>
          </div>
          <span className="font-mono-tech shrink-0 text-[11px] text-[var(--ink-muted)]">
            {node.modality}
          </span>
        </div>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          {node.stratum} · {node.systemRole}
        </p>
      </button>
    );
  };

  const renderStrataLegend = () => (
    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--line-hairline)] pt-4 text-xs text-[var(--ink-muted)]">
      {STRATA.map((s) => (
        <span key={s} className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: `var(${STRATUM_CSS_VAR[s]})` }}
          />
          <span>{s}</span>
        </span>
      ))}
    </div>
  );

  const renderWaveSummary = () => {
    const byWave = new Map<number, DomainNode[]>();
    Object.entries(LEARNING_WAVES).forEach(([id, wave]) => {
      if (wave === undefined) return;
      const list = byWave.get(wave) ?? [];
      list.push(DOMAIN_NODES[id as NodeId]);
      byWave.set(wave, list);
    });
    const waves = Array.from(byWave.keys()).sort((a, b) => a - b);

    return (
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {waves.map((w) => (
          <div
            key={w}
            className="rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-3.5"
          >
            <p className="font-mono-tech text-xs font-semibold text-[var(--ink-primary)]">
              Wave {w} {w === 0 ? '· Entry' : ''}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--ink-secondary)]">
              {(byWave.get(w) ?? []).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onSelectNode(n.id)}
                    className="cursor-pointer text-left hover:text-[var(--accent-primary)] hover:underline"
                  >
                    {n.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section
      id="workbench"
      aria-label="Interactive Domain Model Workbench"
      className="scroll-mt-20 mx-auto max-w-[1280px] px-5 py-14 md:px-8"
    >
      {/* Section Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--line-hairline)] pb-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
            Analytical Workbench · Seven Lenses
          </p>
          <h2 className="font-editorial mt-2 text-2xl font-medium tracking-tight text-[var(--ink-primary)] md:text-3xl text-balance">
            {emptyTechDemo
              ? 'Component Matrix & Graph Topology'
              : 'One Dataset, Examined Through Seven Structural Lenses'}
          </h2>
        </div>
        <p className="font-mono-tech text-xs text-[var(--ink-muted)]">
          Keys 1–7 switch lenses · Click any node to inspect
        </p>
      </div>

      {/* Horizontal Tab Strip */}
      <div
        role="tablist"
        aria-label="Domain model lenses"
        className="mb-8 flex gap-1 overflow-x-auto border-b border-[var(--line-hairline)]"
      >
        {LENSES.map((lens, idx) => {
          const active = activeLens === lens.id;
          return (
            <button
              key={lens.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChangeLens(lens.id)}
              className={`cursor-pointer whitespace-nowrap shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-[var(--accent-primary)] text-[var(--ink-primary)] font-semibold'
                  : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <span className="font-mono-tech mr-1.5 text-xs opacity-65">
                {idx + 1}.{' '}
              </span>
              {lens.label}
            </button>
          );
        })}
      </div>

      {/* Main Asymmetric Split: Lens Stage + Sticky Inspector */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* Left: Active Lens */}
        <div role="tabpanel" aria-label={LENSES.find((l) => l.id === activeLens)?.label}>
          {activeLens === 'goal' && (
            <div className="space-y-8">
              <div className="rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-6 md:p-8">
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  Terminal Objective
                </p>
                <p className="font-editorial mt-3 text-xl leading-relaxed text-[var(--ink-primary)] md:text-2xl text-balance">
                  {emptyTechDemo
                    ? 'System nodes connected without narrative anchor.'
                    : 'A clear, navigable model of interactive experience engineering—so practitioners can decide what to learn and what to build next.'}
                </p>
                {!emptyTechDemo && (
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ink-secondary)]">
                    The model separates three frequently conflated concepts: the{' '}
                    <strong className="font-semibold text-[var(--ink-primary)]">
                      artifact
                    </strong>{' '}
                    (an interactive experience), the{' '}
                    <strong className="font-semibold text-[var(--ink-primary)]">
                      practice
                    </strong>{' '}
                    (roles such as Design Engineer or Creative Developer), and the{' '}
                    <strong className="font-semibold text-[var(--ink-primary)]">
                      field
                    </strong>{' '}
                    (the underlying knowledge). Because only the artifact exhibits a testable causal structure, every lens below maps how an experience is produced and perceived.
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Instrumental Lenses
                </h3>
                <div className="overflow-hidden rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)]">
                  <table className="w-full border-collapse text-left text-sm">
                    <tbody>
                      {[
                        {
                          num: '01',
                          verb: 'Decompose',
                          question: 'What is the whole system composed of?',
                          lens: 'parts' as LensId,
                          label: 'Parts',
                        },
                        {
                          num: '02',
                          verb: 'Classify',
                          question: 'How do the fourteen parts differ by axis?',
                          lens: 'kinds' as LensId,
                          label: 'Kinds',
                        },
                        {
                          num: '03',
                          verb: 'Relate',
                          question: 'Where do disciplines meet and share boundary objects?',
                          lens: 'borders' as LensId,
                          label: 'Borders',
                        },
                        {
                          num: '04',
                          verb: 'Explain',
                          question: 'What causes what, and what degrades when a part is removed?',
                          lens: 'causes' as LensId,
                          label: 'Causes',
                        },
                        {
                          num: '05',
                          verb: 'Sequence',
                          question: 'Which foundations must be mastered before specialist branches?',
                          lens: 'order' as LensId,
                          label: 'Order',
                        },
                        {
                          num: '06',
                          verb: 'Establish',
                          question: 'Which structural principles and role distinctions govern craft?',
                          lens: 'canon' as LensId,
                          label: 'Principles',
                        },
                      ].map((row, rIdx) => (
                        <tr
                          key={row.num}
                          className={
                            rIdx > 0 ? 'border-t border-[var(--line-hairline)]' : ''
                          }
                        >
                          <td className="font-mono-tech w-14 px-4 py-3.5 text-xs text-[var(--ink-muted)]">
                            {row.num}
                          </td>
                          <td className="px-2 py-3.5 font-semibold text-[var(--ink-primary)]">
                            {row.verb}
                          </td>
                          <td className="px-3 py-3.5 text-[var(--ink-secondary)]">
                            {row.question}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => onChangeLens(row.lens)}
                              className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--line-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:border-[var(--line-strong)]"
                            >
                              {row.label}
                              <ArrowRight className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeLens === 'parts' && (
            <div>
              <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[var(--ink-secondary)]">
                Twelve proper parts produce the interactive artifact, while two cross-cutting constraints (Accessibility and Performance) govern every decision across Form and Substrate.
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {groupNodesByAxis('Stratum').map(({ group, nodes }) => (
                  <section
                    key={group}
                    aria-label={`${group} stratum`}
                    className="space-y-2"
                  >
                    <h3 className="font-mono-tech border-b border-[var(--line-hairline)] pb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                      {group}
                    </h3>
                    <div className="space-y-2">{nodes.map(renderNodeButton)}</div>
                  </section>
                ))}
              </div>
              {renderStrataLegend()}
            </div>
          )}

          {activeLens === 'kinds' && (
            <div>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-xl text-sm text-[var(--ink-secondary)]">
                  Regrouping the fourteen parts along orthogonal axes reveals why treating all disciplines as a single flat list conflates meaning, matter, dimensions, and engineering layers.
                </p>
                <div
                  role="group"
                  aria-label="Classification axis"
                  className="inline-flex rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-elevated)] p-1"
                >
                  {(['Stratum', 'Modality', 'System Role'] as ClassificationAxis[]).map(
                    (a) => {
                      const active = axis === a;
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => onChangeAxis(a)}
                          aria-pressed={active}
                          className={`cursor-pointer whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? 'bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-sm'
                              : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                          }`}
                        >
                          {a}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {groupNodesByAxis(axis).map(({ group, nodes }) => (
                  <section key={group} className="space-y-2">
                    <h3 className="font-mono-tech border-b border-[var(--line-hairline)] pb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                      {group} · {nodes.length}
                    </h3>
                    <div className="space-y-2">{nodes.map(renderNodeButton)}</div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {activeLens === 'borders' && (
            <div>
              <p className="mb-4 max-w-2xl text-sm text-[var(--ink-secondary)]">
                Each line marks shared ground. Select any part to read the exact boundary objects where two disciplines interlock—such as design tokens, easing timelines, time uniforms, or scene graphs.
              </p>
              <TopologySvg
                mode="borders"
                selectedId={selectedId}
                ablatedSet={ablatedSet}
                onSelect={onSelectNode}
                onHover={onHoverNode}
              />
              <div
                id="dimensional-nesting"
                className="mt-5 rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-5"
              >
                <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                  Dimensional Nesting (Capability Scope, Not Learning Order)
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {DIMENSIONAL_TIERS.map((tier) => (
                    <div
                      key={tier.tier}
                      className="rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-elevated)]/60 p-3"
                    >
                      <p className="font-mono-tech text-xs font-semibold text-[var(--ink-primary)]">
                        {tier.tier === 0 ? 'Tier 0' : `⊂ Tier ${tier.tier}`} · {tier.label}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-muted)]">
                        {tier.subtitle}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {tier.nodes.map((nid) => (
                          <button
                            key={nid}
                            type="button"
                            onClick={() => onSelectNode(nid)}
                            className={`cursor-pointer rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
                              selectedId === nid
                                ? 'border-[var(--ink-primary)] bg-[var(--bg-surface)] text-[var(--ink-primary)]'
                                : 'border-[var(--line-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                            }`}
                          >
                            {DOMAIN_NODES[nid].shortName}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeLens === 'causes' && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-sm text-[var(--ink-secondary)]">
                  Solid arrows denote causal production; dashed crimson lines denote constraint bounds; the orange return arc closes the Evaluation-to-Intent feedback loop. Ablating a part degrades its live equivalent across this site.
                </p>
                <div className="flex items-center gap-2">
                  {selectedId && (
                    <button
                      type="button"
                      onClick={() => onToggleAblate(selectedId)}
                      className={`cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                        ablatedId === selectedId
                          ? 'bg-[var(--stratum-constraint)] text-white'
                          : 'border border-[var(--line-strong)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <ZapOff className="h-3.5 w-3.5" aria-hidden="true" />
                      {ablatedId === selectedId
                        ? `Restore "${DOMAIN_NODES[selectedId].shortName}"`
                        : `Ablate "${DOMAIN_NODES[selectedId].shortName}"`}
                    </button>
                  )}
                  {ablatedId && (
                    <button
                      type="button"
                      onClick={onRestoreAblation}
                      className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--line-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--ink-primary)] hover:border-[var(--line-strong)]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Reset All
                    </button>
                  )}
                </div>
              </div>

              <TopologySvg
                mode="causes"
                selectedId={selectedId}
                ablatedSet={ablatedSet}
                onSelect={onSelectNode}
                onHover={onHoverNode}
              />

              {ablatedId && (
                <div
                  role="status"
                  className="mt-4 rounded-lg border border-[var(--stratum-constraint)]/50 bg-[var(--bg-surface)] p-4 text-sm text-[var(--ink-primary)]"
                >
                  <p className="font-semibold">
                    Live Ablation Active: {DOMAIN_NODES[ablatedId].name} (
                    {ablationEffects.downstreamCount} downstream part
                    {ablationEffects.downstreamCount === 1 ? '' : 's'} impacted)
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                    {ablationEffects.summary}
                  </p>
                </div>
              )}
              {renderStrataLegend()}
            </div>
          )}

          {activeLens === 'order' && (
            <div>
              <p className="mb-4 max-w-2xl text-sm text-[var(--ink-secondary)]">
                Mastery forms a partial order rather than a linear ladder. Solid arrows indicate hard prerequisites; dashed arrows indicate helpful reinforcement. Intent &amp; narrative develops alongside every wave.
              </p>
              <TopologySvg
                mode="order"
                selectedId={selectedId}
                ablatedSet={ablatedSet}
                onSelect={onSelectNode}
                onHover={onHoverNode}
              />
              {renderWaveSummary()}
            </div>
          )}

          {activeLens === 'canon' && (
            <div id="principles" className="space-y-4">
              <p className="max-w-2xl text-sm text-[var(--ink-secondary)]">
                Nine architectural principles and structural distinctions synthesized from the domain graph. Select any referenced part to inspect its boundary objects and causal role.
              </p>
              <div className="divide-y divide-[var(--line-hairline)] overflow-hidden rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)]">
                {CANONICAL_PRINCIPLES.map((item, idx) => (
                  <article key={item.id} className="p-5 md:p-6">
                    <p className="font-mono-tech text-xs text-[var(--ink-muted)]">
                      {String(idx + 1).padStart(2, '0')} · {item.category}
                    </p>
                    <h3 className="font-editorial mt-1.5 text-lg font-medium text-[var(--ink-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-secondary)]">
                      {item.explanation}
                    </p>
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {item.relatedNodes.map((nid) => (
                        <button
                          key={nid}
                          type="button"
                          onClick={() => onSelectNode(nid)}
                          className={`cursor-pointer whitespace-nowrap rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                            selectedId === nid
                              ? 'border-[var(--ink-primary)] bg-[var(--bg-elevated)] text-[var(--ink-primary)]'
                              : 'border-[var(--line-hairline)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] hover:border-[var(--line-strong)] hover:text-[var(--ink-primary)]'
                          }`}
                        >
                          {DOMAIN_NODES[nid].name}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sticky Contextual Inspector Rail */}
        <aside
          aria-label="Part Inspector"
          className="self-start rounded-xl border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-5 lg:sticky lg:top-20"
        >
          {!selectedNode ? (
            <div className="space-y-3">
              <p className="font-mono-tech text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                Contextual Inspector
              </p>
              <h3 className="font-editorial text-xl font-medium text-[var(--ink-primary)]">
                Select any of the 14 parts
              </h3>
              <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
                Click a sculpture in the 3D stage or any node in the workbench to inspect its stratum, modality, boundary objects, causal dependencies, and learning wave.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="border-b border-[var(--line-hairline)] pb-4">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: `var(${STRATUM_CSS_VAR[selectedNode.stratum]})`,
                    }}
                  />
                  <span className="font-mono-tech text-xs text-[var(--ink-muted)]">
                    {selectedNode.stratum} · {selectedNode.modality} ·{' '}
                    {selectedNode.systemRole}
                  </span>
                </div>
                <h3 className="font-editorial mt-2 text-2xl font-medium text-[var(--ink-primary)]">
                  {selectedNode.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
                  {selectedNode.definition}
                </p>
                {selectedNode.dimensionalTier !== null && (
                  <p className="font-mono-tech mt-2.5 text-xs text-[var(--ink-muted)]">
                    Dimensional scope: Tier {selectedNode.dimensionalTier} (
                    {DIMENSIONAL_TIERS[selectedNode.dimensionalTier].label})
                  </p>
                )}
              </div>

              {/* Boundary Objects */}
              <div>
                <h4 className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                  Shares Boundary Ground With
                </h4>
                {(() => {
                  const borders = getBoundaryObjectsFor(selectedNode.id);
                  if (borders.length === 0) {
                    return (
                      <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
                        Cross-cutting quality: applies across every discipline rather than a single seam.
                      </p>
                    );
                  }
                  return (
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {borders.map((b) => (
                        <li
                          key={b.other.id}
                          className="flex items-baseline justify-between gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => onSelectNode(b.other.id)}
                            className="cursor-pointer font-medium text-[var(--ink-primary)] hover:text-[var(--accent-primary)] hover:underline"
                          >
                            {b.other.shortName}
                          </button>
                          <span className="font-mono-tech text-right text-[11px] text-[var(--ink-muted)]">
                            {b.boundaryObject}
                          </span>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>

              {/* Causal Flow */}
              {(() => {
                const { upstream, downstream } = getCausalLinksFor(selectedNode.id);
                return (
                  <div className="grid grid-cols-2 gap-3 border-t border-[var(--line-hairline)] pt-4">
                    <div>
                      <h4 className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                        Driven / Bound By
                      </h4>
                      <ul className="mt-1.5 space-y-1 text-xs text-[var(--ink-secondary)]">
                        {upstream.length === 0 ? (
                          <li className="text-[var(--ink-muted)]">Root input</li>
                        ) : (
                          upstream.map((u) => (
                            <li key={u.node.id}>
                              <button
                                type="button"
                                onClick={() => onSelectNode(u.node.id)}
                                className="cursor-pointer hover:text-[var(--accent-primary)] hover:underline"
                              >
                                {u.node.shortName}
                                {u.kind === 'constrains' ? ' (limit)' : ''}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                        Feeds Into
                      </h4>
                      <ul className="mt-1.5 space-y-1 text-xs text-[var(--ink-secondary)]">
                        {downstream.length === 0 ? (
                          <li className="text-[var(--ink-muted)]">Terminal</li>
                        ) : (
                          downstream.map((d) => (
                            <li key={d.node.id}>
                              <button
                                type="button"
                                onClick={() => onSelectNode(d.node.id)}
                                className="cursor-pointer hover:text-[var(--accent-primary)] hover:underline"
                              >
                                {d.node.shortName}
                                {d.kind === 'feedback' ? ' (feedback)' : ''}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })()}

              {/* Learning Prerequisites */}
              {(() => {
                const { wave, prerequisites } = getPrerequisitesFor(selectedNode.id);
                return (
                  <div className="border-t border-[var(--line-hairline)] pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                        Learning Order
                      </h4>
                      <span className="font-mono-tech text-xs text-[var(--ink-primary)]">
                        {wave !== null ? `Wave ${wave}` : 'Parallel to all waves'}
                      </span>
                    </div>
                    {prerequisites.length > 0 ? (
                      <ul className="mt-1.5 space-y-1 text-xs text-[var(--ink-secondary)]">
                        {prerequisites.map((p) => (
                          <li key={p.node.id}>
                            <button
                              type="button"
                              onClick={() => onSelectNode(p.node.id)}
                              className="cursor-pointer hover:text-[var(--accent-primary)] hover:underline"
                            >
                              {p.node.shortName}
                            </button>{' '}
                            <span className="text-[var(--ink-muted)]">
                              ({p.strength === 'hard' ? 'required' : 'reinforces'})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
                        {wave !== null
                          ? 'No prerequisites — suitable as a Wave 0 starting discipline.'
                          : 'Developed continuously alongside technical practice.'}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Direct Live Self-Ablation Trigger */}
              <div className="border-t border-[var(--line-hairline)] pt-4">
                <button
                  type="button"
                  onClick={() => onToggleAblate(selectedNode.id)}
                  className={`cursor-pointer flex w-full items-center justify-center gap-2 rounded-md px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                    ablatedId === selectedNode.id
                      ? 'bg-[var(--stratum-constraint)] text-white'
                      : 'border border-[var(--line-strong)] bg-[var(--bg-elevated)] text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]'
                  }`}
                >
                  <ZapOff className="h-3.5 w-3.5" aria-hidden="true" />
                  {ablatedId === selectedNode.id
                    ? `Restore ${selectedNode.shortName}`
                    : `Ablate ${selectedNode.shortName} in Live Site`}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};
