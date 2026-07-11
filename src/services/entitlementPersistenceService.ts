import type { EntitlementState } from '../types/entitlement';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

/** Legacy single-user key (pre–uid scoping). Read-only fallback before auth binds a uid. */
export const LEGACY_ENTITLEMENT_STORAGE_KEY = 'up.final.entitlement.v1';

const STORAGE_KEY_PREFIX = 'up.final.entitlement.v1';

/** Cached subset for local-first UI; `isPro` is recomputed on hydrate via `hasProAccess`. */
export type PersistedEntitlementSubset = Pick<
  EntitlementState,
  'purchaseStatus' | 'subscriptionStatus' | 'proExpiresAt' | 'planId' | 'isPro'
>;

function storageKeyForUid(uid?: string | null): string {
  return uid ? `${STORAGE_KEY_PREFIX}:${uid}` : LEGACY_ENTITLEMENT_STORAGE_KEY;
}

export function loadPersistedEntitlement(uid?: string | null): PersistedEntitlementSubset | null {
  const keys = uid
    ? [storageKeyForUid(uid), LEGACY_ENTITLEMENT_STORAGE_KEY]
    : [LEGACY_ENTITLEMENT_STORAGE_KEY];

  for (const key of keys) {
    const parsed = parseStoredEntitlement(safeGetItem(key));
    if (parsed) return parsed;
  }
  return null;
}

function parseStoredEntitlement(raw: string | null): PersistedEntitlementSubset | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedEntitlementSubset>;
    // WHY: Download-includes-Core — migrate legacy `none` so production users are not locked out.
    const purchaseStatus = 'owned';
    const subscriptionStatus =
      parsed.subscriptionStatus === 'pro' ||
      parsed.subscriptionStatus === 'grace' ||
      parsed.subscriptionStatus === 'expired'
        ? parsed.subscriptionStatus
        : 'free';
    return {
      purchaseStatus,
      subscriptionStatus,
      proExpiresAt: typeof parsed.proExpiresAt === 'string' ? parsed.proExpiresAt : null,
      planId: typeof parsed.planId === 'string' ? parsed.planId : null,
      isPro: parsed.isPro === true,
    };
  } catch {
    return null;
  }
}

export function savePersistedEntitlement(state: EntitlementState, uid?: string | null): void {
  const payload: PersistedEntitlementSubset = {
    purchaseStatus: state.purchaseStatus,
    subscriptionStatus: state.subscriptionStatus,
    proExpiresAt: state.proExpiresAt,
    planId: state.planId,
    isPro: state.isPro,
  };
  const key = storageKeyForUid(uid);
  safeSetItem(key, JSON.stringify(payload));
}
