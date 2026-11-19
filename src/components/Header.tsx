import React from 'react';

interface HeaderProps {
  emptyTechDemo: boolean;
  selectedName: string | null;
  onJumpSpread: (spreadId: string) => void;
  onOpenDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  emptyTechDemo,
  selectedName,
  onJumpSpread,
  onOpenDrawer,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line-hairline)] bg-[var(--bg-canvas)]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-5 py-3.5 md:px-10">
        {/* Zone 1: Single-line Wordmark */}
        <a
          href="#spread-thesis"
          onClick={(e) => {
            e.preventDefault();
            onJumpSpread('spread-thesis');
          }}
          className="font-editorial text-lg font-semibold tracking-tight text-[var(--ink-primary)] whitespace-nowrap shrink-0"
        >
          {emptyTechDemo ? 'Interactive Artifact' : 'Experience Architecture'}
        </a>

        {/* Zone 2: 5 concise single-line chapter anchors (Serial Position + Hick's Law) */}
        <nav
          aria-label="Monograph spreads"
          className="hidden items-center gap-6 text-xs font-medium tracking-wide text-[var(--ink-muted)] lg:flex"
        >
          {[
            { id: 'spread-thesis', label: '01 Thesis' },
            { id: 'spread-taxonomy', label: '02 Taxonomy' },
            { id: 'spread-borders', label: '03 Borders' },
            { id: 'spread-causality', label: '04 Causality' },
            { id: 'spread-provenance', label: '05 Provenance' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onJumpSpread(item.id);
              }}
              className="font-mono-tech whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ink-primary)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenDrawer}
            className="cursor-pointer whitespace-nowrap shrink-0 rounded-md bg-[var(--ink-primary)] px-4 py-2 text-xs font-semibold tracking-wide text-[var(--bg-canvas)] transition-opacity hover:opacity-90"
          >
            {selectedName ? `Specimen: ${selectedName}` : 'Open Specimen'}
          </button>
        </div>
      </div>
    </header>
  );
};
