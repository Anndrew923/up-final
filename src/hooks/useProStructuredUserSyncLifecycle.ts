import { useEffect } from 'react';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import {
  USER_CLOUD_COLLECTION,
  USER_PROFILE_BASELINE_DOC_ID,
  USER_PROFILE_SUBCOLLECTION,
} from '../services/firestorePaths';
import { getCurrentFirebaseUser, getFirestoreDb } from '../services/firebaseClient';
import {
  canRunStructuredUserSync,
  mergeRemoteProfileIfNewer,
  tryApplyRemoteProfileFromSnapshot,
} from '../services/userStructuredSyncService';
import { captureStructuredSyncSession } from '../services/structuredSyncSession';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';

const SNAPSHOT_DEBOUNCE_MS = 1200;

/**
 * Pro + Google: pull newer remote profile on mount/auth change; subscribe to `profile/baseline` with debounced merge.
 */
export function useProStructuredUserSyncLifecycle(): void {
  const authStatus = useAuthStore((s) => s.status);
  const authUid = useAuthStore((s) => s.uid);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const isPro = useEntitlementStore((s) => s.isPro);

  useEffect(() => {
    const db = getFirestoreDb();
    const user = getCurrentFirebaseUser();
    if (!db || !user || user.uid !== authUid || user.isAnonymous || authStatus !== 'signed-in') {
      return;
    }
    const session = captureStructuredSyncSession();
    if (!session || session.uid !== user.uid) return;

    const ent = useEntitlementStore.getState();
    if (!canRunStructuredUserSync(ent)) {
      return;
    }

    let cancelled = false;
    const pref = doc(
      db,
      USER_CLOUD_COLLECTION,
      user.uid,
      USER_PROFILE_SUBCOLLECTION,
      USER_PROFILE_BASELINE_DOC_ID
    );

    void mergeRemoteProfileIfNewer(ent).catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[structured-sync] bootstrap merge failed', err);
      }
    });

    let snapshotDebounce: ReturnType<typeof setTimeout> | null = null;
    const unsub: Unsubscribe = onSnapshot(
      pref,
      (snap) => {
        if (cancelled) return;
        if (snapshotDebounce) clearTimeout(snapshotDebounce);
        snapshotDebounce = setTimeout(() => {
          snapshotDebounce = null;
          if (cancelled) return;
          const entNow = useEntitlementStore.getState();
          if (!canRunStructuredUserSync(entNow)) return;
          tryApplyRemoteProfileFromSnapshot(entNow, snap, session);
        }, SNAPSHOT_DEBOUNCE_MS);
      },
      (err) => {
        if (!import.meta.env.DEV) return;
        const message = err instanceof Error ? err.message : String(err);
        const looksLikeTransportGlitch =
          /quic|webchannel|transport|network|ERR_/i.test(message) ||
          (typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            String((err as { code?: unknown }).code).includes('unavailable'));
        console.warn(
          looksLikeTransportGlitch
            ? '[structured-sync] Firestore Listen transport glitch (often VPN/QUIC/Wi‑Fi). SDK will retry; local data is unaffected.'
            : '[structured-sync] profile baseline listener',
          err
        );
      }
    );

    return () => {
      cancelled = true;
      if (snapshotDebounce) clearTimeout(snapshotDebounce);
      unsub();
    };
  }, [authStatus, authUid, isAnonymous, isPro]);
}
