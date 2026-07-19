import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DYNO_INTEL_PRO_DAILY, DYNO_INTEL_TRIAL_DAILY } from '../config/dynoIntel';
import { hasProAccess } from '../logic/core/entitlement';
import type { DynoIntelQuotaTier } from '../logic/core/dynoIntelTypes';
import {
  clearPersistedDynoIntelQuota,
  loadPersistedDynoIntelQuota,
  savePersistedDynoIntelQuota,
} from '../services/dynoIntelQuotaPersistence';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';

interface DynoIntelQuotaSnapshot {
  remaining: number;
  limit: number;
  quotaTier: DynoIntelQuotaTier;
  resetAt: string | null;
  ownerToken: string;
  isSynced: boolean;
}

export interface DynoIntelQuotaState {
  remaining: number;
  limit: number;
  quotaTier: DynoIntelQuotaTier;
  resetAt: string | null;
  syncToken: string;
  isSynced: boolean;
  isSyncTokenCurrent: (requestSyncToken: string) => boolean;
  applyServerQuota: (
    payload: {
      remaining: number;
      limit: number;
      quotaTier: DynoIntelQuotaTier;
      resetAt: string;
    },
    requestSyncToken: string
  ) => void;
}

function defaultQuotaSnapshot(
  quotaTier: DynoIntelQuotaTier,
  ownerToken: string
): DynoIntelQuotaSnapshot {
  const limit = quotaTier === 'pro' ? DYNO_INTEL_PRO_DAILY : DYNO_INTEL_TRIAL_DAILY;
  return { remaining: limit, limit, quotaTier, resetAt: null, ownerToken, isSynced: false };
}

function readCurrentQuotaSyncToken(): string {
  const auth = useAuthStore.getState();
  const entitlement = selectEntitlementState(useEntitlementStore.getState());
  const isPro = auth.status === 'signed-in' && !auth.isAnonymous && hasProAccess(entitlement);
  return `${auth.uid ?? 'signed-out'}:${isPro ? 'pro' : 'trial'}`;
}

function migrateQuotaTier(
  persisted: {
    remaining: number;
    limit: number;
    quotaTier: DynoIntelQuotaTier;
    resetAt: string;
  },
  quotaTier: DynoIntelQuotaTier,
  ownerToken: string
): DynoIntelQuotaSnapshot & { resetAt: string } {
  const limit = quotaTier === 'pro' ? DYNO_INTEL_PRO_DAILY : DYNO_INTEL_TRIAL_DAILY;
  const usedToday = Math.max(0, persisted.limit - persisted.remaining);
  return {
    remaining: Math.max(0, limit - usedToday),
    limit,
    quotaTier,
    resetAt: persisted.resetAt,
    ownerToken,
    isSynced: true,
  };
}

/**
 * Displays daily quota — authoritative counts come from Callable responses.
 * WHY: Client only shows hints until first chat syncs server remaining/limit.
 */
export function useDynoIntelQuota(): DynoIntelQuotaState {
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const authStatus = useAuthStore((s) => s.status);
  const uid = useAuthStore((s) => s.uid);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const isPro = authStatus === 'signed-in' && !isAnonymous && hasProAccess(entitlement);
  const defaultTier: DynoIntelQuotaTier = isPro ? 'pro' : 'trial';
  const syncToken = `${uid ?? 'signed-out'}:${defaultTier}`;
  const [snapshot, setSnapshot] = useState<DynoIntelQuotaSnapshot>(() =>
    defaultQuotaSnapshot(defaultTier, syncToken)
  );
  const effectiveSnapshot =
    snapshot.ownerToken === syncToken ? snapshot : defaultQuotaSnapshot(defaultTier, syncToken);

  useEffect(() => {
    const fallback = defaultQuotaSnapshot(defaultTier, syncToken);
    if (!uid) {
      setSnapshot(fallback);
      return;
    }
    const persisted = loadPersistedDynoIntelQuota(uid);
    if (persisted?.quotaTier === defaultTier) {
      setSnapshot({ ...persisted, ownerToken: syncToken, isSynced: true });
      return;
    }
    if (persisted) {
      // Backend deliberately shares countToday across trial and Pro. Preserve
      // today's consumed requests so an upgrade does not advertise a false 30/30.
      const migrated = migrateQuotaTier(persisted, defaultTier, syncToken);
      savePersistedDynoIntelQuota(uid, migrated);
      setSnapshot(migrated);
      return;
    }
    setSnapshot(fallback);
  }, [defaultTier, syncToken, uid]);

  const applyServerQuota = useCallback(
    (
      payload: {
        remaining: number;
        limit: number;
        quotaTier: DynoIntelQuotaTier;
        resetAt: string;
      },
      requestSyncToken: string
    ) => {
      // WHY: Ignore a late response from a previous account or entitlement tier.
      if (readCurrentQuotaSyncToken() !== requestSyncToken) return;
      const currentUid = useAuthStore.getState().uid;
      if (currentUid) {
        const persisted = loadPersistedDynoIntelQuota(currentUid);
        if (
          persisted?.quotaTier === payload.quotaTier &&
          persisted.resetAt === payload.resetAt &&
          persisted.remaining < payload.remaining
        ) {
          return;
        }
        savePersistedDynoIntelQuota(currentUid, payload);
      }
      setSnapshot({ ...payload, ownerToken: requestSyncToken, isSynced: true });
    },
    []
  );
  const isSyncTokenCurrent = useCallback(
    (requestSyncToken: string) => readCurrentQuotaSyncToken() === requestSyncToken,
    []
  );

  useEffect(() => {
    if (!effectiveSnapshot.resetAt) return;
    const resetAtMs = Date.parse(effectiveSnapshot.resetAt);
    const delay = resetAtMs - Date.now();
    const reset = () => {
      if (uid) clearPersistedDynoIntelQuota(uid);
      setSnapshot(defaultQuotaSnapshot(defaultTier, syncToken));
    };
    if (!Number.isFinite(resetAtMs) || delay <= 0) {
      reset();
      return;
    }
    const timer = window.setTimeout(reset, Math.min(delay, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [defaultTier, effectiveSnapshot.resetAt, syncToken, uid]);

  return useMemo(
    () => ({
      remaining: effectiveSnapshot.remaining,
      limit: effectiveSnapshot.limit,
      quotaTier: effectiveSnapshot.quotaTier,
      resetAt: effectiveSnapshot.resetAt,
      syncToken,
      isSynced: effectiveSnapshot.isSynced,
      isSyncTokenCurrent,
      applyServerQuota,
    }),
    [applyServerQuota, effectiveSnapshot, isSyncTokenCurrent, syncToken]
  );
}
