#!/usr/bin/env node
/**
 * Seeds Firestore `promo_codes/FIN_S0` (idempotent merge).
 *
 * Usage (repo root):
 *   npm run seed:promo
 *   GCLOUD_PROJECT=... node scripts/seed-promo-code.js
 *   node scripts/seed-promo-code.js --dry-run
 *
 * Requires Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS.
 */
import {
  PROMO_CODES_COLLECTION,
  PROMO_DEFAULT_ATTRIBUTION_MONTHS,
  PROMO_DEFAULT_GRANT_DAYS,
} from '../functions/shared/constants.js';
import {
  initAdminFirestore,
  loadEnvLocal,
  resolveProjectId,
  ROOT_DIR,
} from './lib/firebaseAdminBootstrap.js';

const dryRun = process.argv.includes('--dry-run');

const SEED = {
  code: 'FIN_S0',
  coachId: 'coach_test_boss',
  grantDays: PROMO_DEFAULT_GRANT_DAYS,
  maxRedemptions: 100,
  redeemedCount: 0,
  isActive: true,
  redemptionDeadline: '2026-12-31T23:59:59.000Z',
  commissionRate: 0.5,
  attributionMonths: PROMO_DEFAULT_ATTRIBUTION_MONTHS,
};

async function main() {
  loadEnvLocal(ROOT_DIR);
  const projectId = resolveProjectId(ROOT_DIR);

  console.info(
    `[seed-promo-code] target=${PROMO_CODES_COLLECTION}/${SEED.code} project=${projectId ?? '(adc)'} dryRun=${dryRun}`
  );
  console.info(JSON.stringify(SEED, null, 2));

  if (dryRun) {
    console.info('[seed-promo-code] dry-run OK — no write');
    return;
  }

  const { db } = initAdminFirestore(ROOT_DIR);
  const ref = db.collection(PROMO_CODES_COLLECTION).doc(SEED.code);
  // WHY: Do not reset redeemedCount on re-seed — preserve live capacity counters.
  const existing = await ref.get();
  const payload = { ...SEED };
  if (existing.exists) {
    const prev = Number(existing.data()?.redeemedCount);
    if (Number.isFinite(prev) && prev >= 0) {
      payload.redeemedCount = Math.floor(prev);
    }
  }

  await ref.set(payload, { merge: true });
  console.info(`[seed-promo-code] write OK redeemedCount=${payload.redeemedCount}`);
}

main().catch((err) => {
  console.error('[seed-promo-code] failed', err);
  process.exit(1);
});
