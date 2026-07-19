import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DYNO_INTEL_PRO_DAILY, DYNO_INTEL_TRIAL_DAILY } from '../config/dynoIntel';
import { hasProAccess } from '../logic/core/entitlement';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';

export interface DynoIntelQuotaState {
  remaining: number;
  limit: number;
  resetAt: string | null;
  applyServerQuota: (payload: { remaining: number; limit: number; resetAt: string }) => void;
}

/**
 * Displays daily quota — authoritative counts come from Callable responses.
 * WHY: Client only shows hints until first chat syncs server remaining/limit.
 */
export function useDynoIntelQuota(): DynoIntelQuotaState {
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  // WHY: A dev/beta access bypass is not proof of a Pro quota. Until the server
  // responds, only a real signed-in Pro entitlement may advertise 30/day.
  const isPro = authStatus === 'signed-in' && !isAnonymous && hasProAccess(entitlement);
  const defaultLimit = isPro ? DYNO_INTEL_PRO_DAILY : DYNO_INTEL_TRIAL_DAILY;

  const [remaining, setRemaining] = useState(defaultLimit);
  const [limit, setLimit] = useState(defaultLimit);
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [syncedFromServer, setSyncedFromServer] = useState(false);
  const previousIsPro = useRef(isPro);

  useEffect(() => {
    if (previousIsPro.current !== isPro) {
      // WHY: A subscription upgrade/downgrade starts a different server quota
      // bucket. Never let a synced 0/2 trial block the first Pro request.
      previousIsPro.current = isPro;
      setSyncedFromServer(false);
      setRemaining(defaultLimit);
      setLimit(defaultLimit);
      setResetAt(null);
      return;
    }
    if (syncedFromServer) return;
    setRemaining(defaultLimit);
    setLimit(defaultLimit);
  }, [defaultLimit, isPro, syncedFromServer]);

  const applyServerQuota = useCallback(
    (payload: { remaining: number; limit: number; resetAt: string }) => {
      setSyncedFromServer(true);
      setRemaining(payload.remaining);
      setLimit(payload.limit);
      setResetAt(payload.resetAt);
    },
    []
  );

  return useMemo(
    () => ({
      remaining,
      limit,
      resetAt,
      applyServerQuota,
    }),
    [applyServerQuota, limit, remaining, resetAt]
  );
}
