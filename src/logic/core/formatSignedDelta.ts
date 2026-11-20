/**
 * Signed score delta readout (WHY): LOGS evolution UI and the offscreen share
 * plate must agree on `+12.50` / `-3.00` formatting — one helper prevents
 * canvas vs screen drift.
 */
export function formatSignedDelta(
  delta: number | null | undefined,
  emptyPlaceholder = '—'
): string {
  if (delta == null || !Number.isFinite(delta)) return emptyPlaceholder;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)}`;
}
