import { hasCoreAccess, hasProAccess } from '../logic/core/entitlement';
import { useEntitlementStore } from '../stores/entitlementStore';
import { loadPersistedEntitlement } from './entitlementPersistenceService';

export type PurchaseProResult =
  | { ok: true }
  | { ok: false; reason: 'core-required' | 'already-pro' };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Web / P1: simulates a successful Pro monthly purchase.
 * Native stores (IAP) would call the same Zustand hydrates after receipt validation.
 */
export function purchaseProSubscription(): PurchaseProResult {
  const ent = useEntitlementStore.getState();
  if (!hasCoreAccess(ent)) {
    return { ok: false, reason: 'core-required' };
  }
  if (hasProAccess(ent) && ent.subscriptionStatus === 'pro') {
    return { ok: false, reason: 'already-pro' };
  }

  useEntitlementStore.getState().hydrateEntitlement({
    subscriptionStatus: 'pro',
    planId: 'pro_monthly_099',
    proExpiresAt: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
  });

  return { ok: true };
}

export interface RestorePurchasesResult {
  restored: boolean;
  hadSnapshot: boolean;
  proActive: boolean;
}

/**
 * Reloads persisted subscription state from device storage (simulates Store restore).
 */
export function restorePurchasesFromDevice(): RestorePurchasesResult {
  const snapshot = loadPersistedEntitlement();
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
