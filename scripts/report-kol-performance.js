#!/usr/bin/env node
/**
 * KOL / coach promo performance report (terminal table).
 *
 * Usage (repo root):
 *   npm run report:kol
 *   GCLOUD_PROJECT=... node scripts/report-kol-performance.js
 *
 * Sources: promo_codes × user_attributions × commission_logs
 * Requires Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS.
 */
import {
  COMMISSION_LOGS_COLLECTION,
  PROMO_CODES_COLLECTION,
  USER_ATTRIBUTIONS_COLLECTION,
} from '../functions/shared/constants.js';
import {
  isPromoRedemptionCapacityExhausted,
  resolveMaxRedemptions,
} from '../functions/subscription/promoRedeemGuards.js';
import { initAdminFirestore } from './lib/firebaseAdminBootstrap.js';

function pad(value, width) {
  const s = String(value ?? '');
  if (s.length >= width) return s.slice(0, width);
  return s + ' '.repeat(width - s.length);
}

function resolveStatus(promo, nowMs = Date.now()) {
  const isActive = promo.isActive !== false && promo.is_active !== false;
  if (!isActive) return 'inactive';
  const deadlineRaw = promo.redemptionDeadline ?? promo.redemption_deadline ?? null;
  if (deadlineRaw) {
    const ms = Date.parse(String(deadlineRaw));
    if (Number.isFinite(ms) && ms < nowMs) return 'expired';
  }
  if (isPromoRedemptionCapacityExhausted(promo)) return 'exhausted';
  return 'active';
}

async function main() {
  const { projectId, db } = initAdminFirestore();

  const [promoSnap, attrSnap, commissionSnap] = await Promise.all([
    db.collection(PROMO_CODES_COLLECTION).get(),
    db.collection(USER_ATTRIBUTIONS_COLLECTION).get(),
    db.collection(COMMISSION_LOGS_COLLECTION).get(),
  ]);

  /** @type {Map<string, Set<string>>} */
  const redemptionsByCode = new Map();
  for (const doc of attrSnap.docs) {
    const data = doc.data() ?? {};
    const code =
      typeof data.promoCode === 'string' ? data.promoCode.trim().toUpperCase() : '';
    if (!code) continue;
    if (!redemptionsByCode.has(code)) redemptionsByCode.set(code, new Set());
    redemptionsByCode.get(code).add(doc.id);
  }

  /** @type {Map<string, Set<string>>} */
  const paidByCode = new Map();
  for (const doc of commissionSnap.docs) {
    const data = doc.data() ?? {};
    const code =
      typeof data.promoCode === 'string' ? data.promoCode.trim().toUpperCase() : '';
    if (!code) continue;
    const uid = typeof data.uid === 'string' ? data.uid : '';
    if (!uid) continue;
    if (!paidByCode.has(code)) paidByCode.set(code, new Set());
    paidByCode.get(code).add(uid);
  }

  const rows = promoSnap.docs.map((doc) => {
    const promo = doc.data() ?? {};
    const code = (typeof promo.code === 'string' ? promo.code : doc.id)
      .trim()
      .toUpperCase();
    const coachUid =
      typeof promo.coachId === 'string'
        ? promo.coachId
        : typeof promo.coach_id === 'string'
          ? promo.coach_id
          : '—';
    const max = resolveMaxRedemptions(promo);
    const maxLabel = max == null ? '∞' : String(max);
    // WHY: user_attributions is people SSOT; redeemedCount is capacity counter (may drift).
    const redemptions = redemptionsByCode.get(code)?.size ?? 0;
    const paid = paidByCode.get(code)?.size ?? 0;
    return {
      code,
      coachUid,
      redemptions,
      max: maxLabel,
      status: resolveStatus(promo),
      paid,
    };
  });

  rows.sort((a, b) => b.redemptions - a.redemptions || a.code.localeCompare(b.code));

  console.info(
    `[report-kol] project=${projectId ?? '(adc)'} codes=${rows.length} attributions=${attrSnap.size} commissions=${commissionSnap.size}`
  );
  console.info('');
  const headers = [
    pad('KOL Code', 14),
    pad('Coach UID', 28),
    pad('Redemptions', 12),
    pad('Max', 6),
    pad('Status', 10),
    pad('Paid Conv.', 10),
  ];
  console.info(headers.join(' | '));
  console.info(headers.map((h) => '-'.repeat(h.length)).join('-+-'));

  if (rows.length === 0) {
    console.info('(no promo_codes documents)');
    return;
  }

  for (const row of rows) {
    console.info(
      [
        pad(row.code, 14),
        pad(row.coachUid, 28),
        pad(row.redemptions, 12),
        pad(row.max, 6),
        pad(row.status, 10),
        pad(row.paid, 10),
      ].join(' | ')
    );
  }
}

main().catch((err) => {
  console.error('[report-kol] failed', err);
  process.exit(1);
});
