import {
  hasCoreAccess,
  hasProAccess,
  isValidActiveProExpiry,
  shouldBlockProReconcileDowngrade,
} from '../logic/core/entitlement';
import { isProductAlreadyPurchasedError } from '../logic/core/revenueCatPurchaseErrors';
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
import {
  syncProEntitlementToServer,
  type SyncProEntitlementResult,
} from './subscriptionSyncService';

export type PurchaseProResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'core-required'
        | 'already-pro'
        | 'auth-required'
        | 'billing-unavailable'
        | 'no-receipt'
        | 'invalid-expiry'
        | 'sync-failed'
        | 'failed';
    };

/** Discrete restore outcomes for precise Settings / purchase UI copy. */
export type RestorePurchasesOutcome =
  | 'restored'
  | 'no_receipt'
  | 'invalid_expiry'
  | 'sync_failed'
  | 'failed';

export interface RestorePurchasesResult {
  outcome: RestorePurchasesOutcome;
  proActive: boolean;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Retry cadence while awaiting Firestore hard-sync — RC REST often lags Play purchase. */
const SERVER_SYNC_RETRY_DELAYS_MS = [1000, 3000, 8000] as const;

function buildSimulatedProSnapshot(): RevenueCatEntitlementSnapshot {
  return {
    active: true,
    productIdentifier: 'pro_monthly_099',
    expiresDate: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
  };
}

/**
 * WHY: Require active + future expiry before any hard-sync attempt so we never
 * celebrate a charge that cannot produce a durable `proExpiresAt` on Firestore.
 */
function isHardSyncEligibleSnapshot(snapshot: RevenueCatEntitlementSnapshot): boolean {
  return snapshot.active === true && isValidActiveProExpiry(snapshot.expiresDate);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type ConfirmedServerPro = {
  ok: true;
  active: true;
  subscriptionStatus: 'pro' | 'grace';
  proExpiresAt: string;
  planId: string | null;
};

function isConfirmedServerPro(sync: SyncProEntitlementResult): sync is ConfirmedServerPro {
  return (
    sync.ok === true &&
    sync.active === true &&
    (sync.subscriptionStatus === 'pro' || sync.subscriptionStatus === 'grace') &&
    typeof sync.proExpiresAt === 'string' &&
    isValidActiveProExpiry(sync.proExpiresAt)
  );
}

function restoreOk(proActive: boolean): RestorePurchasesResult {
  return { outcome: 'restored', proActive };
}

function restoreFail(
  outcome: Exclude<RestorePurchasesOutcome, 'restored'>
): RestorePurchasesResult {
  return { outcome, proActive: false };
}

/**
 * Blocking hard-sync with bounded retries.
 * WHY: Require explicit server-side Firestore write confirmation before unlocking
 * local UI to keep Firestore as the single source of truth and avoid stale RC snapshot races.
 */
async function awaitHardSyncProEntitlement(
  source: 'revenuecat' | 'client-simulation',
  snapshot: RevenueCatEntitlementSnapshot,
  purchaserUid: string
): Promise<ConfirmedServerPro | null> {
  const sessionMatches = () => useAuthStore.getState().uid === purchaserUid;

  if (!sessionMatches()) return null;

  const first = await syncProEntitlementToServer({ source, snapshot, intent: 'activate' });
  if (isConfirmedServerPro(first)) return first;

  for (const delayMs of SERVER_SYNC_RETRY_DELAYS_MS) {
    await sleep(delayMs);
    if (!sessionMatches()) return null;
    const next = await syncProEntitlementToServer({ source, snapshot, intent: 'activate' });
    if (isConfirmedServerPro(next)) return next;
  }

  return null;
}

function commitConfirmedProLocally(
  sync: ConfirmedServerPro,
  options: { armPurchaseCooldown: boolean }
): void {
  useEntitlementStore.getState().commitServerProEntitlement({
    subscriptionStatus: sync.subscriptionStatus,
    proExpiresAt: sync.proExpiresAt,
    planId: sync.planId,
    armPurchaseCooldown: options.armPurchaseCooldown,
  });
}

function mapRestoreFailureToPurchaseReason(
  outcome: RestorePurchasesOutcome
): PurchaseProResult {
  if (outcome === 'no_receipt') {
    return { ok: false, reason: 'no-receipt' };
  }
  if (outcome === 'invalid_expiry') {
    return { ok: false, reason: 'invalid-expiry' };
  }
  if (outcome === 'sync_failed') {
    return { ok: false, reason: 'sync-failed' };
  }
  return { ok: false, reason: 'failed' };
}

/**
 * WHY: Automatically route ALREADY_PURCHASED store error to restorePurchases to prevent
 * deadlocks when app re-installs match store purchase state but lack local/Firestore snapshot.
 */
async function restoreAfterAlreadyPurchased(): Promise<PurchaseProResult> {
  const restored = await restorePurchasesFromDevice();
  if (restored.outcome === 'restored' && restored.proActive) {
    void hapticService.triggerProPurchaseCelebration();
    return { ok: true };
  }
  return mapRestoreFailureToPurchaseReason(restored.outcome);
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
    const snapshot = buildSimulatedProSnapshot();
    // WHY: Simulation is not a store receipt — only unlock after Firestore accepts the grant.
    const synced = await awaitHardSyncProEntitlement('client-simulation', snapshot, userId);
    if (!synced) {
      return { ok: false, reason: 'failed' };
    }
    commitConfirmedProLocally(synced, { armPurchaseCooldown: true });
    void hapticService.triggerProPurchaseCelebration();
    return { ok: true };
  }

  try {
    await logInRevenueCatUser(userId);
    const snapshot = await purchaseRevenueCatPro(userId);
    if (!snapshot) {
      return { ok: false, reason: 'billing-unavailable' };
    }
    // WHY: Rigid expiry gate — active without expirationDate must not optimistically unlock UI.
    if (!isHardSyncEligibleSnapshot(snapshot)) {
      return { ok: false, reason: 'invalid-expiry' };
    }

    const synced = await awaitHardSyncProEntitlement('revenuecat', snapshot, userId);
    if (!synced) {
      // WHY: Charge may have succeeded, but Firestore SSOT was not confirmed — keep UI locked
      // and let restore / webhook complete the grant instead of fake-unlocking cloud/Dyno.
      return { ok: false, reason: 'sync-failed' };
    }

    commitConfirmedProLocally(synced, { armPurchaseCooldown: true });
    void hapticService.triggerProPurchaseCelebration();
    return { ok: true };
  } catch (error) {
    if (isProductAlreadyPurchasedError(error)) {
      return restoreAfterAlreadyPurchased();
    }
    return { ok: false, reason: 'failed' };
  }
}

/**
 * Restores purchases from RevenueCat on native when configured; otherwise uses local snapshot.
 */
export async function restorePurchasesFromDevice(): Promise<RestorePurchasesResult> {
  const userId = useAuthStore.getState().uid;
  if (userId && isRevenueCatNativeBillingAvailable()) {
    try {
      // WHY: Re-bind RC app user to the current Firebase uid before restore so Play
      // receipts transfer onto the signed-in identity after reinstall / account switch.
      await logInRevenueCatUser(userId);
      const snapshot = await restoreRevenueCatPurchases(userId);
      if (!snapshot) {
        return restoreFail('no_receipt');
      }

      if (snapshot.active) {
        if (!isHardSyncEligibleSnapshot(snapshot)) {
          return restoreFail('invalid_expiry');
        }
        // WHY: Restore activation also requires Firestore confirmation before local Pro unlock.
        const synced = await awaitHardSyncProEntitlement('revenuecat', snapshot, userId);
        if (!synced) {
          return restoreFail('sync_failed');
        }
        // WHY: Restore is not a fresh purchase — do not arm the post-charge cooldown shield.
        commitConfirmedProLocally(synced, { armPurchaseCooldown: false });
        return restoreOk(true);
      }

      const current = useEntitlementStore.getState();
      // WHY: Cooldown must protect Firestore SSOT too — local-only guard would still let
      // reconcile wipe the just-written server grant after a purchase race.
      if (shouldBlockProReconcileDowngrade(current, snapshot.active)) {
        return restoreOk(hasProAccess(current));
      }

      useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
      const reconciled = await syncProEntitlementToServer({
        source: 'revenuecat',
        snapshot,
        intent: 'reconcile',
      });
      if (!reconciled.ok) {
        return restoreFail('sync_failed');
      }
      return restoreFail('no_receipt');
    } catch {
      return restoreFail('failed');
    }
  }

  const snapshot = loadPersistedEntitlement(userId);
  if (!snapshot) {
    return restoreFail('no_receipt');
  }

  useEntitlementStore.getState().hydrateEntitlement(snapshot);

  const next = useEntitlementStore.getState();
  const proActive = hasProAccess(next);
  return proActive ? restoreOk(true) : restoreFail('no_receipt');
}

/**
 * Bind RevenueCat to the signed-in Firebase uid (idempotent).
 * WHY: Auth bootstrap must always align RC identity — purchase/restore alone is too late
 * after reinstall when Play already owns the SKU under the Google account.
 */
export async function bindRevenueCatIdentityForSession(uid: string | null): Promise<void> {
  if (!uid || !isRevenueCatNativeBillingAvailable()) return;
  try {
    await logInRevenueCatUser(uid);
  } catch {
    // Non-fatal — purchase/restore/refresh will retry logIn.
  }
}
