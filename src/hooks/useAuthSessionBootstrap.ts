import { useEffect } from 'react';
import {
  consumeFirebaseRedirectResult,
  isGoogleRedirectPending,
  onFirebaseAuthStateChanged,
} from '../services/firebaseClient';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';

/**
 * Initializes Firebase auth observer and mirrors state into auth store.
 */
export function useAuthSessionBootstrap(): void {
  const setLoading = useAuthStore((s) => s.setLoading);
  const setSignedOut = useAuthStore((s) => s.setSignedOut);
  const setFromUser = useAuthStore((s) => s.setFromUser);
  const refreshEntitlement = useEntitlementStore((s) => s.refreshEntitlement);

  useEffect(() => {
    setLoading();
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
          setSignedOut();
          void refreshEntitlement();
          return;
        }
        setFromUser(user);
        void refreshEntitlement();
      });
    })();

    return () => {
      isDisposed = true;
      unsubscribe?.();
    };
  }, [setFromUser, setLoading, setSignedOut, refreshEntitlement]);
}
