import { useCallback, useRef, useState } from 'react';
import {
  mapRestoreResultToStatus,
  type RestorePurchasesStatus,
} from '../logic/core/restorePurchasesStatus';
import { restorePurchasesFromDevice } from '../services/subscriptionService';
import { useAuthStore } from '../stores/authStore';

export type UseRestorePurchasesOptions = {
  /**
   * Extra gate from the host surface (e.g. subscribe / auth busy).
   * WHY: Prevent parallel store calls while purchase or sign-in is in flight.
   */
  enabled?: boolean;
};

export type UseRestorePurchasesResult = {
  busy: boolean;
  status: RestorePurchasesStatus;
  canRestore: boolean;
  restorePurchases: () => Promise<void>;
  clearStatus: () => void;
};

/**
 * Shared Restore Purchases facade for Settings + paid-subscribe surfaces.
 * WHY: Apple 3.1.2 requires reachable restore on every subscribe UI; one execution path
 * keeps busy-lock and outcome copy identical to Settings.
 */
export function useRestorePurchases(
  options: UseRestorePurchasesOptions = {}
): UseRestorePurchasesResult {
  const enabled = options.enabled !== false;
  const authStatus = useAuthStore((s) => s.status);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<RestorePurchasesStatus>('idle');
  // WHY: State `busy` alone cannot block same-tick double taps before React re-renders.
  const inFlightRef = useRef(false);

  const canRestore = enabled && authStatus !== 'loading' && !busy;

  const clearStatus = useCallback(() => {
    setStatus('idle');
  }, []);

  const restorePurchases = useCallback(async () => {
    if (!enabled || authStatus === 'loading' || inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus('idle');
    setBusy(true);
    try {
      const result = await restorePurchasesFromDevice();
      setStatus(mapRestoreResultToStatus(result));
    } catch {
      setStatus('restore-fail');
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }, [authStatus, enabled]);

  return {
    busy,
    status,
    canRestore,
    restorePurchases,
    clearStatus,
  };
}
