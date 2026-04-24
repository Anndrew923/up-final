import { doc, getDoc, setDoc } from 'firebase/firestore';
import { hasProAccess } from '../logic/core/entitlement';
import type { EntitlementState } from '../types/entitlement';
import type { ScoreMap } from '../types/scoring';
import { getCurrentFirebaseUser, getFirestoreDb } from './firebaseClient';
import {
  USER_ARTIFACTS_COLLECTION,
  USER_CLOUD_COLLECTION,
  USER_CLOUD_DOC_ID,
} from './firestorePaths';
import type { LocalHistoryRecord } from './localStorageService';

export interface CloudBackupPayload {
  scores: ScoreMap;
  history: LocalHistoryRecord[];
  updatedAt: string;
}

export interface LocalCloudAdapter {
  isAvailable(): Promise<boolean>;
  backup(payload: CloudBackupPayload): Promise<void>;
  restore(): Promise<CloudBackupPayload | null>;
}

export const noopLocalCloudAdapter: LocalCloudAdapter = {
  async isAvailable() {
    return false;
  },
  async backup() {
    return;
  },
  async restore() {
    return null;
  },
};

function requireCloudUserUid(): string {
  const user = getCurrentFirebaseUser();
  if (!user || user.isAnonymous) {
    throw new Error('cloud-auth-required');
  }
  return user.uid;
}

/**
 * Pro + configured Firebase → Firestore document `users/{uid}/artifacts/up_cloud_sync_v1`.
 */
export function getCloudAdapterForEntitlement(ent: EntitlementState): LocalCloudAdapter {
  const db = getFirestoreDb();

  if (!db || !hasProAccess(ent)) {
    return noopLocalCloudAdapter;
  }

  return {
    async isAvailable() {
      const user = getCurrentFirebaseUser();
      return Boolean(getFirestoreDb()) && hasProAccess(ent) && Boolean(user && !user.isAnonymous);
    },
    async backup(payload: CloudBackupPayload) {
      const dbx = getFirestoreDb();
      if (!dbx || !hasProAccess(ent)) return;
      const uid = requireCloudUserUid();
      await setDoc(
        doc(dbx, USER_CLOUD_COLLECTION, uid, USER_ARTIFACTS_COLLECTION, USER_CLOUD_DOC_ID),
        {
          json: JSON.stringify(payload),
          updatedAt: payload.updatedAt,
        },
        { merge: true }
      );
    },
    async restore() {
      const dbx = getFirestoreDb();
      if (!dbx || !hasProAccess(ent)) return null;
      const uid = requireCloudUserUid();
      const snap = await getDoc(
        doc(dbx, USER_CLOUD_COLLECTION, uid, USER_ARTIFACTS_COLLECTION, USER_CLOUD_DOC_ID)
      );
      if (!snap.exists()) return null;
      const data = snap.data() as { json?: unknown };
      const raw = data.json;
      if (typeof raw !== 'string') return null;
      try {
        return JSON.parse(raw) as CloudBackupPayload;
      } catch {
        return null;
      }
    },
  };
}
