import { describe, expect, it, beforeEach } from 'vitest';
import { useEntitlementStore } from '../entitlementStore';

describe('entitlementStore', () => {
  beforeEach(() => {
    useEntitlementStore.getState().resetEntitlement();
  });

  it('folds expired grace to expired and clears isPro', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    useEntitlementStore.getState().setSubscriptionStatus('grace');
    useEntitlementStore.getState().setProExpiry(past);

    const state = useEntitlementStore.getState();
    expect(state.subscriptionStatus).toBe('expired');
    expect(state.isPro).toBe(false);
  });

  it('keeps isPro true for active grace with future expiry', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    useEntitlementStore.getState().hydrateEntitlement({
      subscriptionStatus: 'grace',
      proExpiresAt: future,
    });

    expect(useEntitlementStore.getState().subscriptionStatus).toBe('grace');
    expect(useEntitlementStore.getState().isPro).toBe(true);
  });
});
