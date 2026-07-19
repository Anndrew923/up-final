import { httpsCallable } from 'firebase/functions';
import type { RevenueCatEntitlementSnapshot } from './revenueCatService';
import { getFirebaseAuth, getFirebaseFunctions } from './firebaseClient';

export type SyncProEntitlementSource = 'revenuecat' | 'client-simulation';

export type SyncProEntitlementResult =
  | {
      ok: true;
      active: boolean;
      subscriptionStatus: 'pro' | 'grace' | 'free';
      proExpiresAt: string | null;
      planId: string | null;
    }
  | {
      ok: false;
      reason:
        | 'unavailable'
        | 'auth-required'
        | 'core-required'
        | 'verification-failed'
        | 'simulation-denied'
        | 'network';
    };

export interface SyncProEntitlementInput {
  source: SyncProEntitlementSource;
  snapshot?: RevenueCatEntitlementSnapshot | null;
}

let syncProFn: ReturnType<
  typeof httpsCallable<
    {
      source: SyncProEntitlementSource;
      proExpiresAt?: string | null;
      planId?: string | null;
    },
    {
      ok: boolean;
      active?: boolean;
      subscriptionStatus?: 'pro' | 'grace' | 'free';
      proExpiresAt?: string | null;
      planId?: string | null;
    }
  >
> | null = null;

function getSyncProCallable() {
  if (!syncProFn) {
    const functions = getFirebaseFunctions();
    if (!functions) return null;
    syncProFn = httpsCallable(functions, 'syncProSubscription');
  }
  return syncProFn;
}

/**
 * Writes the authoritative Pro entitlement to Firestore via Callable.
 * WHY: Local RC snapshot alone cannot satisfy dynoIntelChat server gates.
 */
export async function syncProEntitlementToServer(
  input: SyncProEntitlementInput
): Promise<SyncProEntitlementResult> {
  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    return { ok: false, reason: 'auth-required' };
  }

  const callable = getSyncProCallable();
  if (!callable) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const result = await callable({
      source: input.source,
      proExpiresAt: input.snapshot?.expiresDate ?? null,
      planId: input.snapshot?.productIdentifier ?? null,
    });
    const data = result.data;
    if (
      !data?.ok ||
      typeof data.active !== 'boolean' ||
      (data.subscriptionStatus !== 'pro' &&
        data.subscriptionStatus !== 'grace' &&
        data.subscriptionStatus !== 'free')
    ) {
      return { ok: false, reason: 'verification-failed' };
    }
    if (data.active && (typeof data.proExpiresAt !== 'string' || !data.proExpiresAt)) {
      return { ok: false, reason: 'verification-failed' };
    }
    return {
      ok: true,
      active: data.active,
      subscriptionStatus: data.subscriptionStatus,
      proExpiresAt: data.proExpiresAt ?? null,
      planId: data.planId ?? null,
    };
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : '';
    if (code.includes('simulation-not-allowed')) {
      return { ok: false, reason: 'simulation-denied' };
    }
    if (code.includes('core-required')) {
      return { ok: false, reason: 'core-required' };
    }
    if (
      code.includes('pro-not-active') ||
      code.includes('revenuecat-verification') ||
      code.includes('failed-precondition')
    ) {
      return { ok: false, reason: 'verification-failed' };
    }
    return { ok: false, reason: 'network' };
  }
}
