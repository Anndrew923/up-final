# Ladder Upload — P2 Server Enforcement Checklist

P1 (shipped in client) covers UX, cost reduction, and honest feedback. P2 makes limits **non-bypassable** and aligns with Firebase billing control.

## P1 baseline (done)

- Home: single **Sync to Ladder** (`LeaderboardSyncAllBar`).
- **Unchanged score** → no Firestore write, no quota consume (`scoresEqualForLadderWrite`, 2dp).
- **Better or worse score** → write allowed (rank trial / revert use case).
- Batch sync: entry writes in loop; **one** `syncLeaderboardPreviewFullSixAxis` when `updated > 0`; `skipPreviewUpdate` per shard.
- Per-shard rolling cap: `LEADERBOARD_UPLOADS_PER_HOUR` (see `logic/core/ladderUploadPolicy.ts`).
- Client rate limit: `rateLimitService` (in-memory; resets on full page reload).

## P2 scope (recommended order)

### 1. Callable API

- `ladderSubmitShard` — single metric + score.
- `ladderSyncBatch` — server-built target list or client-sent list with server validation.
- Admin SDK writes only; return same result shape as `SubmitLeaderboardResult` (+ `unchanged`).

### 2. Firestore rules

- Deny client `create/update` on:
  - `leaderboards/{metric}/entries/{uid}`
  - `leaderboard_previews/{uid}`
- Optional: keep client **read** for Pro users with App Check.

### 3. Server rate limits (`ladder_rate_limits/{uid}`)

| Bucket | Suggested cap |
|--------|----------------|
| Per shard / hour | `LEADERBOARD_UPLOADS_PER_HOUR` (3) — **counted writes only** |
| Full batch / 6h | 1 global sync (optional, product decision) |

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
- Global batch cooldown UI (until server enforces it).

## Files to touch in P2

- `functions/` (new)
- `firestore.rules`
- `src/services/leaderboardService.ts` → call Callable instead of direct `setDoc`
- `firebase.json` functions config
- Deploy: `firebase deploy --only functions,firestore:rules`
