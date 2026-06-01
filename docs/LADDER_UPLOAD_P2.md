# Ladder Upload — P2 Server Enforcement Checklist

P1 (shipped in client) covers UX, cost reduction, and honest feedback. P2 makes limits **non-bypassable** and aligns with Firebase billing control.

## P1 baseline (done)

- Home: single **Sync to Ladder** (`LeaderboardSyncAllBar`).
- **Unchanged score** → no Firestore write, no quota consume (`scoresEqualForLadderWrite`, 2dp).
- **Better or worse score** → write allowed (rank trial / revert use case).
- Batch sync: entry writes in loop; **one** `syncLeaderboardPreviewFullSixAxis` when `updated > 0`; `skipPreviewUpdate` per shard.
- Per-shard rolling cap: `LEADERBOARD_UPLOADS_PER_HOUR` (see `logic/core/ladderUploadPolicy.ts`).
- Client rate limit: `rateLimitService` (in-memory; resets on full page reload).
- Full sync-all cooldown: **90 min** + **3 / local day** via `fullSyncRateLimitService` (localStorage; counts only when `updated > 0`).

## P2 scope (shipped in repo)

### 1. Callable API (`functions/`)

| Callable | Purpose |
|----------|---------|
| `ladderSubmitShard` | Single shard write + per-shard hourly cap |
| `ladderSyncBatch` | Multi-shard loop; optional `fullSync: true` for 90 min / 3-day cap |
| `ladderSyncPreview` | Full six-axis `leaderboard_previews/{uid}` |

Enable client path: `VITE_LADDER_CALLABLE_WRITES=true` (after deploy).

### 2. Firestore rules

- Client `create/update/delete` **denied** on:
  - `leaderboards/{metric}/entries/{uid}`
  - `leaderboard_previews/{uid}`
- `ladder_rate_limits/{uid}` — Admin SDK only
- Signed-in users retain **read** on leaderboard entries + previews

### 3. Server rate limits (`ladder_rate_limits/{uid}`)

| Bucket | Suggested cap |
|--------|----------------|
| Per shard / hour | `LEADERBOARD_UPLOADS_PER_HOUR` (3) — **counted writes only** |
| Full batch | 90 min cooldown + 3 / local day (mirror client policy in P2) |

Use transactions: check → write entry → increment counter.

### 4. Pro verification

- Custom claims `pro: true` after RevenueCat webhook, **or**
- Read `users/{uid}` subscription fields inside Callable (same rules as `hasProAccess`).

### 5. App Check

- Enforce on Callable + optionally on Firestore reads.

### 6. Observability

- Structured logs: `uid`, `metric`, `outcome`, `writesSaved`.
- Firebase budget alerts on document reads/writes.

## Intentional deferrals (not P2 blockers)

- Rename `scoreBest` → public display score field name (schema migration).
- Leaderboard snapshot aggregation (1 read per shard for all viewers).
- **Server-side** enforcement of full-sync cooldown (client UI + `fullSyncRateLimitService` already shipped in P1).

## Deploy order (production)

1. `cd functions && npm install && cd ..`
2. `npm run firebase:deploy:ladder-p2` (deploys functions, Firestore rules, and **Storage rules**)
3. Enable Firebase Storage in Console if not already; ladder avatars use `ladder-avatars/{uid}/avatar.jpg`
4. Set `VITE_FIREBASE_STORAGE_BUCKET` (e.g. `fitness-app-69f08.firebasestorage.app` from Console → Storage) in `.env` / `.env.production`
5. Set `VITE_LADDER_CALLABLE_WRITES=true` and rebuild the web app
6. Optional Functions env: `LEADERBOARD_PAYWALL_ENABLED=true` when billing gate is live

## Files (P2)

- `functions/` — ladder callables + `ladder_rate_limits`
- `firestore.rules` — deny client ladder writes
- `src/services/ladderCallableService.ts` — `httpsCallable` wrappers
- `src/services/leaderboardService.ts` — Callable when flag on
- `src/services/leaderboardBatchUploadService.ts` — `ladderSyncBatch` for home sync-all
- `storage.rules` + `src/services/ladderAvatarStorageService.ts` — Pro sync uploads local `data:` avatar to Storage, Callable receives `https://` only
