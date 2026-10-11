/**
 * Formats cloud baseline `updatedAt` for Tools sync status (local wall clock).
 * WHY: Status copy needs a stable `YYYY-MM-DD HH:mm` shape across engines — not locale-variable month names.
 */
export function formatCloudSyncUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}
