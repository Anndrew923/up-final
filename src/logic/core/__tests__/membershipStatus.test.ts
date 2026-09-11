import { describe, expect, it } from 'vitest';
import type { EntitlementState } from '../../../types/entitlement';
import {
  applyPromoGrant,
  applyStoreCleared,
  applyStoreEntitlement,
  MS_PER_DAY,
} from '../proExpiry';
import {
  formatLocalYmd,
  FREE_MEMBERSHIP_STATUS,
  remainingDaysFromMs,
  resolveMembershipStatus,
} from '../membershipStatus';

const T0 = Date.parse('2026-06-01T00:00:00.000Z');
const NOW = new Date(T0);
const GRANT_60D = 60 * MS_PER_DAY;
const MONTHLY_MS = 30 * MS_PER_DAY;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function buildEntitlement(overrides: Partial<EntitlementState> = {}): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'free',
    isPro: false,
    proExpiresAt: null,
    promoExpiresAt: null,
    effectiveUntil: null,
    promoCreditMs: null,
    promoPaused: false,
    planId: null,
    lastCheckedAt: null,
    proPurchaseCooldownUntil: null,
    isGenesisEarlyBird: false,
    genesisSeatNumber: null,
    ...overrides,
  };
}

describe('formatLocalYmd', () => {
  it('formats device-local YYYY/MM/DD without UTC ISO slice drift', () => {
    // Construct via local components so the wall-clock day is timezone-stable.
    const localEvening = new Date(2026, 7, 16, 22, 30, 0);
    expect(formatLocalYmd(localEvening)).toBe('2026/08/16');
    expect(formatLocalYmd(localEvening.toISOString())).toBe('2026/08/16');
  });

  it('returns null for invalid inputs', () => {
    expect(formatLocalYmd(null)).toBeNull();
    expect(formatLocalYmd('')).toBeNull();
    expect(formatLocalYmd('not-a-date')).toBeNull();
    expect(formatLocalYmd(Number.NaN)).toBeNull();
  });
});

describe('remainingDaysFromMs', () => {
  it('ceils a remaining 12-hour window to 1 day and never goes negative', () => {
    expect(remainingDaysFromMs(T0 + TWELVE_HOURS_MS, T0)).toBe(1);
    expect(remainingDaysFromMs(T0 - MS_PER_DAY, T0)).toBe(0);
  });
});

describe('resolveMembershipStatus', () => {
  it('degrades empty, expired, and elapsed stamps to free without remaining days', () => {
    expect(resolveMembershipStatus(buildEntitlement(), NOW)).toEqual(FREE_MEMBERSHIP_STATUS);

    const expired = buildEntitlement({
      subscriptionStatus: 'expired',
      isPro: false,
      proExpiresAt: '2026-05-01T00:00:00.000Z',
      promoExpiresAt: '2026-05-15T00:00:00.000Z',
      effectiveUntil: '2026-05-15T00:00:00.000Z',
    });
    expect(resolveMembershipStatus(expired, NOW)).toEqual(FREE_MEMBERSHIP_STATUS);
    expect(resolveMembershipStatus(expired, NOW).remainingDays).toBeNull();
  });

  it('projects a 60-day invite window as promo with local date and remaining days', () => {
    const snap = applyPromoGrant({}, GRANT_60D, T0);
    const view = resolveMembershipStatus(
      buildEntitlement({
        subscriptionStatus: 'pro',
        isPro: true,
        promoExpiresAt: snap.promoExpiresAt,
        promoCreditMs: snap.promoCreditMs,
        promoPaused: snap.promoPaused,
        effectiveUntil: snap.effectiveUntil,
      }),
      NOW
    );

    expect(view.kind).toBe('promo');
    expect(view.displayDate).toBe(formatLocalYmd(snap.effectiveUntilMs));
    expect(view.remainingDays).toBe(60);
    expect(view.promoPaused).toBe(false);
  });

  it('projects store billing from proExpiresAt, not stacked effectiveUntil', () => {
    const storeIso = '2026-07-01T00:00:00.000Z';
    const view = resolveMembershipStatus(
      buildEntitlement({
        subscriptionStatus: 'pro',
        isPro: true,
        proExpiresAt: storeIso,
        planId: 'pro_monthly_099',
      }),
      NOW
    );

    expect(view.kind).toBe('store');
    expect(view.displayDate).toBe(formatLocalYmd(storeIso));
    expect(view.remainingDays).toBeNull();
    expect(view.promoPaused).toBe(false);
  });

  it('keeps stacked gift credit paused and shows the store charge date', () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    const storeEnd = t10 + MONTHLY_MS;
    const stacked = applyStoreEntitlement(redeemed, storeEnd, t10);
    const view = resolveMembershipStatus(
      buildEntitlement({
        subscriptionStatus: 'pro',
        isPro: true,
        proExpiresAt: stacked.proExpiresAt,
        promoExpiresAt: stacked.promoExpiresAt,
        effectiveUntil: stacked.effectiveUntil,
        promoCreditMs: stacked.promoCreditMs,
        promoPaused: stacked.promoPaused,
      }),
      new Date(t10)
    );

    expect(view.kind).toBe('store');
    expect(view.displayDate).toBe(formatLocalYmd(storeEnd));
    expect(view.displayDate).not.toBe(formatLocalYmd(stacked.effectiveUntilMs));
    expect(view.remainingDays).toBeNull();
    expect(view.promoPaused).toBe(true);
  });

  it('returns promo after store lapses while gift credit remains', () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    const storeEnd = t10 + MONTHLY_MS;
    const purchased = applyStoreEntitlement(redeemed, storeEnd, t10);
    const lapsed = applyStoreCleared(purchased, storeEnd);
    const view = resolveMembershipStatus(
      buildEntitlement({
        subscriptionStatus: 'pro',
        isPro: true,
        proExpiresAt: lapsed.proExpiresAt,
        promoExpiresAt: lapsed.promoExpiresAt,
        effectiveUntil: lapsed.effectiveUntil,
        promoCreditMs: lapsed.promoCreditMs,
        promoPaused: lapsed.promoPaused,
      }),
      new Date(storeEnd)
    );

    expect(view.kind).toBe('promo');
    expect(view.displayDate).toBe(formatLocalYmd(lapsed.effectiveUntilMs));
    expect(view.remainingDays).toBe(50);
    expect(view.promoPaused).toBe(false);
  });

  it('ceils a 12-hour promo remainder to 1 day', () => {
    const expiryMs = T0 + TWELVE_HOURS_MS;
    const view = resolveMembershipStatus(
      buildEntitlement({
        subscriptionStatus: 'pro',
        isPro: true,
        promoExpiresAt: new Date(expiryMs).toISOString(),
        promoCreditMs: TWELVE_HOURS_MS,
        effectiveUntil: new Date(expiryMs).toISOString(),
      }),
      NOW
    );

    expect(view.kind).toBe('promo');
    expect(view.remainingDays).toBe(1);
    expect(view.displayDate).toBe(formatLocalYmd(expiryMs));
  });
});
