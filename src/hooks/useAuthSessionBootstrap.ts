import { useEffect } from 'react';
import {
  consumeFirebaseRedirectResult,
  isGoogleRedirectPending,
  onFirebaseAuthStateChanged,
} from '../services/firebaseClient';
import { bindStructuredSyncSession } from '../services/structuredSyncSession';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { useDynoIntelLogStore } from '../stores/dynoIntelLogStore';

/**
 * Initializes Firebase auth observer and mirrors state into auth store.
 */
export function useAuthSessionBootstrap(): void {
  const setLoading = useAuthStore((s) => s.setLoading);
  const setSignedOut = useAuthStore((s) => s.setSignedOut);
  const setFromUser = useAuthStore((s) => s.setFromUser);
  const refreshEntitlement = useEntitlementStore((s) => s.refreshEntitlement);
  const bindEntitlementSession = useEntitlementStore((s) => s.bindEntitlementSession);
  const bindDynoIntelLogSession = useDynoIntelLogStore((s) => s.bindSession);

  useEffect(() => {
    // WHY: React StrictMode remounts this effect; resetting signed-in → loading flashes AppShell on deep routes (/muscle, etc.).
    const statusBeforeBootstrap = useAuthStore.getState().status;
    if (statusBeforeBootstrap === 'loading') {
      setLoading();
    }

    let isDisposed = false;
    let unsubscribe: (() => void) | null = null;

    void (async () => {
      await consumeFirebaseRedirectResult();
      if (isDisposed) return;
      unsubscribe = onFirebaseAuthStateChanged((user) => {
        if (!user) {
          if (isGoogleRedirectPending()) {
            // Keep loading while redirect flow is resolving to avoid flashing signed-out state.
            setLoading();
            return;
          }
          bindStructuredSyncSession(null);
          setSignedOut();
          bindEntitlementSession(null);
          bindDynoIntelLogSession(null);
          return;
        }
        bindStructuredSyncSession(user.uid);
        setFromUser(user);
        bindEntitlementSession(user.uid);
        bindDynoIntelLogSession(user.uid);
        void refreshEntitlement();
      });
    })();

    return () => {
      isDisposed = true;
      unsubscribe?.();
    };
  }, [setFromUser, setLoading, setSignedOut, refreshEntitlement, bindEntitlementSession, bindDynoIntelLogSession]);
}
