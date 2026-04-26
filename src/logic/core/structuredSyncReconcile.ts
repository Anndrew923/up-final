/**
 * Last-write-wins using ISO-8601 timestamps from clients (same clock skew caveats as any client LWW).
 */

export function parseIsoMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/** True when `remote` is strictly newer than `local` (equal counts as not newer). */
export function isRemoteNewer(remote: string | null | undefined, local: string | null | undefined): boolean {
  return parseIsoMs(remote) > parseIsoMs(local);
}
