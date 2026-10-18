import { SIX_AXIS_RADAR_PALETTES } from '../../config/sharedAxisAccentTokens';
import type { SixAxisMetric } from '../../types/scoring';

/**
 * Radar Card Visual v2 tokens
 *
 * WHY:
 * - Consolidates visual constants to avoid magic numbers across HomeRadarBoard and HexRadarChart.
 * - Keeps screenshot-oriented polish stable while preserving readability-first UX.
 *
 * POTENTIAL IMPACT:
 * - Faster, safer visual iteration with lower regression risk.
 */
export const RADAR_CARD_V2 = {
  opacity: {
    gridOverlay: 0.06,
    ringStroke: 0.4,
    ringOuterStroke: 0.56,
    spokeStroke: 0.4,
    baseFill: 0.24,
    overflowFill: 0.18,
    overflowStroke: 0.96,
    label: 0.84,
    centerAura: 0.09,
    reactorRing: 0.58,
    auraBreathMin: 0.68,
    auraBreathMax: 0.92,
  },
  shadow: {
    panel:
      'shadow-[inset_0_1px_0_rgba(56,189,248,0.14),inset_0_0_40px_rgba(59,130,246,0.07),0_0_34px_rgba(56,189,248,0.08)]',
    overall: 'shadow-[inset_0_0_0_1px_rgba(56,189,248,0.08),inset_0_0_20px_rgba(59,130,246,0.08)]',
  },
  font: {
    kickerPx: 10,
    axisLabelPx: 7,
    bodyHintPx: 11,
    overclockHintPx: 10,
  },
  animation: {
    panelMs: 440,
    chartMs: 520,
    radarDrawMs: 900,
    radarBreathMs: 4000,
  },
  geometry: {
    outerRadius: 72,
    labelRadius: 90,
    centerAuraRadius: 86,
  },
} as const;

export const RADAR_LASER_ALERT_PROFILE = {
  polygon: {
    stroke: '#22d3ee',
    glow: 'rgba(34,211,238,0.8)',
    strokeWidth: 3.2,
    fillBreathMin: 0.42,
    fillBreathMax: 0.66,
    edgeStop: 'rgba(56,189,248,0.3)',
  },
  node: {
    defaultCore: '#fbbf24',
    defaultRing: 'rgba(251,191,36,0.58)',
    defaultGlow: 'rgba(251,191,36,0.72)',
    overclockCore: '#fbbf24',
    overclockRing: 'rgba(251,191,36,0.68)',
    overclockGlow: 'rgba(251,191,36,0.82)',
  },
} as const;

/** Quiet combat accents — single source so stroke + vertices never drift apart. */
const RADAR_QUIET_CYAN = '#22d3ee'; // cyan-400
const RADAR_QUIET_GOLD = '#f59e0b'; // amber-500

/**
 * Shared radial-pool / orbit alpha for ritual + quiet.
 * WHY: PK toggle must not flash a darker void; atmosphere stays presentation-agnostic.
 */
export const RADAR_ATMOSPHERE_GLOW_OPACITY = 0.5;

/**
 * Club / PK “combat aesthetic” — luminous outline vs translucent target.
 * WHY: Quiet keeps flagship atmospheric depth (radial pool + orbit); only the scanner is off.
 * Data tokens stay decoupled so ritual Home laser polish never inherits combat weights.
 */
export const RADAR_QUIET_PROFILE = {
  /** Outer hex faintly brighter; inners sit deeper so plates lift forward. */
  gridOuterOpacity: 0.28,
  gridInnerOpacity: 0.16,
  spokeStrokeOpacity: 0.14,
  gridStrokeWidth: 0.55,
  primaryStroke: RADAR_QUIET_CYAN,
  primaryStrokeWidth: 1.8,
  primaryHighlightStroke: '#a5f3fc', // cyan-200 micro edge
  primaryHighlightWidth: 0.55,
  primaryHighlightOpacity: 0.4,
  /** Ice-cyan plate — translucent enough that gold outline stays crisp on top. */
  primaryFill: 'rgba(6, 182, 212, 0.12)',
  comparisonStroke: RADAR_QUIET_GOLD,
  comparisonStrokeWidth: 1.8,
  /** Faint high-temp gold wash — readable under cyan without mud. */
  comparisonFill: 'rgba(245, 158, 11, 0.06)',
  /** Target vertices: Ø 3.5px cyan micro-dots (viewBox units ≈ px at 200). */
  primaryVertexRadius: 1.75,
  primaryVertexFill: RADAR_QUIET_CYAN,
  primaryVertexWinRadius: 2.35,
  /** Comparison anchors: Ø 5px gold disc + white metal core. */
  comparisonVertexOuterRadius: 2.5,
  comparisonVertexCoreRadius: 1.1,
  comparisonVertexWinOuterRadius: 3.1,
  comparisonVertexWinCoreRadius: 1.35,
  comparisonVertexOuter: RADAR_QUIET_GOLD,
  comparisonVertexCore: '#f8fafc',
  vertexWinGlowPrimary: 'drop-shadow(0 0 4px rgba(34,211,238,0.9))',
  vertexWinGlowCompare: 'drop-shadow(0 0 5px rgba(245,158,11,0.95))',
  labelFillOpacity: 0.78,
  overflowFillOpacity: 0.1,
  overflowStrokeOpacity: 0.4,
  overflowStrokeWidth: 0.9,
} as const;

export interface RadarPalette {
  auraStops: readonly [string, string, string];
  stroke: string;
  glow: string;
  reactorCore: string;
  reactorRing: string;
}

const CYAN_DEFAULT_PALETTE: RadarPalette = {
  auraStops: ['rgba(56,189,248,0.1)', 'rgba(56,189,248,0.22)', 'rgba(56,189,248,0.4)'],
  stroke: '#38bdf8',
  glow: 'rgba(56,189,248,0.6)',
  reactorCore: '#38bdf8',
  reactorRing: 'rgba(56,189,248,0.58)',
};

export const getRadarPalette = (dominantKey: SixAxisMetric | null): RadarPalette => {
  if (!dominantKey) {
    return CYAN_DEFAULT_PALETTE;
  }
  return SIX_AXIS_RADAR_PALETTES[dominantKey] ?? CYAN_DEFAULT_PALETTE;
};
