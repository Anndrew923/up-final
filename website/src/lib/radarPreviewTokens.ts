/**
 * Marketing radar visual tokens — mirrored from app `radarVisualTokens` ritual profile.
 * WHY: Website must not import root `src/`; keep flagship optics local + color-noise reduced
 * (amber/gold only on >100 overclock reactors; cyan owns polygon / atmosphere).
 */

export const RADAR_PREVIEW = {
  opacity: {
    ringOuter: 0.56,
    ringInner: 0.2,
    spoke: 0.2,
    label: 0.9,
    overflowFill: 0.18,
    overflowStroke: 0.96,
  },
  animation: {
    drawMs: 900,
    breathMs: 4000,
    lexiconMs: 320,
  },
  geometry: {
    /** Wider canvas so ZH labels stay inside 375–430px phones. */
    size: 340,
    outerRadius: 86,
    labelRadius: 138,
    centerAuraRadius: 102,
    orbitPad: 7,
    /** App uses 24 @ r=72; scale so burst depth matches ring ratio. */
    maxOverflowExtra: 29,
  },
  laser: {
    stroke: '#22d3ee',
    strokeWidth: 4.5,
    highlight: '#e0faff',
    highlightWidth: 1.6,
    fillBreathMin: 0.42,
    fillBreathMax: 0.66,
    edgeStop: 'rgba(56,189,248,0.3)',
    auraStops: [
      'rgba(56,189,248,0.1)',
      'rgba(56,189,248,0.22)',
    ] as const,
  },
  glow: {
    polyOuter: 'rgba(34,211,238,0.9)',
    polyInner: 'rgba(34,211,238,1)',
    overflow: 'rgba(34,211,238,0.5)',
    overflowVertex: 'rgba(34,211,238,0.62)',
    polyOuterStd: 6,
    polyInnerStd: 2,
    overflowStd: 3,
    overflowVertexStd: 3,
    reactorStd: 3,
  },
  atmosphere: {
    poolPeak: 'rgba(34,211,238,0.5)',
    orbitStroke: 'rgba(34,211,238,0.5)',
    scannerConic:
      'conic-gradient(from 180deg at 50% 50%, rgba(24,24,27,1) 0%, rgba(34,211,238,0.28) 50%, rgba(24,24,27,1) 100%)',
  },
  grid: {
    outerStroke: '#3f3f46',
    innerStroke: '#27272a',
  },
  overflow: {
    /** Solid cyan; opacity applied via SVG fillOpacity token. */
    fill: '#22d3ee',
    stroke: '#22d3ee',
    burstStroke: 'rgba(34,211,238,0.8)',
    tipFill: '#22d3ee',
  },
  label: {
    title: '#e4e4e7',
    scoreMuted: '#a1a1aa',
    scoreOverclock: '#67e8f9',
  },
  /** ≤100: cyan reactor. >100: amber overclock node only (color-noise rule). */
  node: {
    defaultCore: '#22d3ee',
    defaultRing: 'rgba(34,211,238,0.58)',
    defaultGlow: 'rgba(34,211,238,0.72)',
    overclockCore: '#fbbf24',
    overclockRing: 'rgba(251,191,36,0.68)',
    overclockGlow: 'rgba(251,191,36,0.82)',
    ringR: 5,
    coreR: 2.5,
    tipR: 2.6,
    tipMaxR: 3.4,
  },
  centerDot: '#22d3ee',
  /** Approximate path length for stroke-draw on the marketing hex (viewBox 340). */
  polygonDashLength: 720,
  filterRegion: {
    x: -48,
    y: -48,
    width: 436,
    height: 436,
  },
} as const;
