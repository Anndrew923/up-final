import { describe, expect, it } from 'vitest';
import { useAuthStore } from '../../stores/authStore';
import { useEntitlementStore } from '../../stores/entitlementStore';
import { purchaseProSubscription, restorePurchasesFromDevice } from '../subscriptionService';

describe('subscription service', () => {
  it('requires core entitlement before purchase', async () => {
    useEntitlementStore.getState().resetEntitlement();
    useAuthStore.setState({
      status: 'signed-in',
      uid: 'tester',
      displayName: 'Tester',
      email: 'tester@example.com',
      firebaseDisplayName: 'Tester',
      photoURL: null,
      isAnonymous: false,
    });

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('core-required');
    }
  });

  it('requires signed-in identity when purchasing', async () => {
    useEntitlementStore.getState().hydrateEntitlement({
      purchaseStatus: 'owned',
      subscriptionStatus: 'free',
      planId: 'core_lifetime_099',
      proExpiresAt: null,
    });
    useAuthStore.getState().setSignedOut();

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('auth-required');
    }
  });

  it('uses local simulation fallback when RC env keys are unset', async () => {
    useEntitlementStore.getState().hydrateEntitlement({
      purchaseStatus: 'owned',
      subscriptionStatus: 'free',
      planId: 'core_lifetime_099',
      proExpiresAt: null,
    });
    useAuthStore.setState({
      status: 'signed-in',
      uid: 'tester',
      displayName: 'Tester',
      email: 'tester@example.com',
      firebaseDisplayName: 'Tester',
      photoURL: null,
      isAnonymous: false,
    });

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(true);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('pro');
  });

  it('returns empty restore result when no provider and no snapshot', async () => {
    const restored = await restorePurchasesFromDevice();
    expect(restored.hadSnapshot).toBe(false);
    expect(restored.proActive).toBe(false);
  });
});

