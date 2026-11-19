export interface DesignDecisionBasis {
  id: string;
  phase: string;
  decision: string;
  reference: string;
  sourceUrl?: string;
  modelMapping: string;
  rationale: string;
}

export const DESIGN_PROVENANCE: DesignDecisionBasis[] = [
  {
    id: 'canvas-spine',
    phase: '01 · Spatial Spine',
    decision: 'Persistent full-viewport WebGL scene driven along a CatmullRomCurve3 spline by scroll progress',
    reference: 'Awwwards SOTD Scroll-Driven Camera Architecture · Law of Continuity (Gestalt)',
    modelMapping: 'Intent + Spatial + Graphics + Motion',
    rationale:
      'Binds DOM prose and 3D spatial sculptures into one continuous coordinate system rather than trapping 3D inside an isolated preview box.',
  },
  {
    id: 'swiss-grid',
    phase: '02 · Spatial Grid',
    decision: 'Asymmetric 12-column architectural hairline grid with 7/5 exhibition splits',
    reference: 'Josef Müller-Brockmann — Grid Systems in Graphic Design',
    modelMapping: 'Visual design · Grid & Composition',
    rationale:
      'Replaces arbitrary box stacking with mathematical alignment and visible structural rhythm across every viewport width.',
  },
  {
    id: 'typographic-scale',
    phase: '03 · Typography',
    decision: 'Perfect Fifth (1.5×) fluid display scale paired with 62ch prose measure and tabular numerals',
    reference: 'Robert Bringhurst — The Elements of Typographic Style · WCAG 2.2 AA',
    modelMapping: 'Visual design + Content + Accessibility',
    rationale:
      'Establishes unmistakable editorial rank from display thesis to prose to mono specifications without decorative noise.',
  },
  {
    id: 'chunking-taxonomy',
    phase: '04 · Taxonomy Spread',
    decision: '14 parts chunked into 6 strata with a 3-axis classifier and slide-over Specimen Drawer',
    reference: 'Miller’s Law (7±2) · Law of Common Region · Jakob’s Law',
    sourceUrl: 'https://lawsofux.com/millers-law/',
    modelMapping: 'Interaction design · Information Architecture',
    rationale:
      'Keeps working-memory groups under 7 items per cluster and moves deep inspection into an on-demand drawer so primary spreads breathe.',
  },
  {
    id: 'tufte-topology',
    phase: '05 · Boundary & Causal Graphs',
    decision: 'High data-ink SVG topology isolating active node edges while dimming inactive connections',
    reference: 'Edward Tufte — Data-Ink Ratio · Law of Proximity · Von Restorff Effect',
    sourceUrl: 'https://lawsofux.com/von-restorff-effect/',
    modelMapping: 'Interaction design + Visual design',
    rationale:
      'Prevents edge hairballs by elevating only the selected part’s boundary objects and causal paths to full contrast.',
  },
  {
    id: 'ablation-engine',
    phase: '06 · Self-Referential Ablation',
    decision: 'Single-click causal ablation that propagates graph failure and degrades the live website itself',
    reference: 'Tesler’s Law · Falsifiable Causal Modeling',
    sourceUrl: 'https://lawsofux.com/teslers-law/',
    modelMapping: 'Intent + All 14 Parts',
    rationale:
      'Absorbs DAG traversal complexity in code so the user experiences directly what breaks when Intent, Visuals, Motion, Sonic, or Spatial layers are removed.',
  },
  {
    id: 'motion-sonic-latency',
    phase: '07 · Temporal & Acoustic Feedback',
    decision: 'Sub-200ms micro-feedback, cubic-bezier velocity instrument, and procedural Web Audio synthesis',
    reference: 'Doherty Threshold (<400ms) · Web Audio API Synthesis',
    sourceUrl: 'https://lawsofux.com/doherty-threshold/',
    modelMapping: 'Motion design + Sonic design + Front-end eng.',
    rationale:
      'Keeps interactive cadence under the Doherty Threshold using compositor-only transforms and zero-latency procedural envelopes.',
  },
  {
    id: 'constraint-governors',
    phase: '08 · Constraint Governance',
    decision: 'Live Reduced Motion, Semantic/Contrast Audit, and Frame Budget Cap governors with Peak-End ledger',
    reference: 'Fitts’s Law · Peak-End Rule · WCAG 2.2 Reduced Motion',
    sourceUrl: 'https://lawsofux.com/peak-end-rule/',
    modelMapping: 'Accessibility + Performance + Evaluation',
    rationale:
      'Proves Constraints are active runtime invariants rather than static documentation, closing the Evaluation-to-Intent loop transparently.',
  },
];
