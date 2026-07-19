import { hasCoreAccess, hasProAccess } from '../logic/core/entitlement';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { loadPersistedEntitlement } from './entitlementPersistenceService';
import { hapticService } from './hapticService';
import {
  isRevenueCatConfiguredFromEnv,
  isRevenueCatNativeBillingAvailable,
  logInRevenueCatUser,
  purchaseRevenueCatPro,
  restoreRevenueCatPurchases,
  type RevenueCatEntitlementSnapshot,
} from './revenueCatService';
import { syncProEntitlementToServer } from './subscriptionSyncService';

export type PurchaseProResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'core-required' | 'already-pro' | 'auth-required' | 'billing-unavailable' | 'failed';
    };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function buildSimulatedProSnapshot(): RevenueCatEntitlementSnapshot {
  return {
    active: true,
    productIdentifier: 'pro_monthly_099',
    expiresDate: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
  };
}

function applySimulatedProSnapshot(): RevenueCatEntitlementSnapshot {
  const snapshot = buildSimulatedProSnapshot();
  useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
  return snapshot;
}

function rollbackLocalProSubscription(): void {
  useEntitlementStore.getState().applyRevenueCatEntitlement({
    active: false,
    productIdentifier: null,
    expiresDate: null,
  });
}

async function activateProOnServer(
  source: 'revenuecat' | 'client-simulation',
  snapshot: RevenueCatEntitlementSnapshot | null
): Promise<boolean> {
  const sync = await syncProEntitlementToServer({ source, snapshot });
  return sync.ok && sync.active === Boolean(snapshot?.active);
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
    const snapshot = applySimulatedProSnapshot();
    const synced = await activateProOnServer('client-simulation', snapshot);
    if (!synced) {
      rollbackLocalProSubscription();
      return { ok: false, reason: 'failed' };
    }
    void hapticService.triggerProPurchaseCelebration();
    return { ok: true };
  }

  try {
    await logInRevenueCatUser(userId);
    const snapshot = await purchaseRevenueCatPro(userId);
    if (!snapshot) {
      return { ok: false, reason: 'billing-unavailable' };
    }
    useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
    if (!snapshot.active) {
      return { ok: false, reason: 'failed' };
    }
    const synced = await activateProOnServer('revenuecat', snapshot);
    if (!synced) {
      rollbackLocalProSubscription();
      return { ok: false, reason: 'failed' };
    }
    void hapticService.triggerProPurchaseCelebration();
    return { ok: true };
  } catch {
    rollbackLocalProSubscription();
    return { ok: false, reason: 'failed' };
  }
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
      // WHY: An inactive restore is also authoritative and must reach the
      // server so stale Firestore/custom-claim Pro access is revoked.
      const reconciled = await activateProOnServer('revenuecat', snapshot);
      if (!reconciled) {
        return { restored: false, hadSnapshot: true, proActive: snapshot.active };
      }
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
