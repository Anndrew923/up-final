import { describe, expect, it, vi } from 'vitest';
import { shouldBlockStructuredUserSync } from '../../logic/core/entitlement';
import type { EntitlementState } from '../../types/entitlement';
import { canRunStructuredUserSync } from '../userStructuredSyncService';

vi.mock('../firebaseClient', () => ({
  getFirestoreDb: vi.fn(() => null),
  getCurrentFirebaseUser: vi.fn(() => null),
}));

describe('userStructuredSyncService gates', () => {
  it('canRunStructuredUserSync is false without Firestore session', () => {
    const ent: EntitlementState = {
      purchaseStatus: 'owned',
      subscriptionStatus: 'pro',
      isPro: true,
      proExpiresAt: null,
      planId: 'pro_monthly_099',
      lastCheckedAt: null,
    };
    expect(shouldBlockStructuredUserSync(ent)).toBe(false);
    expect(canRunStructuredUserSync(ent)).toBe(false);
  });
});
