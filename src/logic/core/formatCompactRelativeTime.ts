/**
 * Compact relative timestamps for ladder / crew rows (e.g. `5m`, `2h`, `03/14`).
 * WHY: Shared by global LadderPage and CrewPrivateLadder — keep rank chrome identical.
 */
export function formatCompactRelativeTime(updatedAt: string, nowMs: number = Date.now()): string {
  const ts = new Date(updatedAt).getTime();
  if (!Number.isFinite(ts)) return '--';
  const diffMs = Math.max(0, nowMs - ts);
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}d`;
  const date = new Date(ts);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  return `${month}/${dayOfMonth}`;
}
