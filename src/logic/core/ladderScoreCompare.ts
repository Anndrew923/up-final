/**
 * Ladder write equality — 2dp normalize (aligned with radar / overall display).
 * WHY: Skip Firestore writes when the public score is unchanged; still allow worse scores for rank trials.
 */
export function normalizeLadderScoreForCompare(score: number): number {
  return Math.round(score * 100) / 100;
}

export function scoresEqualForLadderWrite(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return normalizeLadderScoreForCompare(a) === normalizeLadderScoreForCompare(b);
}

/**
 * True when the overall-board row score and preview-derived six-axis average disagree (2dp).
 * WHY: Safety net if legacy data or a failed shard leaves `ladderScore` out of sync with `radarScores`.
 */
export function isLadderOverallEntryDriftFromPreview(
  entryScoreBest: number | null | undefined,
  previewOverall: number | null | undefined
): boolean {
  if (
    entryScoreBest == null ||
    previewOverall == null ||
    !Number.isFinite(entryScoreBest) ||
    !Number.isFinite(previewOverall) ||
    entryScoreBest <= 0 ||
    previewOverall <= 0
  ) {
    return false;
  }
  return !scoresEqualForLadderWrite(entryScoreBest, previewOverall);
}
