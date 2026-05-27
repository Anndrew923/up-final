import { hasCoreAccess, hasProAccess } from '../logic/core/entitlement';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { loadPersistedEntitlement } from './entitlementPersistenceService';
import {
  isRevenueCatConfiguredFromEnv,
  isRevenueCatNativeBillingAvailable,
  logInRevenueCatUser,
  purchaseRevenueCatPro,
  restoreRevenueCatPurchases,
  type RevenueCatEntitlementSnapshot,
} from './revenueCatService';

export type PurchaseProResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'core-required' | 'already-pro' | 'auth-required' | 'billing-unavailable' | 'failed';
    };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function applySimulatedProSnapshot(): void {
  const snapshot: RevenueCatEntitlementSnapshot = {
    active: true,
    productIdentifier: 'pro_monthly_099',
    expiresDate: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
  };
  useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
}

/**
 * Purchases Pro subscription using RevenueCat when configured on a native build.
 * Falls back to local simulation when RC keys are unset or on web (Phase 1 flow testing).
 */
export async function purchaseProSubscription(): Promise<PurchaseProResult> {
  const ent = useEntitlementStore.getState();
  if (!hasCoreAccess(ent)) {
    return { ok: false, reason: 'core-required' };
  }
  if (hasProAccess(ent) && ent.subscriptionStatus === 'pro') {
    return { ok: false, reason: 'already-pro' };
  }

  const userId = useAuthStore.getState().uid;
  if (!userId) {
    return { ok: false, reason: 'auth-required' };
  }

  if (!isRevenueCatConfiguredFromEnv() || !isRevenueCatNativeBillingAvailable()) {
    applySimulatedProSnapshot();
    return { ok: true };
  }

  try {
    await logInRevenueCatUser(userId);
    const snapshot = await purchaseRevenueCatPro(userId);
    if (!snapshot) {
      return { ok: false, reason: 'billing-unavailable' };
    }
    useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
  } catch {
    return { ok: false, reason: 'failed' };
  }

  return { ok: true };
}

export interface RestorePurchasesResult {
  restored: boolean;
  hadSnapshot: boolean;
  proActive: boolean;
}

/**
 * Restores purchases from RevenueCat on native when configured; otherwise uses local snapshot.
 */
export async function restorePurchasesFromDevice(): Promise<RestorePurchasesResult> {
  const userId = useAuthStore.getState().uid;
  if (userId && isRevenueCatNativeBillingAvailable()) {
    try {
      await logInRevenueCatUser(userId);
      const snapshot = await restoreRevenueCatPurchases(userId);
      if (!snapshot) {
        return { restored: false, hadSnapshot: false, proActive: false };
      }
      useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
      return {
        restored: true,
        hadSnapshot: true,
        proActive: snapshot.active,
      };
    } catch {
      return { restored: false, hadSnapshot: false, proActive: false };
    }
  }

  const snapshot = loadPersistedEntitlement(userId);
  if (!snapshot) {
    return { restored: false, hadSnapshot: false, proActive: false };
  }

  useEntitlementStore.getState().hydrateEntitlement(snapshot);

  const next = useEntitlementStore.getState();
  return {
    restored: true,
    hadSnapshot: true,
    proActive: hasProAccess(next),
  };
}
