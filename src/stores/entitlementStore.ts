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
import { syncProEntitlementToServer } from '../services/subscriptionSyncService';
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
  /**
   * Debug / legacy setter — `none` is coerced to `owned` in normalize (download-includes-Core).
   */
  setPurchaseStatus(status: PurchaseStatus): void;
  /** Debug-only status setter; production activation must use RevenueCat snapshots. */
  setSubscriptionStatus(status: SubscriptionStatus): void;
  setProExpiry(iso: string | null): void;
  refreshEntitlement(): Promise<void>;
  resetEntitlement(): void;
}

const defaultState: EntitlementState = {
  // WHY: Download-includes-Core constitution — opening the app grants Core buyout.
  purchaseStatus: 'owned',
  subscriptionStatus: 'free',
  isPro: false,
  proExpiresAt: null,
  planId: null,
  lastCheckedAt: null,
};
const DEBUG_PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/** Tracks which uid the in-memory subscription cache belongs to. */
let boundSessionUid: string | null = null;
let expiryTimer: number | null = null;

/**
 * WHY: Legacy caches / debug toggles may still write `purchaseStatus: 'none'`.
 * Forcing `owned` here prevents Pro funnels from mis-routing users as "missing Core".
 */
function normalizeEntitlementState(state: EntitlementState): EntitlementState {
  return syncProFlag(
    normalizeProExpiry({
      ...state,
      purchaseStatus: 'owned',
    })
  );
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

/** Fold missing/elapsed paid expiry to expired so UI and guards stay consistent. */
function normalizeProExpiry(state: EntitlementState): EntitlementState {
  if (state.subscriptionStatus !== 'pro' && state.subscriptionStatus !== 'grace') return state;
  if (!state.proExpiresAt) return { ...state, subscriptionStatus: 'expired' };
  const exp = new Date(state.proExpiresAt).getTime();
  if (!Number.isNaN(exp) && exp >= Date.now()) return state;
  return { ...state, subscriptionStatus: 'expired' };
}

function scheduleEntitlementExpiry(state: EntitlementState): void {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  if (
    typeof window === 'undefined' ||
    (state.subscriptionStatus !== 'pro' && state.subscriptionStatus !== 'grace') ||
    !state.proExpiresAt
  ) {
    return;
  }
  const expiresAtMs = Date.parse(state.proExpiresAt);
  if (!Number.isFinite(expiresAtMs)) return;
  const delay = Math.max(0, expiresAtMs - Date.now() + 1);
  expiryTimer = window.setTimeout(
    () => {
      const current = useEntitlementStore.getState();
      const normalized = normalizeEntitlementState(current);
      if (normalized.subscriptionStatus === current.subscriptionStatus) {
        scheduleEntitlementExpiry(current);
        return;
      }
      useEntitlementStore.setState(normalized);
    },
    Math.min(delay, 2_147_483_647)
  );
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
    set((state) => {
      const currentExpiryMs = state.proExpiresAt ? Date.parse(state.proExpiresAt) : Number.NaN;
      const needsDebugExpiry =
        (status === 'pro' || status === 'grace') &&
        (!Number.isFinite(currentExpiryMs) || currentExpiryMs <= Date.now());
      return normalizeEntitlementState({
        ...state,
        subscriptionStatus: status,
        proExpiresAt: needsDebugExpiry
          ? new Date(Date.now() + DEBUG_PRO_DURATION_MS).toISOString()
          : state.proExpiresAt,
        lastCheckedAt: new Date().toISOString(),
      });
    });
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
          const previous = useEntitlementStore.getState();
          const shouldSyncServer =
            snapshot.active ||
            previous.subscriptionStatus === 'pro' ||
            previous.subscriptionStatus === 'grace' ||
            previous.subscriptionStatus === 'expired' ||
            previous.isPro;
          useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
          // WHY: Boot refresh also migrates legacy/missing server expiry and
          // propagates inactive revocation without charging every free boot.
          if (shouldSyncServer) {
            await syncProEntitlementToServer({ source: 'revenuecat', snapshot });
          }
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
  scheduleEntitlementExpiry(state);
  const uid = useAuthStore.getState().uid;
  if (!uid) return;
  savePersistedEntitlement(state, uid);
});

scheduleEntitlementExpiry(useEntitlementStore.getState());
