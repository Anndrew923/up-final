/**
 * Formats an ISO instant for ladder rate-limit copy (user locale, month/day + time).
 */
export function formatRateLimitResetAt(iso: string | undefined, locale: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
