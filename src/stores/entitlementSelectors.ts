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
    promoExpiresAt: s.promoExpiresAt,
    effectiveUntil: s.effectiveUntil ?? null,
    promoCreditMs: s.promoCreditMs ?? null,
    promoPaused: s.promoPaused === true,
    planId: s.planId,
    lastCheckedAt: s.lastCheckedAt,
    proPurchaseCooldownUntil: s.proPurchaseCooldownUntil,
    isGenesisEarlyBird: s.isGenesisEarlyBird === true,
    genesisSeatNumber: s.genesisSeatNumber ?? null,
  };
}

/** Imperative snapshot for service callbacks outside React render. */
export function readEntitlementSnapshot(): EntitlementState {
  return selectEntitlementState(useEntitlementStore.getState());
}
