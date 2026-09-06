# Coach promo code seed (ops)

Create documents in Firestore collection `promo_codes` (doc id = uppercase code):

```json
{
  "code": "FIN_S0",
  "coachId": "<coach-firebase-uid>",
  "isActive": true,
  "redemptionDeadline": "2026-12-31T23:59:59.000Z",
  "grantDays": 60,
  "maxRedemptions": 100,
  "redeemedCount": 0,
  "commissionRate": 0.5,
  "attributionMonths": 12
}
```

- `maxRedemptions` (optional): when set, Callable rejects with `resource-exhausted` / `promo-code-exhausted` once `redeemedCount >= maxRedemptions`.
- `redeemedCount`: atomically incremented inside the redeem transaction (do not hand-edit under live traffic).

Quick seed (ADC / service account):

```bash
npm run seed:promo
npm run seed:promo -- --dry-run
```

KOL performance table:

```bash
npm run report:kol
```

Clients never read/write this collection — only Callable `redeemPromoCode` (Admin SDK).

Related collections (Admin SDK only):

- `user_attributions/{uid}` — one redeem per user (written atomically with `users.promoExpiresAt`)
- `promo_redeem_rate_limits/{uid}` — rolling hourly attempt cap (failed guesses burn quota; default 10/hour)
- `commission_logs/{revenueCatEventId}` — webhook idempotent ledger (`price * 0.85 * coachRate`)

## Commission event scope (intentional)

Webhook ingest records coach share only for RevenueCat:

- `INITIAL_PURCHASE`
- `RENEWAL`

`PRODUCT_CHANGE` (e.g. monthly → annual upgrade) is **not** logged in P0. If store upgrade emits only `PRODUCT_CHANGE` without a priced `RENEWAL`, that delta is platform revenue until a follow-up handles proration events.

## Local redeem verification (cloud vs emulator)

`redeemPromoCode` follows the same Firebase client wiring as other Callables
(`VITE_FIREBASE_USE_EMULATORS` in root `.env` — see `docs/FIREBASE_EMULATOR.md`).

| Goal | `.env` | Dev server | Seed target |
|------|--------|------------|-------------|
| Real cloud redeem (deployed `fitness-app-69f08`) | `VITE_FIREBASE_USE_EMULATORS=false` **and** `VITE_APP_CHECK_SITE_KEY` set (same as `.env.production`) | Restart `npm run dev` after env change | `npm run seed:promo` (ADC → cloud) |
| Offline / no prod writes | `VITE_FIREBASE_USE_EMULATORS=true` | Also run `npm run firebase:emulators` | `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:promo` |

**Symptom of mismatch:** DevTools shows
`POST http://127.0.0.1:5001/.../redeemPromoCode 404` while the cloud function is healthy —
the client is still on the Functions emulator without a running suite (or without that callable loaded).

**Symptom of missing App Check (emulators=false):** Redeem shows a UI error with **zero** Network
requests. `firebaseFunctions` stays `null` when `VITE_APP_CHECK_SITE_KEY` is unset
(`promoCodeService` reason `unavailable` → `promoCodeErrorUnavailable`). Dev console:
`[PromoDebug] Entry: { hasFunctions: false, ... }`.

**Symptom of unregistered debug token:** Network reaches cloud `redeemPromoCode` but
`exchangeDebugToken` returns **403** and the Callable returns **401**. With a signed-in
Google user, UI must show App Check failure (`promoCodeErrorAppCheck`), not “sign in”.
Fix: set a fixed `VITE_APP_CHECK_DEBUG_TOKEN` in `.env` (gitignored) and register the same
UUID under Firebase Console → App Check → Manage debug tokens; restart `npm run dev`.

After flipping the flag, hard-refresh the browser. Console must **not** show
`[firebase] Connected to local emulators`. Network should hit
`https://us-central1-<project>.cloudfunctions.net/redeemPromoCode`.

## Deploy checklist

```bash
npx firebase deploy --only functions:redeemPromoCode,functions:revenueCatWebhook,functions:syncProSubscription,firestore:rules
```
