# Coach promo code seed (ops)

Create documents in Firestore collection `promo_codes` (doc id = uppercase code):

```json
{
  "code": "FIN_S0",
  "coachId": "<coach-firebase-uid>",
  "isActive": true,
  "redemptionDeadline": "2026-12-31T23:59:59.000Z",
  "grantDays": 60,
  "commissionRate": 0.5,
  "attributionMonths": 12
}
```

Clients never read/write this collection — only Callable `redeemPromoCode` (Admin SDK).

Related collections (Admin SDK only):

- `user_attributions/{uid}` — one redeem per user (written atomically with `users.promoExpiresAt`)
- `commission_logs/{revenueCatEventId}` — webhook idempotent ledger (`price * 0.85 * coachRate`)

## Commission event scope (intentional)

Webhook ingest records coach share only for RevenueCat:

- `INITIAL_PURCHASE`
- `RENEWAL`

`PRODUCT_CHANGE` (e.g. monthly → annual upgrade) is **not** logged in P0. If store upgrade emits only `PRODUCT_CHANGE` without a priced `RENEWAL`, that delta is platform revenue until a follow-up handles proration events.

## Deploy checklist

```bash
npx firebase deploy --only functions:redeemPromoCode,functions:revenueCatWebhook,functions:syncProSubscription,firestore:rules
```
