import { create } from 'zustand';
import { hasProAccess } from '../logic/core/entitlement';
import {
  loadPersistedEntitlement,
  savePersistedEntitlement,
} from '../services/entitlementPersistenceService';
import {
  fetchRevenueCatEntitlement,
  isRevenueCatNativeBillingAvailable,
  logInRevenueCatUser,
  type RevenueCatEntitlementSnapshot,
} from '../services/revenueCatService';
import { useAuthStore } from './authStore';
import type { EntitlementState, PurchaseStatus, SubscriptionStatus } from '../types/entitlement';

export interface EntitlementStore extends EntitlementState {
  hydrateEntitlement(payload: Partial<EntitlementState>): void;
  /** Single path for RevenueCat purchase / restore / refresh outcomes. */
  applyRevenueCatEntitlement(snapshot: RevenueCatEntitlementSnapshot): void;
  /**
   * Bind entitlement cache to the signed-in Firebase uid (or clear Pro on sign-out).
   * WHY: Prevent prior user's Pro snapshot leaking to the next account on shared localStorage.
   */
  bindEntitlementSession(uid: string | null): void;
  setPurchaseStatus(status: PurchaseStatus): void;
  setSubscriptionStatus(status: SubscriptionStatus): void;
  setProExpiry(iso: string | null): void;
  refreshEntitlement(): Promise<void>;
  resetEntitlement(): void;
}

const defaultState: EntitlementState = {
  purchaseStatus: 'none',
  subscriptionStatus: 'free',
  isPro: false,
  proExpiresAt: null,
  planId: null,
  lastCheckedAt: null,
};

/** Tracks which uid the in-memory subscription cache belongs to. */
let boundSessionUid: string | null = null;

function normalizeEntitlementState(state: EntitlementState): EntitlementState {
  return syncProFlag(normalizeGraceExpiry(state));
}

function buildInitialEntitlement(): EntitlementState {
  const persisted = loadPersistedEntitlement();
  const merged: EntitlementState = {
    ...defaultState,
    ...(persisted ?? {}),
  };
  return normalizeEntitlementState(merged);
}

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

function snapshotToEntitlementPatch(
  snapshot: RevenueCatEntitlementSnapshot
): Partial<EntitlementState> {
  return {
    subscriptionStatus: snapshot.active ? 'pro' : 'free',
    planId: snapshot.active ? (snapshot.productIdentifier ?? 'pro_monthly_099') : null,
    proExpiresAt: snapshot.active ? snapshot.expiresDate : null,
    lastCheckedAt: new Date().toISOString(),
  };
}

function clearProSubscriptionFields(state: EntitlementState): EntitlementState {
  return normalizeEntitlementState({
    ...state,
    subscriptionStatus: 'free',
    proExpiresAt: null,
    planId: null,
  });
}

export const useEntitlementStore = create<EntitlementStore>((set) => ({
  ...buildInitialEntitlement(),
  hydrateEntitlement(payload) {
    set((state) =>
      normalizeEntitlementState({
        ...state,
        ...payload,
        subscriptionStatus: payload.subscriptionStatus ?? state.subscriptionStatus,
      })
    );
  },
  applyRevenueCatEntitlement(snapshot) {
    set((state) =>
      normalizeEntitlementState({
        ...state,
        ...snapshotToEntitlementPatch(snapshot),
      })
    );
  },
  bindEntitlementSession(uid) {
    if (uid === boundSessionUid) return;
    boundSessionUid = uid;

    if (!uid) {
      set((state) => clearProSubscriptionFields(state));
      return;
    }

    const cached = loadPersistedEntitlement(uid);
    set((state) => {
      if (cached) {
        return normalizeEntitlementState({
          ...state,
          purchaseStatus: cached.purchaseStatus ?? state.purchaseStatus,
          subscriptionStatus: cached.subscriptionStatus,
          proExpiresAt: cached.proExpiresAt,
          planId: cached.planId,
        });
      }
      return clearProSubscriptionFields(state);
    });
  },
  setPurchaseStatus(status) {
    set((state) =>
      normalizeEntitlementState({
        ...state,
        purchaseStatus: status,
        lastCheckedAt: new Date().toISOString(),
      })
    );
  },
  setSubscriptionStatus(status) {
    set((state) =>
      normalizeEntitlementState({
        ...state,
        subscriptionStatus: status,
        lastCheckedAt: new Date().toISOString(),
      })
    );
  },
  setProExpiry(iso) {
    set((state) =>
      normalizeEntitlementState({
        ...state,
        proExpiresAt: iso,
        lastCheckedAt: new Date().toISOString(),
      })
    );
  },
  async refreshEntitlement() {
    const userId = useAuthStore.getState().uid;
    if (userId && isRevenueCatNativeBillingAvailable()) {
      try {
        await logInRevenueCatUser(userId);
        const snapshot = await fetchRevenueCatEntitlement(userId);
        if (snapshot) {
          useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
          return;
        }
      } catch {
        // Keep uid-scoped local cache if provider sync fails.
      }
    }
    set((state) =>
      normalizeEntitlementState({
        ...state,
        lastCheckedAt: new Date().toISOString(),
      })
    );
  },
  resetEntitlement() {
    boundSessionUid = null;
    set(normalizeEntitlementState({ ...defaultState }));
  },
}));

useEntitlementStore.subscribe((state) => {
  const uid = useAuthStore.getState().uid;
  if (!uid) return;
  savePersistedEntitlement(state, uid);
});
