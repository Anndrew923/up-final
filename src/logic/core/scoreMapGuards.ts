/**
 * Lightweight ScoreMap predicates shared by club / ladder compare UX.
 * WHY: Avoid parking generic score checks under crewFloatingYouBar.
 */

/** True when any axis has a usable positive finite score. */
export function scoreMapHasPositiveAxis(
  scores: Partial<Record<string, number>> | null | undefined
): boolean {
  if (!scores) return false;
  return Object.values(scores).some(
    (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
  );
}
