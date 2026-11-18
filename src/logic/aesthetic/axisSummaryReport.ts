/**
 * Axis-summary report identity — orthogonal to SINGLE_LEAF_IDS.
 * WHY: Composite assess CTAs must open the axis average plaque, not max(leaf).
 */
export const AESTHETIC_AXIS_SUMMARY_AXES = [
  'strength',
  'explosivePower',
  'muscleMass',
] as const;

export type AestheticAxisSummaryAxis = (typeof AESTHETIC_AXIS_SUMMARY_AXES)[number];

export function isAestheticAxisSummaryAxis(
  value: string
): value is AestheticAxisSummaryAxis {
  return (AESTHETIC_AXIS_SUMMARY_AXES as readonly string[]).includes(value);
}

/** Score threshold that tints the plaque gold (same as single-leaf overflow). */
export const AXIS_SUMMARY_OVERFLOW_HERO = 100;
