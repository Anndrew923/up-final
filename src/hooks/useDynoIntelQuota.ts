import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DYNO_INTEL_PRO_DAILY, DYNO_INTEL_TRIAL_DAILY } from '../config/dynoIntel';
import { hasProAccess } from '../logic/core/entitlement';
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
  const isPro = hasProAccess(entitlement);
  const defaultLimit = isPro ? DYNO_INTEL_PRO_DAILY : DYNO_INTEL_TRIAL_DAILY;

  const [remaining, setRemaining] = useState(defaultLimit);
  const [limit, setLimit] = useState(defaultLimit);
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [syncedFromServer, setSyncedFromServer] = useState(false);

  useEffect(() => {
    if (syncedFromServer) return;
    setRemaining(defaultLimit);
    setLimit(defaultLimit);
  }, [defaultLimit, syncedFromServer]);

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
