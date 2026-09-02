import { describe, expect, it } from 'vitest';
import { parseServerProFromUserDoc } from '../userEntitlementDoc';

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
});
