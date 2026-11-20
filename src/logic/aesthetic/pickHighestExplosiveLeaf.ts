/**
 * Pick the highest-scoring explosive leaf from a live breakdown (assessment CTA).
 */
import type { ExplosivePowerBreakdown } from '../core/powerScoring';
import { clampScoreMapValue } from '../core/scoring';
import type { SingleLeafId } from './singleLeafReport';

/** Per-branch cards on ExplosiveAssessmentPage (mirrors StrengthLiftKey → leaf). */
export type ExplosiveBranchId = 'verticalJump' | 'standingLongJump' | 'sprint';

export const EXPLOSIVE_BRANCH_TO_LEAF: Record<ExplosiveBranchId, SingleLeafId> = {
  verticalJump: 'explosive.verticalJump',
  standingLongJump: 'explosive.standingLongJump',
  sprint: 'explosive.sprint',
};

/** Draft flush tab for a branch card — keeps UI free of ExplosiveAssessmentTab imports. */
export function explosiveBranchFlushTab(
  branch: ExplosiveBranchId
): 'jumps' | 'sprint' {
  return branch === 'sprint' ? 'sprint' : 'jumps';
}

export function pickHighestExplosiveLeaf(
  breakdown: ExplosivePowerBreakdown
): SingleLeafId | null {
  const candidates: { leaf: SingleLeafId; score: number }[] = [];
  // WHY: Compare clamp(≤200) so uncapped sprint overflow cannot beat a full jump leaf.
  if (breakdown.verticalJumpRaw != null && breakdown.verticalJumpRaw > 0) {
    candidates.push({
      leaf: EXPLOSIVE_BRANCH_TO_LEAF.verticalJump,
      score: clampScoreMapValue(breakdown.verticalJumpRaw),
    });
  }
  if (breakdown.standingLongJumpRaw != null && breakdown.standingLongJumpRaw > 0) {
    candidates.push({
      leaf: EXPLOSIVE_BRANCH_TO_LEAF.standingLongJump,
      score: clampScoreMapValue(breakdown.standingLongJumpRaw),
    });
  }
  if (breakdown.sprintRaw != null && breakdown.sprintRaw > 0) {
    candidates.push({
      leaf: EXPLOSIVE_BRANCH_TO_LEAF.sprint,
      score: clampScoreMapValue(breakdown.sprintRaw),
    });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].leaf;
}
