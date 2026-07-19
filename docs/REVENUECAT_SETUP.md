# RevenueCat Setup (UP Final)

This project currently keeps leaderboard access open while migration is in progress:

- `src/config/monetization.ts` → `leaderboardPaywallEnabled: false`

RevenueCat integration is already wired in code and ready to activate when you switch paywall on.

**Native Android shell**: see `docs/CAPACITOR_ANDROID.md` (Firebase `google-services.json`, Gradle, SHA-1, `cap:sync` / `cap:open`).

## What is already implemented

- Runtime adapter: `src/services/revenueCatService.ts`
- Subscription bridge: `src/services/subscriptionService.ts`
- Entitlement refresh path: `src/stores/entitlementStore.ts` (`refreshEntitlement`)
- Join Arena behavior for both open-beta and paywall mode:
  - `src/pages/JoinArenaPage.tsx`

## Manual steps (required)

1. **RevenueCat dashboard**
   - Create entitlement ID (default expected in code: `pro`)
   - Create offering and package (default package ID expected: `$rc_monthly`)
   - Map iOS / Android store products

2. **Store consoles**
   - App Store Connect: create subscription product and submit required metadata
   - Google Play Console: create subscription base plan and activate track for testing

3. **Environment values**
   - Fill `.env` with:
     - `VITE_RC_API_KEY_IOS`
     - `VITE_RC_API_KEY_ANDROID`
     - `VITE_RC_ENTITLEMENT_ID` (if not `pro`)
     - `VITE_RC_PACKAGE_ID` (if not `$rc_monthly`)
   - Store backend credentials in Secret Manager (never in `.env` committed to source):
     - `firebase functions:secrets:set REVENUECAT_SECRET_API_KEY`
     - `firebase functions:secrets:set REVENUECAT_WEBHOOK_AUTH`
   - In RevenueCat, configure the webhook URL as
     `https://<region>-<project-id>.cloudfunctions.net/revenueCatWebhook` and set its
     `Authorization` header to the exact `REVENUECAT_WEBHOOK_AUTH` value.
   - Before deploying strict expiry enforcement over legacy user documents, run the idempotent
     backfill with production Application Default Credentials:
     - `gcloud auth application-default login`
     - `GCLOUD_PROJECT=<project-id> REVENUECAT_SECRET_API_KEY="$(firebase functions:secrets:access REVENUECAT_SECRET_API_KEY)" npm run --prefix functions migrate:pro-expiries`
   - Deploy `syncProSubscription`, `revenueCatWebhook`, and the strict entitlement gates only
     after the backfill completes successfully.

4. **Native sync**
   - After dependency/env updates, from repo root:
     - `npm run cap:sync` (runs `npm run build` then `npx cap sync android`)
     - or manually: `npx cap sync android`
   - Open Android Studio: `npm run cap:open`

5. **Sandbox test users**
   - Apple sandbox tester account
   - Google license tester account

## Switching from open-beta to paid

When billing validation is complete, switch only this flag:

- `src/config/monetization.ts` → `leaderboardPaywallEnabled: true`

No additional routing or entitlement refactor should be needed.

## Verification checklist

1. Open app with paywall still off:
   - Join Arena shows open-beta banner
   - Enter leaderboard works without purchase
2. Turn paywall on:
   - Free user is gated before leaderboard entry
   - Purchase triggers store flow
   - Restore updates entitlement and re-enables leaderboard
3. Error path:
   - Broken RC key shows billing unavailable banner on Join Arena
   - RevenueCat 429/5xx preserves the last verified entitlement
   - Expiration/refund webhook revokes Pro without requiring the app to reopen
