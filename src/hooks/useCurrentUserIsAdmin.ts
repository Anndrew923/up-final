import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { fetchCurrentUserIsAdmin } from '../services/adminEntitlementService';

export type UseCurrentUserIsAdminOptions = {
  /**
   * When false, skip network/cache lookup (e.g. ladder modal while closed).
   * WHY: Modal stays mounted on LadderPage — avoid a Firestore hit for every visitor.
   */
  enabled?: boolean;
};

/**
 * Shared admin flag for UI affordances (settings entry, copyable ladder UID).
 * Fail closed for guests / anonymous; service layer caches within the session.
 */
export function useCurrentUserIsAdmin(
  options?: UseCurrentUserIsAdminOptions
): { isAdmin: boolean; ready: boolean } {
  const enabled = options?.enabled ?? true;
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const uid = useAuthStore((s) => s.uid);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Always fail closed on auth loss — even while the consumer is disabled.
    if (authStatus !== 'signed-in' || isAnonymous || !uid) {
      setIsAdmin(false);
      setReady(authStatus !== 'loading');
      return;
    }

    if (!enabled) return;

    setReady(false);
    void fetchCurrentUserIsAdmin().then((next) => {
      if (cancelled) return;
      setIsAdmin(next);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, authStatus, isAnonymous, uid]);

  return { isAdmin, ready };
}
