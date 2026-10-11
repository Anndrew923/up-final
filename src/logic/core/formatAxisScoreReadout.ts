/**
 * HUD six-axis snapshot readout (WHY): Integers stay bare; fractions use 2dp.
 * Kept separate from lobby glance (`formatLobbyGlanceValue` always 2dp) so Bento
 * rail format changes never alter the war-room panel.
 */
export function formatAxisScoreReadout(
  value: number | undefined,
  emptyPlaceholder = '—'
): string {
  if (value == null || !Number.isFinite(value)) return emptyPlaceholder;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
