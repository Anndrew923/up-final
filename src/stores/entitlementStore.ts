import { create } from 'zustand';
import {
  hasProAccess,
  isProPurchaseCooldownActive,
  PRO_PURCHASE_COOLDOWN_MS,
  shouldBlockProReconcileDowngrade,
} from '../logic/core/entitlement';
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

export interface ServerProEntitlementCommit {
  subscriptionStatus: 'pro' | 'grace';
  proExpiresAt: string;
  planId: string | null;
  /**
   * Purchase path arms the 5-minute reconcile shield; restore/bootstrap should not.
   * WHY: Cooldown exists for post-charge RC lag, not to delay legitimate restore revocation.
   */
  armPurchaseCooldown?: boolean;
}

export interface EntitlementStore extends EntitlementState {
  /**
   * True while `refreshEntitlement` is in flight.
   * WHY: Dyno quota paywalls must wait until RC reconcile finishes before treating free as settled.
   */
  isRefreshing: boolean;
  hydrateEntitlement(payload: Partial<EntitlementState>): void;
  /** Single path for RevenueCat purchase / restore / refresh outcomes. */
  applyRevenueCatEntitlement(snapshot: RevenueCatEntitlementSnapshot): void;
  /**
   * Inject Firestore-confirmed Pro after hard-sync (optionally arm purchase cooldown).
   * WHY: Local UI unlocks only from server SSOT, never from a raw RC callback alone.
   */
  commitServerProEntitlement(payload: ServerProEntitlementCommit): void;
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
  proPurchaseCooldownUntil: null,
};
const DEBUG_PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/** Tracks which uid the in-memory subscription cache belongs to. */
let boundSessionUid: string | null = null;
let expiryTimer: number | null = null;
/**
 * Nested refresh depth — a finished older call must not clear `isRefreshing`
 * while a newer refresh is still awaiting RC / server sync.
 */
let entitlementRefreshInFlight = 0;

/**
 * WHY: Legacy caches / debug toggles may still write `purchaseStatus: 'none'`.
 * Forcing `owned` here prevents Pro funnels from mis-routing users as "missing Core".
 */
function normalizeEntitlementState(state: EntitlementState): EntitlementState {
  return syncProFlag(
    normalizeProExpiry({
      ...state,
      purchaseStatus: 'owned',
      proPurchaseCooldownUntil: state.proPurchaseCooldownUntil ?? null,
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

/**
 * Fold missing/elapsed paid expiry to expired so UI and guards stay consistent.
 * WHY: Cooldown only blocks stale inactive RC snapshots — real clock expiry must still win.
 */
function normalizeProExpiry(state: EntitlementState): EntitlementState {
  let next = state;
  // WHY: Drop elapsed cooldown stamps so uid-scoped cache does not carry dead shield forever.
  if (next.proPurchaseCooldownUntil && !isProPurchaseCooldownActive(next)) {
    next = { ...next, proPurchaseCooldownUntil: null };
  }
  if (next.subscriptionStatus !== 'pro' && next.subscriptionStatus !== 'grace') return next;
  if (!next.proExpiresAt) return { ...next, subscriptionStatus: 'expired' };
  const exp = new Date(next.proExpiresAt).getTime();
  if (!Number.isNaN(exp) && exp >= Date.now()) return next;
  return { ...next, subscriptionStatus: 'expired' };
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
    proPurchaseCooldownUntil: null,
    // WHY: Stale lastCheckedAt from a prior uid would look "settled" before this session's RC refresh.
    lastCheckedAt: null,
  });
}

export const useEntitlementStore = create<EntitlementStore>((set) => ({
  ...buildInitialEntitlement(),
  isRefreshing: false,
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
    set((state) => {
      // WHY: Stale inactive RC reads after hard-sync must not downgrade local Pro during cooldown.
      if (shouldBlockProReconcileDowngrade(state, snapshot.active)) {
        return {
          ...state,
          lastCheckedAt: new Date().toISOString(),
        };
      }
      return normalizeEntitlementState({
        ...state,
        ...snapshotToEntitlementPatch(snapshot),
      });
    });
  },
  commitServerProEntitlement(payload) {
    set((state) =>
      normalizeEntitlementState({
        ...state,
        subscriptionStatus: payload.subscriptionStatus,
        proExpiresAt: payload.proExpiresAt,
        planId: payload.planId,
        // WHY: Opt-in only — restore/bootstrap must not inherit the post-charge shield.
        proPurchaseCooldownUntil: payload.armPurchaseCooldown
          ? new Date(Date.now() + PRO_PURCHASE_COOLDOWN_MS).toISOString()
          : state.proPurchaseCooldownUntil,
        lastCheckedAt: new Date().toISOString(),
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
          proPurchaseCooldownUntil: cached.proPurchaseCooldownUntil ?? null,
          // WHY: Cache restores Pro/free flags, but settle waits for this session's refreshEntitlement.
          lastCheckedAt: null,
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
    entitlementRefreshInFlight += 1;
    set((state) => ({ ...state, isRefreshing: true }));
    try {
      const userId = useAuthStore.getState().uid;
      const sessionIsCurrent = () =>
        useAuthStore.getState().uid === userId && boundSessionUid === userId;
      if (userId && isRevenueCatNativeBillingAvailable()) {
        try {
          await logInRevenueCatUser(userId);
          if (!sessionIsCurrent()) return;
          const snapshot = await fetchRevenueCatEntitlement(userId);
          if (!sessionIsCurrent()) return;
          if (snapshot) {
            const previous = useEntitlementStore.getState();
            // WHY: Purchase cooldown blocks reconcile downgrade so a lagging RC REST
            // read cannot wipe the Firestore SSOT grant or local unlock.
            if (shouldBlockProReconcileDowngrade(previous, snapshot.active)) {
              set((state) => ({
                ...state,
                lastCheckedAt: new Date().toISOString(),
              }));
              return;
            }
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
              if (!sessionIsCurrent()) return;
            }
            return;
          }
        } catch {
          if (!sessionIsCurrent()) return;
          // Keep uid-scoped local cache if provider sync fails.
        }
      }
      if (userId && !sessionIsCurrent()) return;
      set((state) =>
        normalizeEntitlementState({
          ...state,
          lastCheckedAt: new Date().toISOString(),
        })
      );
    } finally {
      entitlementRefreshInFlight = Math.max(0, entitlementRefreshInFlight - 1);
      if (entitlementRefreshInFlight === 0) {
        set((state) => ({ ...state, isRefreshing: false }));
      }
    }
  },
  resetEntitlement() {
    boundSessionUid = null;
    entitlementRefreshInFlight = 0;
    set({ ...normalizeEntitlementState({ ...defaultState }), isRefreshing: false });
  },
}));

useEntitlementStore.subscribe((state) => {
  scheduleEntitlementExpiry(state);
  const uid = useAuthStore.getState().uid;
  if (!uid) return;
  savePersistedEntitlement(state, uid);
});

scheduleEntitlementExpiry(useEntitlementStore.getState());
