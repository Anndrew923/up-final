import { useCallback, useState } from 'react';
import { useLadderIdentityReady } from './useLadderIdentityReady';

/**
 * Shared identity hard-gate for sync / upload bars.
 * WHY: Three CTAs share the same “open sheet if name missing” contract — keep it in one place
 * so button copy, chip, and drawer stay consistent.
 */
export function useLadderIdentityUploadGate() {
  const identity = useLadderIdentityReady();
  const [identitySheetOpen, setIdentitySheetOpen] = useState(false);

  const openIdentitySheet = useCallback(() => setIdentitySheetOpen(true), []);
  const closeIdentitySheet = useCallback(() => setIdentitySheetOpen(false), []);

  /** Returns true when identity is ready; otherwise opens the sheet and returns false. */
  const ensureIdentityReady = useCallback((): boolean => {
    if (identity.ready) return true;
    setIdentitySheetOpen(true);
    return false;
  }, [identity.ready]);

  return {
    identity,
    identitySheetOpen,
    openIdentitySheet,
    closeIdentitySheet,
    ensureIdentityReady,
  };
}
