/**
 * Compact card header timestamp (`YYYY.MM.DD HH:mm` in device local time).
 * WHY: Dot separators + fixed width fit 360px headers without truncate / ellipsis.
 */
export function formatHistoryCardSavedAt(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${mo}.${day} ${h}:${min}`;
}
