import type { EntitlementState } from '../types/entitlement';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

const STORAGE_KEY = 'up.final.entitlement.v1';

export type PersistedEntitlementSubset = Pick<
  EntitlementState,
  'purchaseStatus' | 'subscriptionStatus' | 'proExpiresAt' | 'planId'
>;

export function loadPersistedEntitlement(): PersistedEntitlementSubset | null {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedEntitlementSubset;
  } catch {
    return null;
  }
}

export function savePersistedEntitlement(state: EntitlementState): void {
  const payload: PersistedEntitlementSubset = {
    purchaseStatus: state.purchaseStatus,
    subscriptionStatus: state.subscriptionStatus,
    proExpiresAt: state.proExpiresAt,
    planId: state.planId,
  };
  safeSetItem(STORAGE_KEY, JSON.stringify(payload));
}
