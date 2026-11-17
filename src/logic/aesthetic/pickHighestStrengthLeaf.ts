/**
 * Pick the highest-scoring strength leaf from a live combined breakdown (assessment CTA).
 * WHY: Bottom / breakthrough "generate report" must open the undiluted hero leaf, not the /5 composite.
 */
import type { StrengthLiftBranch } from '../core/strengthAssessment';
import type { StrengthLiftKey } from '../../types/strengthInputs';
import type { SingleLeafId } from './singleLeafReport';

/** SSOT for strength lift → single-leaf id (cards, pickers, flush CTAs). */
export const STRENGTH_LIFT_TO_LEAF: Record<StrengthLiftKey, SingleLeafId> = {
  benchPress: 'strength.benchPress',
  squat: 'strength.squat',
  deadlift: 'strength.deadlift',
  latPulldown: 'strength.latPulldown',
  shoulderPress: 'strength.shoulderPress',
};

export function pickHighestStrengthLeaf(
  branches: readonly StrengthLiftBranch[]
): SingleLeafId | null {
  const candidates: { leaf: SingleLeafId; score: number }[] = [];
  for (const branch of branches) {
    if (!Number.isFinite(branch.finalScore) || branch.finalScore <= 0) continue;
    candidates.push({
      leaf: STRENGTH_LIFT_TO_LEAF[branch.lift],
      score: branch.finalScore,
    });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].leaf;
}
