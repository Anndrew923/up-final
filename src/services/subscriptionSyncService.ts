import { httpsCallable } from 'firebase/functions';
import type { RevenueCatEntitlementSnapshot } from './revenueCatService';
import { getFirebaseAuth, getFirebaseFunctions } from './firebaseClient';

export type SyncProEntitlementSource = 'revenuecat' | 'client-simulation';

export type SyncProEntitlementResult =
  | { ok: true; proExpiresAt: string | null; planId: string }
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
    { ok: boolean; proExpiresAt?: string | null; planId?: string }
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
 * Writes Pro entitlement to Firestore + custom claims via Callable.
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
    if (!data?.ok) {
      return { ok: false, reason: 'verification-failed' };
    }
    await auth.currentUser?.getIdToken(true);
    return {
      ok: true,
      proExpiresAt: data.proExpiresAt ?? null,
      planId: data.planId ?? 'pro_monthly',
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
    if (code.includes('pro-not-active') || code.includes('revenuecat-verification')) {
      return { ok: false, reason: 'verification-failed' };
    }
    return { ok: false, reason: 'network' };
  }
}
