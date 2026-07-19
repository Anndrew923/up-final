# Production security rollout

Deployment order is part of the access-control contract. Do not deploy Rules before canonical entitlement data exists.

1. Register web reCAPTCHA Enterprise and native App Check providers in Firebase.
2. Build Hosting with `npm run build:web`; this fails when the web App Check site key is absent.
3. Deploy the App Check-capable clients and confirm protected Callable requests in Firebase metrics.
4. In `functions/`, run `npm run migrate:pro-expiries` (dry run), resolve every failure, then run `npm run migrate:pro-expiries:apply`.
5. Verify active users have canonical `subscriptionStatus` and integer `proExpiresAtMs` fields.
6. Deploy Functions, then `firestore.rules` and `storage.rules`.
7. Smoke-test sign-in, Pro restore, leaderboard read/upload/avatar, structured backup/restore, and account deletion on web and each native platform.

App Check enforcement is intentionally global for deployed Callables. If a previously released client does not send App Check tokens, complete a monitored client rollout before deploying the Functions change.

Leaderboard scores are self-reported performance data with server-side schema, shard, range, quota, and entitlement enforcement. They are not evidence-verified athletic results; any future “verified” ranking tier must use a separate server-reviewed evidence contract.
