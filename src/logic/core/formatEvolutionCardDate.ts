/**
 * Evolution share plate date segment `YYYY.MM.DD` (device-local wall clock).
 *
 * WHY: Card header ranges must stay locale-agnostic numerals while respecting
 * the user's calendar day — never UTC ISO slice (evening UTC+8 would roll forward).
 */
export function formatEvolutionCardDate(
  iso: string | undefined,
  emptyPlaceholder = '—'
): string {
  if (!iso) return emptyPlaceholder;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return emptyPlaceholder;
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
