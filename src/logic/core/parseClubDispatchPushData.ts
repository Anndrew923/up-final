/**
 * Parse Club Progress Dispatch FCM `data` (all values are strings).
 * WHY: Tap UX must hydrate the comment bubble from the push payload — 0 Firestore reads.
 */

export type ClubDispatchPushData = {
  type: 'club_progress_dispatch';
  route: string;
  guildId: string;
  focusUid: string;
  dispatchId: string | null;
  comment: string | null;
  metricType: string | null;
  axisScore: string | null;
  overallScore: string | null;
  overallDelta: string | null;
};

function readTrimmedString(record: Record<string, unknown>, key: string): string | null {
  const raw = record[key];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Safe parse of Capacitor / FCM notification.data for club dispatch taps.
 * Returns null when type/route/focusUid are missing or empty.
 */
export function parseClubDispatchPushData(data: unknown): ClubDispatchPushData | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  const type = readTrimmedString(record, 'type');
  if (type !== 'club_progress_dispatch') return null;

  const route = readTrimmedString(record, 'route');
  const guildId = readTrimmedString(record, 'guildId');
  const focusUid = readTrimmedString(record, 'focusUid');
  if (!route || !guildId || !focusUid) return null;

  return {
    type: 'club_progress_dispatch',
    route,
    guildId,
    focusUid,
    dispatchId: readTrimmedString(record, 'dispatchId'),
    comment: readTrimmedString(record, 'comment'),
    metricType: readTrimmedString(record, 'metricType'),
    axisScore: readTrimmedString(record, 'axisScore'),
    overallScore: readTrimmedString(record, 'overallScore'),
    overallDelta: readTrimmedString(record, 'overallDelta'),
  };
}
