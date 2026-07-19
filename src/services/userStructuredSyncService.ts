/**
 * Pro-only structured Firestore sync (`users/{uid}/profile/baseline` + `users/{uid}/history/{id}`).
 * Replaces monolithic JSON blob for scalability; legacy blob is migrated on first successful backup.
 *
 * Store callers that need `pushStructuredHistoryRecord` must go through `structuredHistoryPushSchedule.ts`
 * (dynamic import) to avoid a module cycle with `historyStore`.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { shouldBlockStructuredUserSync } from '../logic/core/entitlement';
import { isRemoteNewer } from '../logic/core/structuredSyncReconcile';
import type { EntitlementState } from '../types/entitlement';
import { getCurrentFirebaseUser, getFirestoreDb } from './firebaseClient';
import {
  USER_ARTIFACTS_COLLECTION,
  USER_CLOUD_COLLECTION,
  USER_CLOUD_DOC_ID,
  USER_HISTORY_SUBCOLLECTION,
  USER_PROFILE_BASELINE_DOC_ID,
  USER_PROFILE_SUBCOLLECTION,
} from './firestorePaths';
import { isLadderAvatarHttpsUrl } from '../logic/core/ladderAvatarUrl';
import {
  finalizeLadderProfileMergeForLocalApply,
  mergeLadderProfileWithLocal,
  sanitizeAvatarUrlForLeaderboard,
} from './ladderIdentityService';
import type { LocalHistoryRecord } from './localStorageService';
import {
  loadArmSizeInputs,
  loadCardioInputs,
  loadFfmiDraft,
  loadGripInputs,
  loadHistory,
  loadMuscleInputs,
  loadPhysicalProfile,
  loadPowerInputs,
  loadProfile,
  type LocalProfile,
  loadScores,
  loadStrengthInputs,
  saveArmSizeInputs,
  saveCardioInputs,
  saveFfmiDraft,
  saveGripInputs,
  saveHistory,
  saveMuscleInputs,
  savePhysicalProfile,
  savePowerInputs,
  saveProfile,
  saveStrengthInputs,
} from './localStorageService';
import {
  STRUCTURED_PROFILE_SCHEMA_VERSION,
  type StructuredProfileFirestoreV1,
  historyRecordToFirestore,
  parseFirestoreHistoryDoc,
} from './structuredUserSyncPayload';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';
import { useEntitlementStore } from '../stores/entitlementStore';
import { useScoreStore } from '../stores/scoreStore';
import type { ScoreMap } from '../types/scoring';
import { isLocalHistoryRecord } from '../logic/core/localHistoryRecord';
import {
  captureStructuredSyncSession,
  isStructuredSyncSessionCurrent,
  registerStructuredSyncTimer,
  releaseStructuredSyncTimer,
  type StructuredSyncSession,
} from './structuredSyncSession';

const WATERMARK_KEY_PREFIX = 'up.structuredSync.lastAppliedRemoteProfileUpdatedAt';
const watermarkKey = (uid: string) => `${WATERMARK_KEY_PREFIX}:${uid}`;
const HISTORY_BATCH_SIZE = 400;

function requireNonAnonymousUid(): string {
  const user = getCurrentFirebaseUser();
  if (!user || user.isAnonymous) {
    throw new Error('cloud-auth-required');
  }
  return user.uid;
}

function profileRef(db: Firestore, uid: string) {
  return doc(
    db,
    USER_CLOUD_COLLECTION,
    uid,
    USER_PROFILE_SUBCOLLECTION,
    USER_PROFILE_BASELINE_DOC_ID
  );
}

function historyRef(db: Firestore, uid: string, recordId: string) {
  return doc(db, USER_CLOUD_COLLECTION, uid, USER_HISTORY_SUBCOLLECTION, recordId);
}

function legacyBlobRef(db: Firestore, uid: string) {
  return doc(db, USER_CLOUD_COLLECTION, uid, USER_ARTIFACTS_COLLECTION, USER_CLOUD_DOC_ID);
}

/** True when Firestore + signed-in non-anonymous user are ready (Pro check is separate). */
export function structuredFirestoreSessionReady(): boolean {
  const db = getFirestoreDb();
  const user = getCurrentFirebaseUser();
  return Boolean(db && user && !user.isAnonymous);
}

export function canRunStructuredUserSync(ent: EntitlementState): boolean {
  return !shouldBlockStructuredUserSync(ent) && structuredFirestoreSessionReady();
}

/** Pro structured sync stores https ladder avatars only — never multi‑100KB `data:` blobs. */
function stripDataUrlFromLadderProfile(
  profile: import('./localStorageService').LocalProfile | null | undefined
): import('./localStorageService').LocalProfile | null {
  if (!profile) return null;
  const safeUrl = sanitizeAvatarUrlForLeaderboard(profile.avatarUrl);
  const next: import('./localStorageService').LocalProfile = { ...profile };
  if (safeUrl && isLadderAvatarHttpsUrl(safeUrl)) {
    next.avatarUrl = safeUrl;
  } else {
    delete next.avatarUrl;
  }
  return next;
}

/**
 * Omits `ladderProfile` when the portrait is still a local data URL so push does not
 * overwrite cloud with an avatar-stripped snapshot (主控台 sync / radar debounce).
 */
export function ladderProfileForStructuredPush(): LocalProfile | null | undefined {
  const profile = loadProfile();
  if (!profile) return undefined;
  const localAvatar = sanitizeAvatarUrlForLeaderboard(profile.avatarUrl);
  if (localAvatar && !isLadderAvatarHttpsUrl(localAvatar)) {
    return undefined;
  }
  return stripDataUrlFromLadderProfile(profile);
}

export function buildStructuredProfileFromLocal(nowIso: string): StructuredProfileFirestoreV1 {
  const ladderProfile = ladderProfileForStructuredPush();
  return {
    schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
    updatedAt: nowIso,
    scores: loadScores(),
    ...(ladderProfile !== undefined ? { ladderProfile } : {}),
    physicalProfile: loadPhysicalProfile(),
    ffmiDraft: loadFfmiDraft(),
    cardioInputs: loadCardioInputs(),
    muscleInputs: loadMuscleInputs(),
    powerInputs: loadPowerInputs(),
    strengthInputs: loadStrengthInputs(),
    gripInputs: loadGripInputs(),
    armSizeInputs: loadArmSizeInputs(),
  };
}

export function applyStructuredProfileToLocal(data: StructuredProfileFirestoreV1): void {
  useScoreStore.getState().setScores(data.scores ?? {});
  if (data.physicalProfile) savePhysicalProfile(data.physicalProfile);
  if (data.ffmiDraft) saveFfmiDraft(data.ffmiDraft);
  if (data.cardioInputs) saveCardioInputs(data.cardioInputs);
  if (data.muscleInputs) saveMuscleInputs(data.muscleInputs);
  if (data.powerInputs) savePowerInputs(data.powerInputs);
  if (data.strengthInputs) saveStrengthInputs(data.strengthInputs);
  if (data.gripInputs) saveGripInputs(data.gripInputs);
  if (data.armSizeInputs) saveArmSizeInputs(data.armSizeInputs);
  if (data.ladderProfile && typeof data.ladderProfile.uid === 'string') {
    const localBefore = loadProfile();
    const remote = stripDataUrlFromLadderProfile(data.ladderProfile);
    if (remote) {
      const merged = mergeLadderProfileWithLocal(remote);
      saveProfile(finalizeLadderProfileMergeForLocalApply(merged, localBefore));
    }
  }
}

function readWatermark(uid: string): string | null {
  return safeGetItem(watermarkKey(uid));
}

function writeWatermark(uid: string, iso: string): void {
  safeSetItem(watermarkKey(uid), iso);
}

async function commitHistoryBatchWrites(
  db: Firestore,
  uid: string,
  entries: Array<{ record: LocalHistoryRecord; cloudAt: string }>,
  expectedSession?: StructuredSyncSession
): Promise<void> {
  for (let i = 0; i < entries.length; i += HISTORY_BATCH_SIZE) {
    if (expectedSession && !isStructuredSyncSessionCurrent(expectedSession)) {
      throw new Error('structured-sync-session-changed');
    }
    const slice = entries.slice(i, i + HISTORY_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const { record, cloudAt } of slice) {
      batch.set(historyRef(db, uid, record.id), historyRecordToFirestore(record, cloudAt), {
        merge: true,
      });
    }
    await batch.commit();
  }
}

/**
 * Migrates legacy `artifacts/up_cloud_sync_v1` JSON into profile + history subdocs (idempotent merges).
 */
export async function migrateLegacyBlobToStructuredIfPresent(
  ent: EntitlementState,
  db: Firestore,
  uid: string,
  expectedSession?: StructuredSyncSession
): Promise<void> {
  if (shouldBlockStructuredUserSync(ent)) return;
  if (expectedSession && !isStructuredSyncSessionCurrent(expectedSession)) {
    throw new Error('structured-sync-session-changed');
  }

  const legacySnap = await getDoc(legacyBlobRef(db, uid));
  if (expectedSession && !isStructuredSyncSessionCurrent(expectedSession)) {
    throw new Error('structured-sync-session-changed');
  }
  if (!legacySnap.exists()) return;

  const raw = legacySnap.data() as { json?: unknown };
  if (typeof raw.json !== 'string') return;

  let parsed: { scores?: ScoreMap; history?: LocalHistoryRecord[]; updatedAt?: string };
  try {
    parsed = JSON.parse(raw.json) as typeof parsed;
  } catch {
    return;
  }

  const migratedAt = new Date().toISOString();
  const baseProfile: StructuredProfileFirestoreV1 = {
    schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : migratedAt,
    scores: parsed.scores && typeof parsed.scores === 'object' ? parsed.scores : {},
    legacyBlobMigratedAt: migratedAt,
  };

  await setDoc(profileRef(db, uid), baseProfile, { merge: true });

  const hist = Array.isArray(parsed.history) ? parsed.history : [];
  const batchEntries: Array<{ record: LocalHistoryRecord; cloudAt: string }> = [];
  for (const row of hist) {
    if (!isLocalHistoryRecord(row)) continue;
    batchEntries.push({
      record: row,
      cloudAt: migratedAt,
    });
  }
  await commitHistoryBatchWrites(db, uid, batchEntries, expectedSession);
}

export async function pushStructuredProfileFromLocal(
  ent: EntitlementState,
  expectedSession?: StructuredSyncSession
): Promise<void> {
  if (expectedSession && !isStructuredSyncSessionCurrent(expectedSession)) return;
  if (!canRunStructuredUserSync(ent)) return;
  const db = getFirestoreDb();
  if (!db) return;
  const uid = requireNonAnonymousUid();
  if (expectedSession && uid !== expectedSession.uid) return;
  const payload = buildStructuredProfileFromLocal(new Date().toISOString());
  await setDoc(profileRef(db, uid), payload, { merge: true });
  // WHY: Skip echo apply of our own push (stripped ladderProfile would merge away data URL avatars).
  if (!expectedSession || isStructuredSyncSessionCurrent(expectedSession)) {
    writeWatermark(uid, payload.updatedAt);
  }
}

export async function pushAllStructuredHistoryFromLocal(
  ent: EntitlementState,
  expectedSession?: StructuredSyncSession
): Promise<void> {
  if (expectedSession && !isStructuredSyncSessionCurrent(expectedSession)) return;
  if (!canRunStructuredUserSync(ent)) return;
  const db = getFirestoreDb();
  if (!db) return;
  const uid = requireNonAnonymousUid();
  if (expectedSession && uid !== expectedSession.uid) return;
  const now = new Date().toISOString();
  const entries = loadHistory().map((record) => ({ record, cloudAt: now }));
  await commitHistoryBatchWrites(db, uid, entries, expectedSession);
}

export async function pushStructuredHistoryRecord(
  ent: EntitlementState,
  record: LocalHistoryRecord,
  expectedSession?: StructuredSyncSession
): Promise<void> {
  if (expectedSession && !isStructuredSyncSessionCurrent(expectedSession)) return;
  if (!canRunStructuredUserSync(ent)) return;
  const db = getFirestoreDb();
  if (!db) return;
  const uid = requireNonAnonymousUid();
  if (expectedSession && uid !== expectedSession.uid) return;
  await commitHistoryBatchWrites(
    db,
    uid,
    [{ record, cloudAt: new Date().toISOString() }],
    expectedSession
  );
}

/**
 * Full backup: migrate legacy blob if present, push profile + all history docs.
 */
export async function runStructuredBackup(ent: EntitlementState): Promise<void> {
  if (!canRunStructuredUserSync(ent)) {
    throw new Error('structured-sync-blocked');
  }
  const db = getFirestoreDb();
  if (!db) throw new Error('structured-sync-blocked');
  const session = captureStructuredSyncSession();
  if (!session) throw new Error('structured-sync-blocked');
  const uid = requireNonAnonymousUid();
  if (uid !== session.uid) throw new Error('structured-sync-session-changed');

  await migrateLegacyBlobToStructuredIfPresent(ent, db, uid, session);
  if (!isStructuredSyncSessionCurrent(session)) {
    throw new Error('structured-sync-session-changed');
  }
  await pushStructuredProfileFromLocal(ent, session);
  if (!isStructuredSyncSessionCurrent(session)) {
    throw new Error('structured-sync-session-changed');
  }
  await pushAllStructuredHistoryFromLocal(ent, session);
  if (!isStructuredSyncSessionCurrent(session)) {
    throw new Error('structured-sync-session-changed');
  }
}

/**
 * Overwrite local state from Firestore profile + all history subdocuments.
 */
export async function runStructuredRestore(ent: EntitlementState): Promise<boolean> {
  if (!canRunStructuredUserSync(ent)) {
    throw new Error('structured-sync-blocked');
  }
  const session = captureStructuredSyncSession();
  if (!session) throw new Error('structured-sync-blocked');
  const db = getFirestoreDb();
  if (!db) throw new Error('structured-sync-blocked');
  const uid = requireNonAnonymousUid();
  if (uid !== session.uid) throw new Error('structured-sync-session-changed');

  const profileSnap = await getDoc(profileRef(db, uid));
  if (!isStructuredSyncSessionCurrent(session)) {
    throw new Error('structured-sync-session-changed');
  }
  if (!profileSnap.exists()) {
    return false;
  }

  const data = profileSnap.data() as StructuredProfileFirestoreV1;
  if (
    data.schemaVersion !== STRUCTURED_PROFILE_SCHEMA_VERSION ||
    typeof data.updatedAt !== 'string'
  ) {
    return false;
  }

  const histCol = collection(db, USER_CLOUD_COLLECTION, uid, USER_HISTORY_SUBCOLLECTION);
  const histSnap = await getDocs(histCol);
  if (!isStructuredSyncSessionCurrent(session)) {
    throw new Error('structured-sync-session-changed');
  }
  const merged: LocalHistoryRecord[] = [];
  histSnap.forEach((d) => {
    const parsed = parseFirestoreHistoryDoc(d.data());
    if (parsed) merged.push(parsed);
  });

  merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const capped = merged.slice(0, 200);
  applyStructuredProfileToLocal(data);
  saveHistory(capped);
  writeWatermark(uid, data.updatedAt);
  return true;
}

/**
 * When remote profile is newer than local watermark, pull profile fields (scores + inputs) without replacing history.
 */
export async function mergeRemoteProfileIfNewer(ent: EntitlementState): Promise<boolean> {
  if (!canRunStructuredUserSync(ent)) return false;
  const session = captureStructuredSyncSession();
  if (!session) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  const uid = requireNonAnonymousUid();
  if (uid !== session.uid) return false;
  const snap = await getDoc(profileRef(db, uid));
  if (!isStructuredSyncSessionCurrent(session)) return false;
  if (!snap.exists()) return false;
  return tryApplyRemoteProfileFromSnapshot(ent, snap, session);
}

/**
 * Applies remote profile from a listener snapshot when strictly newer than local watermark (avoids extra getDoc).
 */
export function tryApplyRemoteProfileFromSnapshot(
  ent: EntitlementState,
  snap: DocumentSnapshot,
  expectedSession?: StructuredSyncSession
): boolean {
  if (expectedSession && !isStructuredSyncSessionCurrent(expectedSession)) return false;
  if (!canRunStructuredUserSync(ent) || !snap.exists()) return false;
  const uid = expectedSession?.uid ?? getCurrentFirebaseUser()?.uid;
  if (!uid) return false;
  const data = snap.data() as StructuredProfileFirestoreV1;
  if (
    data.schemaVersion !== STRUCTURED_PROFILE_SCHEMA_VERSION ||
    typeof data.updatedAt !== 'string'
  ) {
    return false;
  }
  const localMark = readWatermark(uid);
  if (!isRemoteNewer(data.updatedAt, localMark)) {
    return false;
  }
  applyStructuredProfileToLocal(data);
  writeWatermark(uid, data.updatedAt);
  return true;
}

let profilePushTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced profile push after radar submits (coalesces rapid writes). */
export function queueStructuredProfilePushDebounced(ent: EntitlementState, delayMs = 800): void {
  if (!canRunStructuredUserSync(ent)) return;
  const session = captureStructuredSyncSession();
  if (!session) return;
  if (profilePushTimer) {
    clearTimeout(profilePushTimer);
    releaseStructuredSyncTimer(profilePushTimer);
  }
  profilePushTimer = setTimeout(() => {
    const timer = profilePushTimer;
    profilePushTimer = null;
    if (timer) releaseStructuredSyncTimer(timer);
    if (!isStructuredSyncSessionCurrent(session)) return;
    const ent = useEntitlementStore.getState();
    if (!canRunStructuredUserSync(ent)) return;
    const currentUid = requireNonAnonymousUid();
    if (currentUid !== session.uid) return;
    void pushStructuredProfileFromLocal(ent).catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[structured-sync] debounced profile push failed', err);
      }
    });
  }, delayMs);
  registerStructuredSyncTimer(profilePushTimer);
}

export function queueStructuredProfilePushFromCurrentEntitlement(delayMs = 800): void {
  queueStructuredProfilePushDebounced(useEntitlementStore.getState(), delayMs);
}
