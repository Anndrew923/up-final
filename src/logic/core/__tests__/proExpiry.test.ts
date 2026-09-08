import { describe, expect, it } from 'vitest';
import {
  MS_PER_DAY,
  applyPromoGrant,
  applyStoreCleared,
  applyStoreEntitlement,
  isPromoExpiryActive,
  remainingPromoCreditMs,
  resolveEffectiveProExpiryMs,
} from '../proExpiry';

const T0 = Date.parse('2026-06-01T00:00:00.000Z');
const GRANT_60D = 60 * MS_PER_DAY;
const MONTHLY_MS = 30 * MS_PER_DAY;
const ANNUAL_MS = 365 * MS_PER_DAY;

describe('proExpiry credit stacking', () => {
  it('falls back to max(store, promo) when credit fields are absent', () => {
    const ms = resolveEffectiveProExpiryMs({
      proExpiresAt: '2026-06-01T00:00:00.000Z',
      promoExpiresAt: '2026-07-01T00:00:00.000Z',
    });
    expect(ms).toBe(Date.parse('2026-07-01T00:00:00.000Z'));
  });

  it('prefers persisted effectiveUntil over max()', () => {
    const stacked = Date.parse('2026-09-01T00:00:00.000Z');
    expect(
      resolveEffectiveProExpiryMs({
        proExpiresAt: '2026-07-01T00:00:00.000Z',
        promoExpiresAt: '2026-07-10T00:00:00.000Z',
        effectiveUntilMs: stacked,
      })
    ).toBe(stacked);
  });

  it('keeps credit active during store pause even after gift calendar date', () => {
    const t10 = T0 + 10 * MS_PER_DAY;
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const purchased = applyStoreEntitlement(redeemed, t10 + ANNUAL_MS, t10);
    const afterGiftCalendar = t10 + 51 * MS_PER_DAY;
    expect(isPromoExpiryActive(purchased.promoExpiresAt, new Date(afterGiftCalendar))).toBe(false);
    expect(isPromoExpiryActive(purchased, new Date(afterGiftCalendar))).toBe(true);
  });

  it('case 1: pure redeem grants 60 days from now', () => {
    const snap = applyPromoGrant({}, GRANT_60D, T0);
    expect(snap.promoCreditMs).toBe(GRANT_60D);
    expect(snap.promoPaused).toBe(false);
    expect(snap.effectiveUntilMs).toBe(T0 + GRANT_60D);
    expect(resolveEffectiveProExpiryMs(snap, T0)).toBe(T0 + GRANT_60D);
  });

  it('case 2: day-10 purchase stacks remaining 50d onto store expiry', () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    expect(remainingPromoCreditMs(redeemed, t10)).toBe(50 * MS_PER_DAY);

    const monthlyStore = t10 + MONTHLY_MS;
    const monthly = applyStoreEntitlement(redeemed, monthlyStore, t10);
    expect(monthly.promoCreditMs).toBe(50 * MS_PER_DAY);
    expect(monthly.promoPaused).toBe(true);
    expect(monthly.effectiveUntilMs).toBe(monthlyStore + 50 * MS_PER_DAY);

    const annualStore = t10 + ANNUAL_MS;
    const annual = applyStoreEntitlement(redeemed, annualStore, t10);
    expect(annual.effectiveUntilMs).toBe(annualStore + 50 * MS_PER_DAY);
  });

  it('case 3: renewals advance store only and do not re-add credit', () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    const purchased = applyStoreEntitlement(redeemed, t10 + MONTHLY_MS, t10);
    const frozen = purchased.promoCreditMs;

    const t40 = t10 + MONTHLY_MS;
    const renewedStore = t40 + MONTHLY_MS;
    const renewed = applyStoreEntitlement(purchased, renewedStore, t40);
    expect(renewed.promoCreditMs).toBe(frozen);
    expect(renewed.effectiveUntilMs).toBe(renewedStore + frozen);
  });

  it('case 4: after store lapses, remaining credit continues from now', () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    const storeEnd = t10 + MONTHLY_MS;
    const purchased = applyStoreEntitlement(redeemed, storeEnd, t10);
    const lapsed = applyStoreCleared(purchased, storeEnd);
    expect(lapsed.promoPaused).toBe(false);
    expect(lapsed.promoCreditMs).toBe(50 * MS_PER_DAY);
    expect(lapsed.effectiveUntilMs).toBe(storeEnd + 50 * MS_PER_DAY);
  });

  it('mid-window cancel unpauses frozen credit from now without re-adding store days', () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    const storeEnd = t10 + MONTHLY_MS;
    const purchased = applyStoreEntitlement(redeemed, storeEnd, t10);
    const t20 = T0 + 20 * MS_PER_DAY;
    const cancelled = applyStoreCleared(purchased, t20);
    expect(cancelled.promoCreditMs).toBe(50 * MS_PER_DAY);
    expect(cancelled.effectiveUntilMs).toBe(t20 + 50 * MS_PER_DAY);
    expect(cancelled.proExpiresAt).toBeNull();
  });
});
