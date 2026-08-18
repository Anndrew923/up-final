/**
 * Pure diff: which badge IDs appear in `current` but not in `previous`.
 * WHY: Drives the global HUD toast — fires only when the footprint blob gains new entries.
 */
export function diffNewlyUnlocked(
  previousIds: readonly string[],
  currentIds: readonly string[]
): string[] {
  const prev = new Set(previousIds);
  return currentIds.filter((id) => !prev.has(id));
}
