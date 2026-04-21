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
    ringStroke: 0.36,
    spokeStroke: 0.34,
    baseFill: 0.24,
    overflowFill: 0.18,
    overflowStroke: 0.96,
    label: 0.84,
    centerAura: 0.09,
  },
  shadow: {
    panel:
      'shadow-[inset_0_1px_0_rgba(56,189,248,0.14),inset_0_0_40px_rgba(59,130,246,0.07),0_0_34px_rgba(56,189,248,0.08)]',
    overall:
      'shadow-[inset_0_0_0_1px_rgba(56,189,248,0.08),inset_0_0_20px_rgba(59,130,246,0.08)]',
    weakestInset: 'shadow-[inset_2px_0_0_rgba(252,211,77,0.8)]',
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
  },
  geometry: {
    outerRadius: 72,
    labelRadius: 90,
    centerAuraRadius: 86,
  },
} as const;

