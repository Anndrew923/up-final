import { create } from 'zustand';
import { hasProAccess } from '../logic/core/entitlement';
import type { EntitlementState, PurchaseStatus, SubscriptionStatus } from '../types/entitlement';

export interface EntitlementStore extends EntitlementState {
  hydrateEntitlement(payload: Partial<EntitlementState>): void;
  setPurchaseStatus(status: PurchaseStatus): void;
  setSubscriptionStatus(status: SubscriptionStatus): void;
  setProExpiry(iso: string | null): void;
  refreshEntitlement(): Promise<void>;
  resetEntitlement(): void;
}

const initialState: EntitlementState = {
  purchaseStatus: 'none',
  subscriptionStatus: 'free',
  isPro: false,
  proExpiresAt: null,
  planId: null,
  lastCheckedAt: null,
};

/** Align `isPro` with core `hasProAccess` (grace requires valid `proExpiresAt`). */
function syncProFlag(state: EntitlementState): EntitlementState {
  return { ...state, isPro: hasProAccess(state) };
}

/** After grace window, fold subscription to expired so UI and guards stay consistent. */
function normalizeGraceExpiry(state: EntitlementState): EntitlementState {
  if (state.subscriptionStatus !== 'grace' || !state.proExpiresAt) return state;
  const exp = new Date(state.proExpiresAt).getTime();
  if (Number.isNaN(exp) || exp >= Date.now()) return state;
  return { ...state, subscriptionStatus: 'expired' };
}

export const useEntitlementStore = create<EntitlementStore>((set) => ({
  ...initialState,
  hydrateEntitlement(payload) {
    set((state) => {
      const merged: EntitlementState = {
        ...state,
        ...payload,
        subscriptionStatus: payload.subscriptionStatus ?? state.subscriptionStatus,
      };
      return syncProFlag(normalizeGraceExpiry(merged));
    });
  },
  setPurchaseStatus(status) {
    set((state) =>
      syncProFlag(
        normalizeGraceExpiry({
          ...state,
          purchaseStatus: status,
          lastCheckedAt: new Date().toISOString(),
        })
      )
    );
  },
  setSubscriptionStatus(status) {
    set((state) =>
      syncProFlag(
        normalizeGraceExpiry({
          ...state,
          subscriptionStatus: status,
          lastCheckedAt: new Date().toISOString(),
        })
      )
    );
  },
  setProExpiry(iso) {
    set((state) =>
      syncProFlag(
        normalizeGraceExpiry({
          ...state,
          proExpiresAt: iso,
          lastCheckedAt: new Date().toISOString(),
        })
      )
    );
  },
  async refreshEntitlement() {
    set((state) =>
      syncProFlag(
        normalizeGraceExpiry({
          ...state,
          lastCheckedAt: new Date().toISOString(),
        })
      )
    );
  },
  resetEntitlement() {
    set(initialState);
  },
}));
