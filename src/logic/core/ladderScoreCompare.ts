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
