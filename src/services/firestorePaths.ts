/**
 * Firestore layout (summary-only leaderboard, per-metric shards).
 * Path: `leaderboards/{metric}/entries/{uid}` — `metric` 含主軸（如 `strength`）與細項分片（如 `strength_squat`、`cardio_5km`），
 * 以 `src/logic/core/ladderShards.ts` 的 `KNOWN_LEADERBOARD_SHARD_IDS` 為準。
 * 欄位 `scoreBest` 命名沿用舊版，語意為「目前榜單顯示分」（每次成功上傳即覆寫，未必是歷史最高）。
 */
export const LEADERBOARDS_COLLECTION = 'leaderboards';
export const ENTRIES_SUBCOLLECTION = 'entries';
export const LEADERBOARD_PREVIEWS_COLLECTION = 'leaderboard_previews';

/** Pro cloud backup: `users/{uid}/artifacts/up_cloud_sync_v1` */
export const USER_CLOUD_COLLECTION = 'users';
export const USER_ARTIFACTS_COLLECTION = 'artifacts';
export const USER_CLOUD_DOC_ID = 'up_cloud_sync_v1';

/** Pro structured sync: `users/{uid}/profile/baseline` */
export const USER_PROFILE_SUBCOLLECTION = 'profile';
export const USER_PROFILE_BASELINE_DOC_ID = 'baseline';

/** Pro structured sync: `users/{uid}/history/{recordId}` */
export const USER_HISTORY_SUBCOLLECTION = 'history';

/** Genesis FOMO display summary — signed-in read; Admin SDK writes only. */
export const GENESIS_SEAT_PUBLIC_SUMMARY_COLLECTION = 'public_meta';
export const GENESIS_SEAT_PUBLIC_SUMMARY_DOC_ID = 'genesisSeats';

/**
 * Crew / private guild — Admin SDK writes only; client reads `guilds/{id}` via getDoc.
 * @see `src/types/guild.ts`
 */
export const GUILDS_COLLECTION = 'guilds';
/** Invite-code → guildId lookup; doc id = normalized 6-char code. Client deny-all. */
export const GUILD_INVITE_CODES_COLLECTION = 'guild_invite_codes';
/** Per-uid join attempt windows — Admin SDK only (failed guesses burn quota). */
export const GUILD_JOIN_RATE_LIMITS_COLLECTION = 'guild_join_rate_limits';

export function leaderboardEntriesCollectionPath(metric: string): string {
  return `${LEADERBOARDS_COLLECTION}/${metric}/${ENTRIES_SUBCOLLECTION}`;
}

export function guildDocPath(guildId: string): string {
  return `${GUILDS_COLLECTION}/${guildId}`;
}

export function guildInviteCodeDocPath(code: string): string {
  return `${GUILD_INVITE_CODES_COLLECTION}/${code}`;
}
