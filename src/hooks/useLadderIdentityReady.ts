import { useEffect, useState } from 'react';
import { hasLadderIdentityReady, ladderIdentityInitial } from '../logic/core/ladderUploadPolicy';
import {
  LOCAL_PROFILE_CHANGED_EVENT,
  PROFILE_STORAGE_KEY,
  loadProfile,
} from '../services/localStorageService';
import { sanitizeAvatarUrlForLeaderboard } from '../services/ladderIdentityService';

export type LadderIdentitySnapshot = {
  ready: boolean;
  displayName: string;
  initial: string;
  avatarUrl?: string;
};

function readSnapshot(): LadderIdentitySnapshot {
  const profile = loadProfile();
  const displayName = profile?.displayName?.trim() ?? '';
  const avatarUrl = sanitizeAvatarUrlForLeaderboard(profile?.avatarUrl);
  return {
    ready: hasLadderIdentityReady(displayName),
    displayName,
    initial: ladderIdentityInitial(displayName),
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

function snapshotEqual(a: LadderIdentitySnapshot, b: LadderIdentitySnapshot): boolean {
  return (
    a.ready === b.ready &&
    a.displayName === b.displayName &&
    a.initial === b.initial &&
    a.avatarUrl === b.avatarUrl
  );
}

/**
 * Live ladder identity readiness for sync bars.
 * WHY: Buttons must flip from "set identity" → "sync" as soon as the sheet saves,
 * without waiting for a remount or navigation.
 */
export function useLadderIdentityReady(): LadderIdentitySnapshot {
  const [snapshot, setSnapshot] = useState(readSnapshot);

  useEffect(() => {
    const sync = () => {
      setSnapshot((prev) => {
        const next = readSnapshot();
        return snapshotEqual(prev, next) ? prev : next;
      });
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== PROFILE_STORAGE_KEY && e.key !== null) return;
      sync();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(LOCAL_PROFILE_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LOCAL_PROFILE_CHANGED_EVENT, sync);
    };
  }, []);

  return snapshot;
}
