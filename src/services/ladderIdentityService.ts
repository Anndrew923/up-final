import { isLadderAvatarDataUrl, isLadderAvatarHttpsUrl } from '../logic/core/ladderAvatarUrl';
import { validateLadderDisplayNameForSave } from '../logic/core/ladderDisplayNamePolicy';
import { getDisplayNameMaxLength } from '../logic/core/identity';
import { hasLadderIdentityReady } from '../logic/core/ladderUploadPolicy';
import { parseIsoMs } from '../logic/core/structuredSyncReconcile';
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
  const validated = validateLadderDisplayNameForSave(
    input.displayName,
    getDisplayNameMaxLength()
  );
  if (!validated.ok) {
    if (validated.code === 'profanity') {
      throw new Error('ladder-identity-profanity');
    }
    throw new Error('ladder-identity-empty-display-name');
  }
  const displayName = validated.normalized;

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

/**
 * Picks the https avatar to send on ladder Callable writes after optional Storage upload.
 * WHY: Callers may still hold a stale `data:` URL; post-upload profile / `ensuredHttps` wins.
 */
export function resolveLeaderboardAvatarUrlForCloud(
  preferred?: string | null,
  ensuredFromStorage?: string
): string | undefined {
  const candidates = [
    sanitizeAvatarUrlForLeaderboard(ensuredFromStorage),
    sanitizeAvatarUrlForLeaderboard(preferred ?? undefined),
    sanitizeAvatarUrlForLeaderboard(loadProfile()?.avatarUrl),
  ].filter((v): v is string => Boolean(v));

  for (const url of candidates) {
    if (isLadderAvatarHttpsUrl(url)) return url;
  }
  for (const url of candidates) {
    if (isLadderAvatarDataUrl(url)) return url;
  }
  return undefined;
}

/**
 * Applies remote `profile/baseline` ladder fields without erasing a newer Home identity.
 * Remote https avatar wins when present; otherwise keep local (incl. data URL until Pro ladder sync).
 */
export function mergeLadderProfileWithLocal(remoteBaseline: LocalProfile): LocalProfile {
  const local = loadProfile();
  const remoteName = normalizeLadderDisplayName(remoteBaseline.displayName ?? '');
  const localName = normalizeLadderDisplayName(local?.displayName ?? '');
  const remoteMs = parseIsoMs(remoteBaseline.updatedAt);
  const localMs = parseIsoMs(local?.updatedAt);

  const remoteAvatar = sanitizeAvatarUrlForLeaderboard(remoteBaseline.avatarUrl);
  const localAvatar = sanitizeAvatarUrlForLeaderboard(local?.avatarUrl);

  // WHY: Stale cloud https must not clobber a newer Home pick (data URL until ladder sync uploads).
  let avatarUrl: string | undefined;
  if (localMs > remoteMs && localAvatar) {
    avatarUrl = localAvatar;
  } else if (remoteAvatar && isLadderAvatarHttpsUrl(remoteAvatar)) {
    avatarUrl = remoteAvatar;
  } else if (localAvatar) {
    avatarUrl = localAvatar;
  }

  const displayName =
    localMs > remoteMs && localName ? localName : remoteName || localName || '';

  const uid =
    remoteBaseline.uid?.length > 0
      ? remoteBaseline.uid
      : local?.uid && local.uid.length > 0
        ? local.uid
        : 'local';

  const merged: LocalProfile = {
    uid,
    updatedAt: new Date(Math.max(localMs, remoteMs, Date.now())).toISOString(),
  };
  if (displayName) merged.displayName = displayName;
  if (avatarUrl) merged.avatarUrl = avatarUrl;
  return merged;
}

/**
 * After structured cloud pull merge: never drop a valid local avatar the merge omitted.
 * WHY: Remote baseline omits data URLs; merge timestamps can still yield no `avatarUrl` on disk.
 */
export function finalizeLadderProfileMergeForLocalApply(
  merged: LocalProfile,
  localBeforeApply?: LocalProfile | null
): LocalProfile {
  const prior = sanitizeAvatarUrlForLeaderboard(
    (localBeforeApply ?? loadProfile())?.avatarUrl
  );
  const mergedAvatar = sanitizeAvatarUrlForLeaderboard(merged.avatarUrl);
  if (prior && !mergedAvatar) {
    return { ...merged, avatarUrl: prior };
  }
  return merged;
}

/** Display name + avatar for `submitLeaderboardScore` input (falls back to empty avatar). */
export function getLeaderboardIdentityPayload(): { displayName: string; avatarUrl?: string } {
  const p = loadProfile();
  const displayName = normalizeLadderDisplayName(p?.displayName ?? '');
  const avatarUrl = sanitizeAvatarUrlForLeaderboard(p?.avatarUrl);
  return { displayName, ...(avatarUrl ? { avatarUrl } : {}) };
}

/**
 * Ladder sync entry point. Returns `null` when display name is missing.
 * WHY: Callers must open the identity sheet instead of inventing a ghost nickname.
 * Avatar remains optional (omitted → board / HUD render initials).
 */
export function getLadderUploadIdentity(): { displayName: string; avatarUrl?: string } | null {
  const { displayName, avatarUrl } = getLeaderboardIdentityPayload();
  if (!hasLadderIdentityReady(displayName)) return null;
  return {
    displayName,
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}
