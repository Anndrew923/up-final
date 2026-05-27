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

  it('applyRevenueCatEntitlement sets pro and expiry from snapshot', () => {
    const expires = new Date(Date.now() + 86_400_000).toISOString();
    useEntitlementStore.getState().applyRevenueCatEntitlement({
      active: true,
      productIdentifier: 'rc_monthly_sandbox',
      expiresDate: expires,
    });

    const state = useEntitlementStore.getState();
    expect(state.subscriptionStatus).toBe('pro');
    expect(state.isPro).toBe(true);
    expect(state.planId).toBe('rc_monthly_sandbox');
    expect(state.proExpiresAt).toBe(expires);
  });

  it('bindEntitlementSession clears pro carryover for a new uid', () => {
    useEntitlementStore.getState().applyRevenueCatEntitlement({
      active: true,
      productIdentifier: 'pro_monthly_099',
      expiresDate: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(useEntitlementStore.getState().isPro).toBe(true);

    useEntitlementStore.getState().bindEntitlementSession('new-user');
    expect(useEntitlementStore.getState().isPro).toBe(false);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('free');
  });
});
