import React, { useEffect } from 'react';
import {
  DIMENSIONAL_TIERS,
  DOMAIN_NODES,
  STRATUM_CSS_VAR,
  getAblationEffects,
  getBoundaryObjectsFor,
  getCausalLinksFor,
  getPrerequisitesFor,
  type NodeId,
} from '../domain/model';
import { RotateCcw, X, ZapOff } from 'lucide-react';

interface SpecimenDrawerProps {
  open: boolean;
  selectedId: NodeId | null;
  ablatedId: NodeId | null;
  onClose: () => void;
  onSelectNode: (id: NodeId) => void;
  onToggleAblate: (id: NodeId) => void;
  onRestoreAblation: () => void;
}

export const SpecimenDrawer: React.FC<SpecimenDrawerProps> = ({
  open,
  selectedId,
  ablatedId,
  onClose,
  onSelectNode,
  onToggleAblate,
  onRestoreAblation,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const node = selectedId ? DOMAIN_NODES[selectedId] : DOMAIN_NODES.intent;
  const borders = getBoundaryObjectsFor(node.id);
  const { upstream, downstream } = getCausalLinksFor(node.id);
  const { wave, prerequisites } = getPrerequisitesFor(node.id);
  const ablationEffects = getAblationEffects(ablatedId);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35"
      role="dialog"
      aria-modal="true"
      aria-label={`Specimen Inspector: ${node.name}`}
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l border-[var(--line-hairline)] bg-[var(--bg-surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line-hairline)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: `var(${STRATUM_CSS_VAR[node.stratum]})`,
                }}
              />
              <span className="font-mono-tech text-xs text-[var(--ink-muted)]">
                {node.stratum} · {node.modality} · {node.systemRole}
              </span>
            </div>
            <h2 className="font-editorial mt-2 text-2xl font-medium text-[var(--ink-primary)]">
              {node.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close specimen drawer"
            className="cursor-pointer rounded-md border border-[var(--line-hairline)] p-2 text-[var(--ink-secondary)] hover:border-[var(--line-strong)] hover:text-[var(--ink-primary)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex-1 space-y-6">
          <div>
            <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
              {node.definition}
            </p>
            {node.dimensionalTier !== null && (
              <p className="font-mono-tech mt-3 text-xs text-[var(--ink-muted)]">
                Dimensional scope: Tier {node.dimensionalTier} (
                {DIMENSIONAL_TIERS[node.dimensionalTier].label})
              </p>
            )}
          </div>

          <div className="border-t border-[var(--line-hairline)] pt-4">
            <h3 className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
              Boundary Objects (Shared Ground)
            </h3>
            {borders.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                Cross-cutting constraint governing every part rather than a single interface seam.
              </p>
            ) : (
              <ul className="mt-2.5 space-y-2 text-xs">
                {borders.map((b) => (
                  <li
                    key={b.other.id}
                    className="flex items-baseline justify-between gap-3 border-b border-[var(--line-hairline)]/60 pb-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectNode(b.other.id)}
                      className="cursor-pointer font-semibold text-[var(--ink-primary)] hover:text-[var(--accent-primary)] hover:underline"
                    >
                      {b.other.name}
                    </button>
                    <span className="font-mono-tech text-right text-[11px] text-[var(--ink-muted)]">
                      {b.boundaryObject}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[var(--line-hairline)] pt-4">
            <div>
              <h3 className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                Driven / Bound By
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-[var(--ink-secondary)]">
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
                        {u.node.name}
                        {u.kind === 'constrains' ? ' (limit)' : ''}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                Feeds Into
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-[var(--ink-secondary)]">
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
                        {d.node.name}
                        {d.kind === 'feedback' ? ' (feedback)' : ''}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--line-hairline)] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--ink-muted)]">
                Learning Prerequisite Wave
              </h3>
              <span className="font-mono-tech text-xs font-semibold text-[var(--ink-primary)]">
                {wave !== null ? `Wave ${wave}` : 'Continuous'}
              </span>
            </div>
            {prerequisites.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-xs text-[var(--ink-secondary)]">
                {prerequisites.map((p) => (
                  <li key={p.node.id}>
                    <button
                      type="button"
                      onClick={() => onSelectNode(p.node.id)}
                      className="cursor-pointer font-medium hover:text-[var(--accent-primary)] hover:underline"
                    >
                      {p.node.name}
                    </button>{' '}
                    <span className="text-[var(--ink-muted)]">
                      ({p.strength === 'hard' ? 'required' : 'reinforces'})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                {wave !== null
                  ? 'Zero prerequisites — suitable as a Wave 0 starting discipline.'
                  : 'Intent & narrative develops alongside every technical wave.'}
              </p>
            )}
          </div>

          {ablatedId && (
            <div className="rounded-lg border border-[var(--stratum-constraint)]/50 bg-[var(--bg-elevated)] p-3.5 text-xs">
              <p className="font-semibold text-[var(--ink-primary)]">
                Ablation Active: {DOMAIN_NODES[ablatedId].name}
              </p>
              <p className="mt-1 text-[var(--ink-secondary)]">
                {ablationEffects.summary}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-2 border-t border-[var(--line-hairline)] pt-4">
          <button
            type="button"
            onClick={() => onToggleAblate(node.id)}
            className={`cursor-pointer flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold transition-colors ${
              ablatedId === node.id
                ? 'bg-[var(--stratum-constraint)] text-white'
                : 'bg-[var(--ink-primary)] text-[var(--bg-canvas)] hover:opacity-90'
            }`}
          >
            <ZapOff className="h-3.5 w-3.5" aria-hidden="true" />
            {ablatedId === node.id
              ? `Restore "${node.shortName}"`
              : `Ablate "${node.shortName}" Across Live Site`}
          </button>

          {ablatedId && ablatedId !== node.id && (
            <button
              type="button"
              onClick={onRestoreAblation}
              className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-md border border-[var(--line-strong)] px-4 py-2 text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restore Full System
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
