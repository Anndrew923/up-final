import type { EntitlementState } from '../types/entitlement';
import { useEntitlementStore } from './entitlementStore';

/** Zustand selector — single shape for entitlement gate decisions. */
export function selectEntitlementState(
  s: ReturnType<typeof useEntitlementStore.getState>
): EntitlementState {
  return {
    purchaseStatus: s.purchaseStatus,
    subscriptionStatus: s.subscriptionStatus,
    isPro: s.isPro,
    proExpiresAt: s.proExpiresAt,
    planId: s.planId,
    lastCheckedAt: s.lastCheckedAt,
  };
}

/** Imperative snapshot for service callbacks outside React render. */
export function readEntitlementSnapshot(): EntitlementState {
  return selectEntitlementState(useEntitlementStore.getState());
}
