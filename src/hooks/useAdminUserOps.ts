import { useCallback, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  CONFIRM_DELETE_ACCOUNT,
  CONFIRM_REMOVE_FROM_LADDER,
  adminDeleteLadderUser,
  adminRemoveUserFromLadder,
  lookupAdminLadderUser,
  type AdminLadderUserLookup,
} from '../services/ladderAdminService';

export type AdminUserOpsBanner =
  | 'idle'
  | 'lookup-fail'
  | 'lookup-not-found'
  | 'remove-ok'
  | 'delete-ok'
  | 'op-fail'
  | 'blocked-admin'
  | 'blocked-self';

export { CONFIRM_DELETE_ACCOUNT, CONFIRM_REMOVE_FROM_LADDER };

export function useAdminUserOps() {
  const currentUid = useAuthStore((s) => s.uid);
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState<AdminLadderUserLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<AdminUserOpsBanner>('idle');

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || busy) return;
    setBusy(true);
    setBanner('idle');
    setLookup(null);
    try {
      const result = await lookupAdminLadderUser(q);
      if (!result?.ok || !result.user) {
        setBanner('lookup-fail');
        return;
      }
      setLookup(result.user);
    } catch (err) {
      const code =
        typeof err === 'object' && err && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      setBanner(code.includes('not-found') ? 'lookup-not-found' : 'lookup-fail');
    } finally {
      setBusy(false);
    }
  }, [busy, query]);

  const removeFromLadder = useCallback(
    async (confirmPhrase: string) => {
      if (!lookup || busy) return false;
      if (currentUid && lookup.uid === currentUid) {
        setBanner('blocked-self');
        return false;
      }
      if (lookup.isAdmin) {
        setBanner('blocked-admin');
        return false;
      }
      setBusy(true);
      setBanner('idle');
      try {
        const result = await adminRemoveUserFromLadder({
          targetUid: lookup.uid,
          confirmPhrase,
        });
        if (!result?.ok) {
          setBanner('op-fail');
          return false;
        }
        setLookup((prev) =>
          prev
            ? {
                ...prev,
                onLadder: false,
                displayName: null,
                avatarUrl: null,
                overallScore: null,
              }
            : null
        );
        setBanner('remove-ok');
        return true;
      } catch {
        setBanner('op-fail');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [busy, currentUid, lookup]
  );

  const deleteUser = useCallback(
    async (confirmPhrase: string) => {
      if (!lookup || busy) return false;
      if (currentUid && lookup.uid === currentUid) {
        setBanner('blocked-self');
        return false;
      }
      if (lookup.isAdmin) {
        setBanner('blocked-admin');
        return false;
      }
      setBusy(true);
      setBanner('idle');
      try {
        const result = await adminDeleteLadderUser({
          targetUid: lookup.uid,
          confirmPhrase,
        });
        if (!result?.ok) {
          setBanner('op-fail');
          return false;
        }
        setLookup(null);
        setQuery('');
        setBanner('delete-ok');
        return true;
      } catch {
        setBanner('op-fail');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [busy, currentUid, lookup]
  );

  return {
    query,
    setQuery,
    lookup,
    busy,
    banner,
    currentUid,
    search,
    removeFromLadder,
    deleteUser,
  };
}
