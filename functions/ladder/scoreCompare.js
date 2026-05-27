/** 2dp equality — mirror `src/logic/core/ladderScoreCompare.ts`. */
export function normalizeLadderScoreForCompare(score) {
  return Math.round(score * 100) / 100;
}

export function scoresEqualForLadderWrite(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return normalizeLadderScoreForCompare(a) === normalizeLadderScoreForCompare(b);
}
