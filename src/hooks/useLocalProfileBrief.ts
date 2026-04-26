import { useEffect, useState } from 'react';
import {
  LOCAL_PROFILE_CHANGED_EVENT,
  PROFILE_STORAGE_KEY,
  loadProfile,
} from '../services/localStorageService';
import { sanitizeAvatarUrlForLeaderboard } from '../services/ladderIdentityService';

export type LocalProfileBrief = {
  initial: string;
  displayName?: string;
  avatarUrl?: string;
};

function computeBrief(): LocalProfileBrief {
  const profile = loadProfile();
  const displayName = profile?.displayName?.trim();
  const initial = displayName && displayName.length > 0 ? displayName.charAt(0).toUpperCase() : 'U';
  const avatarUrl = sanitizeAvatarUrlForLeaderboard(profile?.avatarUrl);
  return {
    initial,
    displayName,
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

function briefEqual(a: LocalProfileBrief, b: LocalProfileBrief): boolean {
  return a.initial === b.initial && a.displayName === b.displayName && a.avatarUrl === b.avatarUrl;
}

/** Initial / display label from persisted local profile (Core path); updates after save / clear / other tabs. */
export function useLocalProfileBrief(): LocalProfileBrief {
  const [brief, setBrief] = useState(computeBrief);

  useEffect(() => {
    const sync = () => {
      setBrief((prev) => {
        const next = computeBrief();
        return briefEqual(prev, next) ? prev : next;
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

  return brief;
}
