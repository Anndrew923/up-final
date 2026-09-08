import { create } from 'zustand';
import {
  hasProAccess,
  isProPurchaseCooldownActive,
  PRO_PURCHASE_COOLDOWN_MS,
  shouldBlockCrossPlatformProDowngrade,
} from '../logic/core/entitlement';
import { isPromoExpiryActive, resolveEffectiveProExpiryMs } from '../logic/core/proExpiry';
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
import {
  logEntitlementSync,
  resolveServerProHydrate,
  shouldPreserveLocalProAgainstInactiveStore,
} from '../services/userEntitlementService';
import { useAuthStore } from './authStore';
import type { EntitlementState, PurchaseStatus, SubscriptionStatus } from '../types/entitlement';

export interface ServerProEntitlementCommit {
  subscriptionStatus: 'pro' | 'grace';
  /**
   * Effective stacked access expiry — used when rc/promo mirrors are omitted.
   * Prefer passing `rcExpiresAt` + `promoExpiresAt` + `effectiveUntil` explicitly.
   */
  proExpiresAt: string;
  rcExpiresAt?: string | null;
  promoExpiresAt?: string | null;
  effectiveUntil?: string | null;
  promoCreditMs?: number | null;
  promoPaused?: boolean;
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
  /**
   * Pull `users/{uid}` Pro fields and commit when still valid.
   * WHY: Cross-platform login must hydrate server SSOT before RC reconcile can downgrade.
   */
  hydrateServerProFromFirestore(uid: string): Promise<boolean>;
  refreshEntitlement(): Promise<void>;
  resetEntitlement(): void;
}

const defaultState: EntitlementState = {
  // WHY: Download-includes-Core constitution — opening the app grants Core buyout.
  purchaseStatus: 'owned',
  subscriptionStatus: 'free',
  isPro: false,
  proExpiresAt: null,
  promoExpiresAt: null,
  effectiveUntil: null,
  promoCreditMs: null,
  promoPaused: false,
  planId: null,
  lastCheckedAt: null,
  proPurchaseCooldownUntil: null,
  isGenesisEarlyBird: false,
  genesisSeatNumber: null,
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
      promoExpiresAt: state.promoExpiresAt ?? null,
      effectiveUntil: state.effectiveUntil ?? null,
      promoCreditMs:
        typeof state.promoCreditMs === 'number' && Number.isFinite(state.promoCreditMs)
          ? Math.max(0, state.promoCreditMs)
          : null,
      promoPaused: state.promoPaused === true,
      proPurchaseCooldownUntil: state.proPurchaseCooldownUntil ?? null,
      isGenesisEarlyBird: state.isGenesisEarlyBird === true,
      genesisSeatNumber:
        typeof state.genesisSeatNumber === 'number' &&
        Number.isFinite(state.genesisSeatNumber) &&
        state.genesisSeatNumber >= 1
          ? Math.floor(state.genesisSeatNumber)
          : null,
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

/** Align `isPro` with core `hasProAccess` (grace requires valid effective expiry). */
function syncProFlag(state: EntitlementState): EntitlementState {
  return { ...state, isPro: hasProAccess(state) };
}

/**
 * Fold missing/elapsed paid+promo expiry to expired so UI and guards stay consistent.
 * WHY: Cooldown only blocks stale inactive RC snapshots — real clock expiry must still win.
 */
function normalizeProExpiry(state: EntitlementState): EntitlementState {
  let next = state;
  // WHY: Drop elapsed cooldown stamps so uid-scoped cache does not carry dead shield forever.
  if (next.proPurchaseCooldownUntil && !isProPurchaseCooldownActive(next)) {
    next = { ...next, proPurchaseCooldownUntil: null };
  }
  if (next.subscriptionStatus !== 'pro' && next.subscriptionStatus !== 'grace') {
    // Promo-only defense: elevate status when promo window is still live.
    if (isPromoExpiryActive(next)) {
      return { ...next, subscriptionStatus: 'pro' };
    }
    return next;
  }
  const effectiveMs = resolveEffectiveProExpiryMs(next);
  if (effectiveMs == null) return { ...next, subscriptionStatus: 'expired' };
  if (effectiveMs >= Date.now()) return next;
  return { ...next, subscriptionStatus: 'expired' };
}

function scheduleEntitlementExpiry(state: EntitlementState): void {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  if (
    typeof window === 'undefined' ||
    (state.subscriptionStatus !== 'pro' && state.subscriptionStatus !== 'grace')
  ) {
    return;
  }
  const effectiveMs = resolveEffectiveProExpiryMs(state);
  if (effectiveMs == null) return;
  const delay = Math.max(0, effectiveMs - Date.now() + 1);
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
  snapshot: RevenueCatEntitlementSnapshot,
  previous: EntitlementState
): Partial<EntitlementState> {
  if (snapshot.active) {
    return {
      subscriptionStatus: 'pro',
      planId: snapshot.productIdentifier ?? 'pro_monthly_099',
      proExpiresAt: snapshot.expiresDate,
      lastCheckedAt: new Date().toISOString(),
    };
  }
  // WHY: Inactive RC must not clear coach promo — keep Pro when gift credit remains.
  if (isPromoExpiryActive(previous)) {
    return {
      subscriptionStatus: 'pro',
      planId: null,
      proExpiresAt: null,
      lastCheckedAt: new Date().toISOString(),
    };
  }
  return {
    subscriptionStatus: 'free',
    planId: null,
    proExpiresAt: null,
    promoExpiresAt: null,
    effectiveUntil: null,
    promoCreditMs: null,
    promoPaused: false,
    lastCheckedAt: new Date().toISOString(),
  };
}

function clearProSubscriptionFields(state: EntitlementState): EntitlementState {
  return normalizeEntitlementState({
    ...state,
    subscriptionStatus: 'free',
    proExpiresAt: null,
    promoExpiresAt: null,
    effectiveUntil: null,
    promoCreditMs: null,
    promoPaused: false,
    planId: null,
    proPurchaseCooldownUntil: null,
    // WHY: Stale lastCheckedAt from a prior uid would look "settled" before this session's RC refresh.
    lastCheckedAt: null,
    // WHY: Genesis seats are per-uid — clear on session wipe so the next account cannot inherit.
    isGenesisEarlyBird: false,
    genesisSeatNumber: null,
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
      // WHY: Stale inactive RC reads must not downgrade Firestore-hydrated cross-platform Pro.
      if (shouldBlockCrossPlatformProDowngrade(state, snapshot.active)) {
        logEntitlementSync('rc-apply-blocked', {
          reason: 'cross-platform-or-cooldown',
          snapshotActive: snapshot.active,
          subscriptionStatus: state.subscriptionStatus,
        });
        return {
          ...state,
          lastCheckedAt: new Date().toISOString(),
        };
      }
      return normalizeEntitlementState({
        ...state,
        ...snapshotToEntitlementPatch(snapshot, state),
      });
    });
  },
  commitServerProEntitlement(payload) {
    set((state) => {
      // WHY: Store RC + promo mirrors separately; hasProAccess prefers stacked effectiveUntil.
      const promoExpiresAt =
        payload.promoExpiresAt !== undefined
          ? payload.promoExpiresAt
          : (state.promoExpiresAt ?? null);
      const proExpiresAt =
        payload.rcExpiresAt !== undefined ? payload.rcExpiresAt : payload.proExpiresAt;
      const effectiveUntil =
        payload.effectiveUntil !== undefined
          ? payload.effectiveUntil
          : (payload.proExpiresAt ?? state.effectiveUntil ?? null);

      return normalizeEntitlementState({
        ...state,
        subscriptionStatus: payload.subscriptionStatus,
        proExpiresAt,
        promoExpiresAt,
        effectiveUntil,
        promoCreditMs:
          payload.promoCreditMs !== undefined
            ? payload.promoCreditMs
            : (state.promoCreditMs ?? null),
        promoPaused:
          payload.promoPaused !== undefined ? payload.promoPaused : Boolean(state.promoPaused),
        planId: payload.planId,
        // WHY: Opt-in only — restore/bootstrap must not inherit the post-charge shield.
        proPurchaseCooldownUntil: payload.armPurchaseCooldown
          ? new Date(Date.now() + PRO_PURCHASE_COOLDOWN_MS).toISOString()
          : state.proPurchaseCooldownUntil,
        lastCheckedAt: new Date().toISOString(),
      });
    });
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
          promoExpiresAt: cached.promoExpiresAt ?? null,
          effectiveUntil: cached.effectiveUntil ?? null,
          promoCreditMs: cached.promoCreditMs ?? null,
          promoPaused: cached.promoPaused === true,
          planId: cached.planId,
          proPurchaseCooldownUntil: cached.proPurchaseCooldownUntil ?? null,
          isGenesisEarlyBird: cached.isGenesisEarlyBird === true,
          genesisSeatNumber: cached.genesisSeatNumber ?? null,
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
      const currentExpiryMs = resolveEffectiveProExpiryMs(state);
      const needsDebugExpiry =
        (status === 'pro' || status === 'grace') &&
        (currentExpiryMs == null || currentExpiryMs <= Date.now());
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
  async hydrateServerProFromFirestore(uid) {
    const result = await resolveServerProHydrate(uid);
    if (boundSessionUid !== uid) {
      logEntitlementSync('firestore-hydrate-stale-session', { uid });
      return false;
    }

    if (result.status === 'active') {
      // WHY: Single set — Pro grant + genesis mirror without double persist/subscribers.
      set((state) =>
        normalizeEntitlementState({
          ...state,
          subscriptionStatus: result.entitlement.subscriptionStatus,
          proExpiresAt:
            result.entitlement.rcExpiresAt !== undefined
              ? result.entitlement.rcExpiresAt
              : result.entitlement.proExpiresAt,
          promoExpiresAt:
            result.entitlement.promoExpiresAt !== undefined
              ? result.entitlement.promoExpiresAt
              : (state.promoExpiresAt ?? null),
          effectiveUntil:
            result.entitlement.effectiveUntil ?? result.entitlement.proExpiresAt ?? null,
          promoCreditMs: result.entitlement.promoCreditMs ?? null,
          promoPaused: result.entitlement.promoPaused === true,
          planId: result.entitlement.planId,
          isGenesisEarlyBird: result.genesis?.isGenesisEarlyBird === true,
          genesisSeatNumber: result.genesis?.genesisSeatNumber ?? null,
          lastCheckedAt: new Date().toISOString(),
        })
      );
      return true;
    }

    if (result.status === 'revoked') {
      set((state) =>
        normalizeEntitlementState({
          ...state,
          // WHY: Clear billing Pro when server revoked; always apply genesis from same read.
          ...(hasProAccess(state)
            ? {
                subscriptionStatus: 'free' as const,
                proExpiresAt: null,
                promoExpiresAt: null,
                effectiveUntil: null,
                promoCreditMs: null,
                promoPaused: false,
                planId: null,
                proPurchaseCooldownUntil: null,
              }
            : {}),
          isGenesisEarlyBird: result.genesis?.isGenesisEarlyBird === true,
          genesisSeatNumber: result.genesis?.genesisSeatNumber ?? null,
          lastCheckedAt: new Date().toISOString(),
        })
      );
    }

    return false;
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
            // WHY: Inactive local-store must not wipe Pro, but must still realign
            // RC/promo mirrors from Firestore SSOT (cleared RC after webhook, or
            // cross-platform Android grant). Never trust stale local proExpiresAt alone.
            if (await shouldPreserveLocalProAgainstInactiveStore(userId, previous, snapshot.active)) {
              logEntitlementSync('rc-refresh-blocked', {
                snapshotActive: snapshot.active,
                subscriptionStatus: previous.subscriptionStatus,
                isPro: previous.isPro,
              });
              await useEntitlementStore.getState().hydrateServerProFromFirestore(userId);
              if (!sessionIsCurrent()) return;
              set((state) => ({
                ...state,
                lastCheckedAt: new Date().toISOString(),
              }));
              return;
            }
            const shouldSyncServer =
              snapshot.active ||
              (previous.subscriptionStatus === 'expired' && !hasProAccess(previous));
            if (snapshot.active) {
              useEntitlementStore.getState().applyRevenueCatEntitlement(snapshot);
              // WHY: Pull founding-seat mirror without re-running Pro revoke logic (server may lag RC).
              const gen = await resolveServerProHydrate(userId);
              if (!sessionIsCurrent()) return;
              if (gen.status !== 'skipped' && 'genesis' in gen) {
                set((state) =>
                  normalizeEntitlementState({
                    ...state,
                    isGenesisEarlyBird: gen.genesis.isGenesisEarlyBird,
                    genesisSeatNumber: gen.genesis.genesisSeatNumber,
                  })
                );
              }
            } else {
              // WHY: Inactive RC must still hydrate Firestore so genesis seats survive Pro revoke.
              await useEntitlementStore.getState().hydrateServerProFromFirestore(userId);
              if (!sessionIsCurrent()) return;
            }
            // WHY: Boot refresh also migrates legacy/missing server expiry and
            // propagates inactive revocation without charging every free boot.
            if (shouldSyncServer) {
              await syncProEntitlementToServer({
                source: 'revenuecat',
                snapshot,
                intent: 'reconcile',
              });
              if (!sessionIsCurrent()) return;
            }
            return;
          }
        } catch (error) {
          if (!sessionIsCurrent()) return;
          const message = error instanceof Error ? error.message : String(error);
          logEntitlementSync('rc-refresh-error', { message });
          // WHY: RC outage should not strand users — retry Firestore SSOT before settling free.
          await useEntitlementStore.getState().hydrateServerProFromFirestore(userId);
        }
      } else if (userId && sessionIsCurrent()) {
        // WHY: Web / RC-unconfigured builds still need server SSOT on manual refresh.
        await useEntitlementStore.getState().hydrateServerProFromFirestore(userId);
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
