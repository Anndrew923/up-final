import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntitlementState } from '../../types/entitlement';

const memory = new Map<string, string>();

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => memory.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  safeRemoveItem: (key: string) => {
    memory.delete(key);
  },
}));

const { loadPersistedEntitlement, savePersistedEntitlement } =
  await import('../entitlementPersistenceService');

describe('entitlementPersistenceService', () => {
  beforeEach(() => {
    memory.clear();
  });

  afterEach(() => {
    memory.clear();
  });

  it('persists isPro with subscription fields', () => {
    const state: EntitlementState = {
      purchaseStatus: 'owned',
      subscriptionStatus: 'pro',
      isPro: true,
      proExpiresAt: '2026-12-01T00:00:00.000Z',
      planId: 'pro_monthly_099',
      lastCheckedAt: '2026-05-27T00:00:00.000Z',
    };
    savePersistedEntitlement(state, 'user-a');

    const loaded = loadPersistedEntitlement('user-a');
    expect(loaded?.subscriptionStatus).toBe('pro');
    expect(loaded?.isPro).toBe(true);
    expect(loaded?.proExpiresAt).toBe(state.proExpiresAt);
    expect(loaded?.purchaseStatus).toBe('owned');
  });

  it('migrates legacy purchaseStatus none to owned', () => {
    memory.set(
      'up.final.entitlement.v1:user-legacy',
      JSON.stringify({
        purchaseStatus: 'none',
        subscriptionStatus: 'free',
        isPro: false,
        proExpiresAt: null,
        planId: null,
      })
    );
    expect(loadPersistedEntitlement('user-legacy')?.purchaseStatus).toBe('owned');
  });

  it('scopes cache per uid', () => {
    savePersistedEntitlement(
      {
        purchaseStatus: 'owned',
        subscriptionStatus: 'pro',
        isPro: true,
        proExpiresAt: null,
        planId: 'pro_monthly_099',
        lastCheckedAt: null,
      },
      'user-a'
    );
    savePersistedEntitlement(
      {
        purchaseStatus: 'owned',
        subscriptionStatus: 'free',
        isPro: false,
        proExpiresAt: null,
        planId: null,
        lastCheckedAt: null,
      },
      'user-b'
    );

    expect(loadPersistedEntitlement('user-a')?.subscriptionStatus).toBe('pro');
    expect(loadPersistedEntitlement('user-b')?.subscriptionStatus).toBe('free');
  });
});
