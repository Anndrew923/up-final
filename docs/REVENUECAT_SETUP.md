# RevenueCat Setup (UP Final)

This project currently keeps leaderboard access open while migration is in progress:

- `src/config/monetization.ts` → `leaderboardPaywallEnabled: false`

RevenueCat integration is already wired in code and ready to activate when you switch paywall on.

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

4. **Native sync**
   - Run Capacitor sync after dependency/env updates:
     - `npx cap sync ios`
     - `npx cap sync android`

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
