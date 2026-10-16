import { getDownloadURL, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import { shouldBlockFirebase } from '../logic/core/entitlement';
import {
  isLadderAvatarDataUrl,
  isLadderAvatarHttpsUrl,
  ladderAvatarDataUrlToBlob,
} from '../logic/core/ladderAvatarUrl';
import type { EntitlementState } from '../types/entitlement';
import { getCurrentFirebaseUser, getFirebaseStorage, getFirestoreDb } from './firebaseClient';
import {
  loadProfile,
  saveProfile,
  type LocalProfile,
} from './localStorageService';
import {
  getLeaderboardIdentityPayload,
  normalizeLadderDisplayName,
  saveLadderIdentity,
  sanitizeAvatarUrlForLeaderboard,
} from './ladderIdentityService';

export const LADDER_AVATAR_STORAGE_FILE = 'avatar.jpg';

/** `ladder-avatars/{uid}/avatar.jpg` — fixed path, overwrite on each sync upload. */
export function ladderAvatarStoragePath(uid: string): string {
  return `ladder-avatars/${uid}/${LADDER_AVATAR_STORAGE_FILE}`;
}

export type EnsureLadderAvatarHttpsResult =
  | { ok: true; avatarUrl?: string }
  | { ok: false; reason: 'upload-failed'; message: string };

/** Coalesces concurrent uploads for the same uid (batch + club + per-shard). */
const inFlightUploadByUid = new Map<string, Promise<EnsureLadderAvatarHttpsResult>>();

function persistHttpsAvatarLocally(uid: string, httpsUrl: string): void {
  const prev = loadProfile();
  const displayName = normalizeLadderDisplayName(prev?.displayName ?? '');
  if (displayName) {
    saveLadderIdentity({ displayName, avatarUrl: httpsUrl });
    return;
  }
  const next: LocalProfile = {
    uid: prev?.uid && prev.uid.length > 0 ? prev.uid : uid,
    displayName: prev?.displayName,
    avatarUrl: httpsUrl,
    updatedAt: new Date().toISOString(),
  };
  saveProfile(next);
}

async function uploadDataUrlToStorage(
  storage: FirebaseStorage,
  uid: string,
  dataUrl: string
): Promise<string> {
  const blob = ladderAvatarDataUrlToBlob(dataUrl);
  const objectRef = ref(storage, ladderAvatarStoragePath(uid));
  const contentType = blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  await uploadBytes(objectRef, blob, {
    contentType,
    customMetadata: {
      uploadedBy: uid,
      uploadedAt: new Date().toISOString(),
    },
  });
  const baseUrl = await getDownloadURL(objectRef);
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}v=${Date.now()}`;
}

/**
 * Upload local `data:` avatar to Storage and persist `https` locally.
 * WHY: Guild Callables only accept https:// — Free club sync must not be Pro-gated.
 * Invariant: `avatarUrl` is always `https://` or absent — never `data:` (Pro memory rows
 * still get data via `resolveLeaderboardAvatarUrlForCloud(preferred)`).
 * Signed-in non-anonymous only; Storage rules already scope to owner uid.
 */
export async function ensureAvatarHttpsUrl(): Promise<EnsureLadderAvatarHttpsResult> {
  const user = getCurrentFirebaseUser();
  if (!user || user.isAnonymous) {
    return { ok: true, avatarUrl: undefined };
  }

  const sanitized = sanitizeAvatarUrlForLeaderboard(loadProfile()?.avatarUrl);
  if (!sanitized) {
    return { ok: true, avatarUrl: undefined };
  }
  if (isLadderAvatarHttpsUrl(sanitized)) {
    return { ok: true, avatarUrl: sanitized };
  }
  if (!isLadderAvatarDataUrl(sanitized)) {
    return { ok: true, avatarUrl: undefined };
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    // Vitest / in-memory ladder — no Storage; leave local data URL on disk for Pro preferred fallback.
    if (!getFirestoreDb()) {
      return { ok: true, avatarUrl: undefined };
    }
    return {
      ok: false,
      reason: 'upload-failed',
      message: 'firebase-storage-not-configured',
    };
  }

  const inFlight = inFlightUploadByUid.get(user.uid);
  if (inFlight) {
    return inFlight;
  }

  const uploadTask = (async (): Promise<EnsureLadderAvatarHttpsResult> => {
    try {
      const httpsUrl = await uploadDataUrlToStorage(storage, user.uid, sanitized);
      const verified = sanitizeAvatarUrlForLeaderboard(httpsUrl);
      if (!verified || !isLadderAvatarHttpsUrl(verified)) {
        return {
          ok: false,
          reason: 'upload-failed',
          message: 'ladder-avatar-invalid-download-url',
        };
      }
      persistHttpsAvatarLocally(user.uid, verified);
      return { ok: true, avatarUrl: verified };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (import.meta.env.DEV) {
        console.warn('[ladder-avatar] Storage upload failed', err);
      }
      return { ok: false, reason: 'upload-failed', message };
    } finally {
      inFlightUploadByUid.delete(user.uid);
    }
  })();

  inFlightUploadByUid.set(user.uid, uploadTask);
  return uploadTask;
}

/**
 * Before Pro ladder Callable writes: Pro-gated wrapper over {@link ensureAvatarHttpsUrl}.
 * Non-Pro / unsigned callers no-op (no Storage traffic on global ladder path).
 */
export async function ensureLadderAvatarHttpsForProSync(
  entitlement: EntitlementState
): Promise<EnsureLadderAvatarHttpsResult> {
  if (shouldBlockFirebase(entitlement, 'leaderboard-write')) {
    return { ok: true, avatarUrl: undefined };
  }
  return ensureAvatarHttpsUrl();
}

/**
 * HTTPS avatar for guild Callables — never returns `data:` (server would strip it).
 * Soft-fails upload: sync continues without portrait rather than blocking score write.
 */
export async function resolveHttpsAvatarForGuildWrite(
  preferred?: string | null
): Promise<string | undefined> {
  const ensured = await ensureAvatarHttpsUrl();
  if (ensured.ok && ensured.avatarUrl && isLadderAvatarHttpsUrl(ensured.avatarUrl)) {
    return ensured.avatarUrl;
  }
  for (const candidate of [preferred, loadProfile()?.avatarUrl]) {
    const sanitized = sanitizeAvatarUrlForLeaderboard(candidate);
    if (sanitized && isLadderAvatarHttpsUrl(sanitized)) return sanitized;
  }
  return undefined;
}

/**
 * Single entry for club create / join / score sync identity payloads.
 * WHY: Keeps every guild Callable path on the same https-only avatar contract.
 */
export async function resolveGuildCallableIdentity(): Promise<{
  displayName?: string;
  avatarUrl?: string;
}> {
  const { displayName, avatarUrl: localAvatar } = getLeaderboardIdentityPayload();
  const avatarUrl = await resolveHttpsAvatarForGuildWrite(localAvatar);
  return {
    ...(displayName ? { displayName } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}
