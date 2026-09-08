import { describe, expect, it } from 'vitest';
import {
  parseGenesisEarlyBirdFromUserDoc,
  parseServerProFromUserDoc,
} from '../userEntitlementDoc';

describe('parseServerProFromUserDoc', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');

  it('parses camelCase active Pro with future expiry', () => {
    const parsed = parseServerProFromUserDoc(
      {
        subscriptionStatus: 'pro',
        proExpiresAt: '2099-01-01T00:00:00.000Z',
        planId: 'up_pro_monthly',
        isPro: true,
      },
      now
    );
    expect(parsed).toEqual({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      rcExpiresAt: '2099-01-01T00:00:00.000Z',
      promoExpiresAt: null,
      effectiveUntil: '2099-01-01T00:00:00.000Z',
      promoCreditMs: null,
      promoPaused: false,
      planId: 'up_pro_monthly',
    });
  });

  it('parses legacy snake_case and proExpiresAtMs fallback', () => {
    const ms = new Date('2099-01-01T00:00:00.000Z').getTime();
    const parsed = parseServerProFromUserDoc(
      {
        subscription_status: 'grace',
        pro_expires_at_ms: ms,
        plan_id: 'pro_monthly',
      },
      now
    );
    expect(parsed?.subscriptionStatus).toBe('grace');
    expect(parsed?.proExpiresAt).toBe(new Date(ms).toISOString());
    expect(parsed?.planId).toBe('pro_monthly');
  });

  it('returns null when subscription is free or expired', () => {
    expect(parseServerProFromUserDoc({ subscriptionStatus: 'free' }, now)).toBeNull();
    expect(
      parseServerProFromUserDoc(
        { subscriptionStatus: 'pro', proExpiresAt: '2020-01-01T00:00:00.000Z' },
        now
      )
    ).toBeNull();
  });

  it('keeps Pro when promo outlives RC billing', () => {
    const parsed = parseServerProFromUserDoc(
      {
        subscriptionStatus: 'pro',
        proExpiresAt: '2020-01-01T00:00:00.000Z',
        promoExpiresAt: '2099-06-01T00:00:00.000Z',
        planId: null,
      },
      now
    );
    expect(parsed?.proExpiresAt).toBe('2099-06-01T00:00:00.000Z');
    expect(parsed?.promoExpiresAt).toBe('2099-06-01T00:00:00.000Z');
    // WHY: Expired RC must not surface as store-billing mirror.
    expect(parsed?.rcExpiresAt).toBeNull();
  });

  it('prefers stacked effectiveUntil over max(store, promo)', () => {
    const parsed = parseServerProFromUserDoc(
      {
        subscriptionStatus: 'pro',
        proExpiresAt: '2026-07-01T00:00:00.000Z',
        promoExpiresAt: '2026-07-10T00:00:00.000Z',
        effectiveUntil: '2026-09-01T00:00:00.000Z',
        promoCreditMs: 50 * 24 * 60 * 60 * 1000,
        promoPaused: true,
        planId: 'up_pro_monthly',
      },
      now
    );
    expect(parsed?.proExpiresAt).toBe('2026-09-01T00:00:00.000Z');
    expect(parsed?.effectiveUntil).toBe('2026-09-01T00:00:00.000Z');
    expect(parsed?.rcExpiresAt).toBe('2026-07-01T00:00:00.000Z');
    expect(parsed?.promoPaused).toBe(true);
  });

  it('parses genesis early-bird mirror independently of Pro', () => {
    expect(
      parseGenesisEarlyBirdFromUserDoc({
        isGenesisEarlyBird: true,
        genesisSeatNumber: 42,
      })
    ).toEqual({ isGenesisEarlyBird: true, genesisSeatNumber: 42 });
    expect(
      parseGenesisEarlyBirdFromUserDoc({
        is_genesis_early_bird: true,
        genesis_seat_number: 3,
      })
    ).toEqual({ isGenesisEarlyBird: true, genesisSeatNumber: 3 });
    expect(parseGenesisEarlyBirdFromUserDoc({ subscriptionStatus: 'free' })).toEqual({
      isGenesisEarlyBird: false,
      genesisSeatNumber: null,
    });
  });
});
