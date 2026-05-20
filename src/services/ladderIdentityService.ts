import { getDisplayNameMaxLength } from '../logic/core/identity';
import { loadProfile, saveProfile, type LocalProfile } from './localStorageService';

/**
 * Client-side max length for avatar strings (data URL or HTTPS).
 * Firestore rules allow a slightly higher cap (`firestore.rules`); keep client stricter to reduce doc size.
 */
export const LEADERBOARD_AVATAR_URL_MAX_CHARS = 200_000;

export interface LadderIdentitySnapshot {
  uid: string;
  displayName: string;
  avatarUrl?: string;
}

/** Trims and clamps length for ladder display name (local + Firestore). */
export function normalizeLadderDisplayName(raw: string): string {
  return raw.trim().slice(0, getDisplayNameMaxLength());
}

/**
 * Returns a leaderboard-safe avatar URL, or `undefined` if absent or invalid / oversized.
 * Allows `data:image/jpeg|png;base64,...` and `https://` URLs only.
 */
export function sanitizeAvatarUrlForLeaderboard(
  raw: string | undefined | null
): string | undefined {
  if (raw == null) return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  if (t.length > LEADERBOARD_AVATAR_URL_MAX_CHARS) return undefined;
  if (t.startsWith('https://')) return t;
  if (t.startsWith('data:image/jpeg') || t.startsWith('data:image/jpg')) return t;
  if (t.startsWith('data:image/png')) return t;
  return undefined;
}

export function loadLadderIdentity(): LadderIdentitySnapshot | null {
  const p = loadProfile();
  if (!p?.displayName?.trim()) return null;
  return {
    uid: p.uid,
    displayName: normalizeLadderDisplayName(p.displayName),
    avatarUrl: sanitizeAvatarUrlForLeaderboard(p.avatarUrl),
  };
}

export interface SaveLadderIdentityInput {
  displayName: string;
  /** When set, replaces stored avatar (already compressed data URL or https). */
  avatarUrl?: string | null;
  /** When true, clears `avatarUrl` in storage. */
  clearAvatar?: boolean;
}

/**
 * Persists arena display name + optional avatar on the local profile blob (`up.profile`).
 * `uid` is preserved from an existing profile when present; otherwise `local`.
 */
export function saveLadderIdentity(input: SaveLadderIdentityInput): void {
  const displayName = normalizeLadderDisplayName(input.displayName);
  if (!displayName) {
    throw new Error('ladder-identity-empty-display-name');
  }

  const prev = loadProfile();
  const uid = prev?.uid && prev.uid.length > 0 ? prev.uid : 'local';

  const next: LocalProfile = {
    uid,
    displayName,
    updatedAt: new Date().toISOString(),
  };

  if (input.clearAvatar) {
    // omit avatarUrl
  } else if (input.avatarUrl !== undefined && input.avatarUrl !== null) {
    const safe = sanitizeAvatarUrlForLeaderboard(input.avatarUrl);
    if (safe) next.avatarUrl = safe;
  } else if (prev?.avatarUrl) {
    const safe = sanitizeAvatarUrlForLeaderboard(prev.avatarUrl);
    if (safe) next.avatarUrl = safe;
  }

  saveProfile(next);
}

/** Display name + avatar for `submitLeaderboardScore` input (falls back to empty avatar). */
export function getLeaderboardIdentityPayload(): { displayName: string; avatarUrl?: string } {
  const p = loadProfile();
  const displayName = normalizeLadderDisplayName(p?.displayName ?? '');
  const avatarUrl = sanitizeAvatarUrlForLeaderboard(p?.avatarUrl);
  return { displayName, ...(avatarUrl ? { avatarUrl } : {}) };
}
