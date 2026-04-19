/**
 * Firestore layout (summary-only leaderboard, per-metric shards).
 * Path: `leaderboards/{metric}/entries/{uid}`
 */
export const LEADERBOARDS_COLLECTION = 'leaderboards';
export const ENTRIES_SUBCOLLECTION = 'entries';

/** Pro cloud backup: `users/{uid}/artifacts/up_cloud_sync_v1` */
export const USER_CLOUD_COLLECTION = 'users';
export const USER_ARTIFACTS_COLLECTION = 'artifacts';
export const USER_CLOUD_DOC_ID = 'up_cloud_sync_v1';

export function leaderboardEntriesCollectionPath(metric: string): string {
  return `${LEADERBOARDS_COLLECTION}/${metric}/${ENTRIES_SUBCOLLECTION}`;
}
