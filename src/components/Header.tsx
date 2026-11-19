import React from 'react';

interface HeaderProps {
  emptyTechDemo: boolean;
  onJumpSection: (sectionId: string) => void;
  onOpenOverview: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  emptyTechDemo,
  onJumpSection,
  onOpenOverview,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line-hairline)] bg-[var(--bg-canvas)]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-5 py-3.5 md:px-8">
        {/* Zone 1: Single-line Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-editorial text-lg font-semibold tracking-tight text-[var(--ink-primary)] whitespace-nowrap shrink-0"
        >
          {emptyTechDemo ? 'Interactive Artifact' : 'Experience Architecture'}
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary sections"
          className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-muted)] md:flex"
        >
          <a
            href="#spatial-stage"
            onClick={(e) => {
              e.preventDefault();
              onJumpSection('spatial-stage');
            }}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ink-primary)]"
          >
            Spatial Stage
          </a>
          <a
            href="#workbench"
            onClick={(e) => {
              e.preventDefault();
              onJumpSection('workbench');
            }}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ink-primary)]"
          >
            Domain Model
          </a>
          <a
            href="#instruments"
            onClick={(e) => {
              e.preventDefault();
              onJumpSection('instruments');
            }}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ink-primary)]"
          >
            Instruments
          </a>
          <a
            href="#dimensional-nesting"
            onClick={(e) => {
              e.preventDefault();
              onJumpSection('dimensional-nesting');
            }}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ink-primary)]"
          >
            Dimensions
          </a>
          <a
            href="#principles"
            onClick={(e) => {
              e.preventDefault();
              onJumpSection('principles');
            }}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[var(--ink-primary)]"
          >
            Principles
          </a>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenOverview}
            className="cursor-pointer whitespace-nowrap shrink-0 rounded-md bg-[var(--ink-primary)] px-4 py-2 text-xs font-semibold tracking-wide text-[var(--bg-canvas)] transition-opacity hover:opacity-90"
          >
            Inspect Model
          </button>
        </div>
      </div>
    </header>
  );
};
