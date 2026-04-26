/**
 * Firestore layout (summary-only leaderboard, per-metric shards).
 * Path: `leaderboards/{metric}/entries/{uid}` — `metric` 含主軸（如 `strength`）與細項分片（如 `strength_squat`、`cardio_5km`），
 * 以 `src/logic/core/ladderShards.ts` 的 `KNOWN_LEADERBOARD_SHARD_IDS` 為準。
 * 欄位 `scoreBest` 命名沿用舊版，語意為「目前榜單顯示分」（每次成功上傳即覆寫，未必是歷史最高）。
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
