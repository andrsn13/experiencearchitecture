import React from 'react';
import {
  BORDER_EDGES,
  CAUSAL_EDGES,
  DOMAIN_NODES,
  LEARNING_EDGES,
  LEARNING_WAVES,
  NODE_IDS,
  STRATUM_CSS_VAR,
  type NodeId,
} from '../domain/model';

export type TopologyMode = 'borders' | 'causes' | 'order';

interface TopologySvgProps {
  mode: TopologyMode;
  selectedId: NodeId | null;
  ablatedSet: Set<NodeId> | null;
  onSelect: (id: NodeId) => void;
  onHover?: () => void;
}

function edgeEndpoint(
  a: [number, number],
  b: [number, number]
): [number, number] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.min(
    dx !== 0 ? 68 / Math.abs(dx) : 1e9,
    dy !== 0 ? 17 / Math.abs(dy) : 1e9
  );
  return [a[0] + dx * t, a[1] + dy * t];
}

export const TopologySvg: React.FC<TopologySvgProps> = ({
  mode,
  selectedId,
  ablatedSet,
  onSelect,
  onHover,
}) => {
  const activeNodes = new Set<NodeId>();
  if (mode === 'borders') {
    BORDER_EDGES.forEach((e) => {
      activeNodes.add(e.a);
      activeNodes.add(e.b);
    });
  } else if (mode === 'causes') {
    CAUSAL_EDGES.forEach((e) => {
      activeNodes.add(e.from);
      activeNodes.add(e.to);
    });
  } else {
    LEARNING_EDGES.forEach((e) => {
      activeNodes.add(e.from);
      activeNodes.add(e.to);
    });
  }

  const labelMap: Record<TopologyMode, string> = {
    borders: 'Shared boundary objects overlap graph',
    causes: 'Directed causal and constraint dependency graph',
    order: 'Four-wave partial order prerequisite graph',
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--line-hairline)] bg-[var(--bg-surface)] p-2">
      <svg
        viewBox="0 0 800 500"
        className="block h-auto w-full min-w-[660px] select-none"
        role="img"
        aria-label={labelMap[mode]}
      >
        <defs>
          <marker
            id="topo-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8z" fill="var(--ink-muted)" />
          </marker>
          <marker
            id="topo-arrow-hot"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8z" fill="var(--accent-primary)" />
          </marker>
          <marker
            id="topo-arrow-constraint"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8z" fill="var(--stratum-constraint)" />
          </marker>
        </defs>

        {/* Subtle architectural column guides */}
        <g opacity="0.35">
          {[70, 270, 490, 700].map((x) => (
            <line
              key={x}
              x1={x}
              y1={24}
              x2={x}
              y2={486}
              stroke="var(--line-hairline)"
              strokeDasharray="2 4"
            />
          ))}
        </g>

        {/* Borders Edges */}
        {mode === 'borders' &&
          BORDER_EDGES.map((edge) => {
            const na = DOMAIN_NODES[edge.a];
            const nb = DOMAIN_NODES[edge.b];
            const hot = selectedId === edge.a || selectedId === edge.b;
            const p = edgeEndpoint(na.pos2d, nb.pos2d);
            const q = edgeEndpoint(nb.pos2d, na.pos2d);
            return (
              <g key={`${edge.a}-${edge.b}`}>
                <line
                  x1={p[0]}
                  y1={p[1]}
                  x2={q[0]}
                  y2={q[1]}
                  stroke={hot ? 'var(--ink-primary)' : 'var(--ink-muted)'}
                  strokeOpacity={hot ? 0.95 : 0.34}
                  strokeWidth={hot ? 2 : 1.15}
                />
                {hot && (
                  <text
                    x={(p[0] + q[0]) / 2}
                    y={(p[1] + q[1]) / 2 - 4}
                    textAnchor="middle"
                    className="font-mono-tech"
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      fill: 'var(--ink-primary)',
                      paintOrder: 'stroke',
                      stroke: 'var(--bg-surface)',
                      strokeWidth: '6px',
                      strokeLinejoin: 'round',
                    }}
                  >
                    {edge.boundaryObject}
                  </text>
                )}
              </g>
            );
          })}

        {/* Causal Edges */}
        {mode === 'causes' &&
          CAUSAL_EDGES.map((edge) => {
            const hot = selectedId === edge.from || selectedId === edge.to;
            if (edge.kind === 'feedback') {
              return (
                <g key="feedback-loop">
                  <path
                    d="M768 300 H792 V16 H70 V130"
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth={hot ? 2.4 : 1.7}
                    markerEnd="url(#topo-arrow-hot)"
                  />
                  <text
                    x="430"
                    y="12"
                    textAnchor="middle"
                    className="font-mono-tech"
                    style={{
                      fontSize: '10.5px',
                      fill: 'var(--accent-primary)',
                      paintOrder: 'stroke',
                      stroke: 'var(--bg-surface)',
                      strokeWidth: '4px',
                    }}
                  >
                    feedback: evaluation reshapes intent
                  </text>
                </g>
              );
            }
            if (edge.kind === 'constrains' && !hot) return null;
            const na = DOMAIN_NODES[edge.from];
            const nb = DOMAIN_NODES[edge.to];
            const p = edgeEndpoint(na.pos2d, nb.pos2d);
            const q = edgeEndpoint(nb.pos2d, na.pos2d);
            const isConstraint = edge.kind === 'constrains';
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={p[0]}
                y1={p[1]}
                x2={q[0]}
                y2={q[1]}
                stroke={
                  isConstraint
                    ? 'var(--stratum-constraint)'
                    : hot
                    ? 'var(--ink-primary)'
                    : 'var(--ink-muted)'
                }
                strokeOpacity={hot ? 0.95 : 0.36}
                strokeWidth={hot ? 2 : 1.2}
                strokeDasharray={isConstraint ? '5 4' : undefined}
                markerEnd={
                  isConstraint
                    ? 'url(#topo-arrow-constraint)'
                    : hot
                    ? 'url(#topo-arrow-hot)'
                    : 'url(#topo-arrow)'
                }
              />
            );
          })}

        {/* Learning Order Edges */}
        {mode === 'order' &&
          LEARNING_EDGES.map((edge) => {
            const hot = selectedId === edge.from || selectedId === edge.to;
            const na = DOMAIN_NODES[edge.from];
            const nb = DOMAIN_NODES[edge.to];
            const p = edgeEndpoint(na.pos2d, nb.pos2d);
            const q = edgeEndpoint(nb.pos2d, na.pos2d);
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={p[0]}
                y1={p[1]}
                x2={q[0]}
                y2={q[1]}
                stroke={hot ? 'var(--ink-primary)' : 'var(--ink-muted)'}
                strokeOpacity={hot ? 0.95 : 0.38}
                strokeWidth={hot ? 2 : 1.2}
                strokeDasharray={edge.strength === 'soft' ? '5 4' : undefined}
                markerEnd={hot ? 'url(#topo-arrow-hot)' : 'url(#topo-arrow)'}
              />
            );
          })}

        {/* Interactive Nodes */}
        {NODE_IDS.map((id) => {
          const node = DOMAIN_NODES[id];
          const [x, y] = node.pos2d;
          const isIncluded = activeNodes.has(id);
          const isSelected = selectedId === id;
          const isDegraded = ablatedSet?.has(id) ?? false;
          const colorVar = `var(${STRATUM_CSS_VAR[node.stratum]})`;
          const wave = LEARNING_WAVES[id];

          return (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-label={`${node.name} (${node.stratum})`}
              aria-pressed={isSelected}
              opacity={isIncluded ? 1 : 0.22}
              className="cursor-pointer outline-none"
              onClick={() => onSelect(id)}
              onMouseEnter={() => onHover?.()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(id);
                }
              }}
            >
              <rect
                x={x - 68}
                y={y - 17}
                width={136}
                height={34}
                rx={6}
                fill={isDegraded ? 'var(--bg-elevated)' : 'var(--bg-surface)'}
                stroke={isDegraded ? 'var(--stratum-constraint)' : colorVar}
                strokeWidth={isSelected ? 3 : 1.4}
                strokeDasharray={isDegraded ? '4 3' : undefined}
              />
              <rect
                x={x - 60}
                y={y - 3}
                width={6}
                height={6}
                rx={1}
                fill={isDegraded ? 'var(--stratum-constraint)' : colorVar}
              />
              <text
                x={x + 4}
                y={y + 4}
                textAnchor="middle"
                style={{
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  fill: isDegraded ? 'var(--ink-muted)' : 'var(--ink-primary)',
                  textDecoration: isDegraded ? 'line-through' : 'none',
                }}
              >
                {node.name}
              </text>
              {mode === 'order' && isIncluded && wave !== undefined && (
                <text
                  x={x + 65}
                  y={y - 21}
                  textAnchor="end"
                  className="font-mono-tech"
                  style={{ fontSize: '10px', fill: 'var(--ink-muted)' }}
                >
                  W{wave}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
