import type { DynoIntelContextV1 } from './dynoIntelTypes';
import type { SixAxisMetric } from '../../types/scoring';

export interface DynoPaywallWeakestBrief {
  axis: SixAxisMetric | null;
  score: number | null;
  /** True when axis is an unscored gap (blind spot). */
  isBlindSpot: boolean;
}

/**
 * Extracts paywall copy inputs from a pre-built DYNO context.
 * WHY: Paywall UI stays presentational — weakest axis math lives in logic/core.
 */
export function resolveDynoPaywallWeakestBrief(
  context: DynoIntelContextV1
): DynoPaywallWeakestBrief {
  const axis = context.weakestAxis;
  if (!axis) {
    return { axis: null, score: null, isBlindSpot: false };
  }

  const snapshot = context.axes.find((item) => item.axis === axis);
  const isBlindSpot =
    context.gaps.some((gap) => gap.axis === axis) || snapshot?.score == null;

  return {
    axis,
    score: snapshot?.score ?? null,
    isBlindSpot,
  };
}
