/**
 * Strength lift → single-leaf id SSOT (cards, flush CTAs).
 * WHY: Composite assess CTAs open axis-summary; per-lift cards still need this map.
 */
import type { StrengthLiftKey } from '../../types/strengthInputs';
import type { SingleLeafId } from './singleLeafReport';

export const STRENGTH_LIFT_TO_LEAF: Record<StrengthLiftKey, SingleLeafId> = {
  benchPress: 'strength.benchPress',
  squat: 'strength.squat',
  deadlift: 'strength.deadlift',
  latPulldown: 'strength.latPulldown',
  shoulderPress: 'strength.shoulderPress',
};
