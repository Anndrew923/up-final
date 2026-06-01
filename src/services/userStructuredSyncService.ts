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
import { sanitizeAvatarUrlForLeaderboard } from './ladderIdentityService';
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
import { useHistoryStore } from '../stores/historyStore';
import { useScoreStore } from '../stores/scoreStore';
import type { ScoreMap } from '../types/scoring';

const WATERMARK_KEY = 'up.structuredSync.lastAppliedRemoteProfileUpdatedAt';
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

export function buildStructuredProfileFromLocal(nowIso: string): StructuredProfileFirestoreV1 {
  return {
    schemaVersion: STRUCTURED_PROFILE_SCHEMA_VERSION,
    updatedAt: nowIso,
    scores: loadScores(),
    ladderProfile: stripDataUrlFromLadderProfile(loadProfile()),
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
    const p = stripDataUrlFromLadderProfile(data.ladderProfile);
    if (p) saveProfile(p);
  }
}

function readWatermark(): string | null {
  return safeGetItem(WATERMARK_KEY);
}

function writeWatermark(iso: string): void {
  safeSetItem(WATERMARK_KEY, iso);
}

async function commitHistoryBatchWrites(
  db: Firestore,
  uid: string,
  entries: Array<{ record: LocalHistoryRecord; cloudAt: string }>
): Promise<void> {
  for (let i = 0; i < entries.length; i += HISTORY_BATCH_SIZE) {
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
  uid: string
): Promise<void> {
  if (shouldBlockStructuredUserSync(ent)) return;

  const legacySnap = await getDoc(legacyBlobRef(db, uid));
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
    if (!row?.id || typeof row.createdAt !== 'string') continue;
    batchEntries.push({
      record: {
        id: String(row.id),
        createdAt: row.createdAt,
        scores: (row.scores && typeof row.scores === 'object' ? row.scores : {}) as ScoreMap,
        overallScore: typeof row.overallScore === 'number' ? row.overallScore : 0,
        ...(typeof row.note === 'string' ? { note: row.note } : {}),
      },
      cloudAt: migratedAt,
    });
  }
  await commitHistoryBatchWrites(db, uid, batchEntries);
}

export async function pushStructuredProfileFromLocal(ent: EntitlementState): Promise<void> {
  if (!canRunStructuredUserSync(ent)) return;
  const db = getFirestoreDb();
  if (!db) return;
  const uid = requireNonAnonymousUid();
  const payload = buildStructuredProfileFromLocal(new Date().toISOString());
  await setDoc(profileRef(db, uid), payload, { merge: true });
}

export async function pushAllStructuredHistoryFromLocal(ent: EntitlementState): Promise<void> {
  if (!canRunStructuredUserSync(ent)) return;
  const db = getFirestoreDb();
  if (!db) return;
  const uid = requireNonAnonymousUid();
  const now = new Date().toISOString();
  const entries = loadHistory().map((record) => ({ record, cloudAt: now }));
  await commitHistoryBatchWrites(db, uid, entries);
}

export async function pushStructuredHistoryRecord(
  ent: EntitlementState,
  record: LocalHistoryRecord
): Promise<void> {
  if (!canRunStructuredUserSync(ent)) return;
  const db = getFirestoreDb();
  if (!db) return;
  const uid = requireNonAnonymousUid();
  await commitHistoryBatchWrites(db, uid, [{ record, cloudAt: new Date().toISOString() }]);
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
  const uid = requireNonAnonymousUid();

  await migrateLegacyBlobToStructuredIfPresent(ent, db, uid);
  await pushStructuredProfileFromLocal(ent);
  await pushAllStructuredHistoryFromLocal(ent);
}

/**
 * Overwrite local state from Firestore profile + all history subdocuments.
 */
export async function runStructuredRestore(ent: EntitlementState): Promise<boolean> {
  if (!canRunStructuredUserSync(ent)) {
    throw new Error('structured-sync-blocked');
  }
  const db = getFirestoreDb();
  if (!db) throw new Error('structured-sync-blocked');
  const uid = requireNonAnonymousUid();

  const profileSnap = await getDoc(profileRef(db, uid));
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

  applyStructuredProfileToLocal(data);

  const histCol = collection(db, USER_CLOUD_COLLECTION, uid, USER_HISTORY_SUBCOLLECTION);
  const histSnap = await getDocs(histCol);
  const merged: LocalHistoryRecord[] = [];
  histSnap.forEach((d) => {
    const parsed = parseFirestoreHistoryDoc(d.data());
    if (parsed) merged.push(parsed);
  });

  merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const capped = merged.slice(0, 200);
  saveHistory(capped);
  useHistoryStore.getState().loadLocalHistory();
  writeWatermark(data.updatedAt);
  return true;
}

/**
 * When remote profile is newer than local watermark, pull profile fields (scores + inputs) without replacing history.
 */
export async function mergeRemoteProfileIfNewer(ent: EntitlementState): Promise<boolean> {
  if (!canRunStructuredUserSync(ent)) return false;
  const db = getFirestoreDb();
  if (!db) return false;
  const uid = requireNonAnonymousUid();
  const snap = await getDoc(profileRef(db, uid));
  if (!snap.exists()) return false;
  return tryApplyRemoteProfileFromSnapshot(ent, snap);
}

/**
 * Applies remote profile from a listener snapshot when strictly newer than local watermark (avoids extra getDoc).
 */
export function tryApplyRemoteProfileFromSnapshot(
  ent: EntitlementState,
  snap: DocumentSnapshot
): boolean {
  if (!canRunStructuredUserSync(ent) || !snap.exists()) return false;
  const data = snap.data() as StructuredProfileFirestoreV1;
  if (
    data.schemaVersion !== STRUCTURED_PROFILE_SCHEMA_VERSION ||
    typeof data.updatedAt !== 'string'
  ) {
    return false;
  }
  const localMark = readWatermark();
  if (!isRemoteNewer(data.updatedAt, localMark)) {
    return false;
  }
  applyStructuredProfileToLocal(data);
  writeWatermark(data.updatedAt);
  return true;
}

let profilePushTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced profile push after radar submits (coalesces rapid writes). */
export function queueStructuredProfilePushDebounced(ent: EntitlementState, delayMs = 800): void {
  if (!canRunStructuredUserSync(ent)) return;
  if (profilePushTimer) clearTimeout(profilePushTimer);
  profilePushTimer = setTimeout(() => {
    profilePushTimer = null;
    const ent = useEntitlementStore.getState();
    if (!canRunStructuredUserSync(ent)) return;
    void pushStructuredProfileFromLocal(ent).catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[structured-sync] debounced profile push failed', err);
      }
    });
  }, delayMs);
}

export function queueStructuredProfilePushFromCurrentEntitlement(delayMs = 800): void {
  queueStructuredProfilePushDebounced(useEntitlementStore.getState(), delayMs);
}
