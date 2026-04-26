import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { clearLocalData } from './localStorageService';
import {
  ENTRIES_SUBCOLLECTION,
  LEADERBOARDS_COLLECTION,
  USER_ARTIFACTS_COLLECTION,
  USER_CLOUD_COLLECTION,
  USER_CLOUD_DOC_ID,
} from './firestorePaths';
import {
  getCurrentFirebaseUser,
  getFirestoreDb,
  reauthenticateCurrentGoogleUserWeb,
} from './firebaseClient';
import { useEntitlementStore } from '../stores/entitlementStore';

const LEADERBOARD_METRICS = [
  'strength',
  'explosivePower',
  'explosive_composite',
  'explosive_vertical',
  'explosive_broad',
  'explosive_sprint',
  'cardio',
  'muscleMass',
  'muscleMass_weightKg',
  'muscleMass_ratio',
  'bodyFat',
  'bodyFat_ffmi',
  'armSize',
  'gripStrength',
] as const;

export const ACCOUNT_DELETION_ERROR_CODES = {
  requiresRecentLogin: 'auth/requires-recent-login',
  cloudDeletePartial: 'cloud-delete-partial',
  reauthFail: 'reauth-fail',
  authDeleteFail: 'auth-delete-fail',
  authNotReady: 'auth-not-ready',
  anonymousAccount: 'auth-anonymous-account',
  localCleanupFail: 'local-cleanup-fail',
} as const;

export type AccountDeletionErrorCode =
  (typeof ACCOUNT_DELETION_ERROR_CODES)[keyof typeof ACCOUNT_DELETION_ERROR_CODES];

export interface AccountDeletionSuccess {
  ok: true;
  cloudDeletePartial: boolean;
}

export interface AccountDeletionFailure {
  ok: false;
  code: AccountDeletionErrorCode;
}

export type DeleteAccountResult = AccountDeletionSuccess | AccountDeletionFailure;

function isFirebaseErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === code;
}

/**
 * Delete authenticated account + cloud artifacts + local data.
 * Returns stable error codes for UI mapping and support triage.
 */
export async function deleteSignedInAccount(): Promise<DeleteAccountResult> {
  const user = getCurrentFirebaseUser();
  if (!user) {
    return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.authNotReady };
  }
  if (user.isAnonymous) {
    return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.anonymousAccount };
  }

  try {
    await reauthenticateCurrentGoogleUserWeb();
  } catch (error) {
    if (isFirebaseErrorCode(error, ACCOUNT_DELETION_ERROR_CODES.requiresRecentLogin)) {
      return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.requiresRecentLogin };
    }
    return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.reauthFail };
  }

  const db = getFirestoreDb();
  let cloudDeletePartial = false;
  if (db) {
    const deleteTasks: Promise<unknown>[] = [
      deleteDoc(doc(db, USER_CLOUD_COLLECTION, user.uid, USER_ARTIFACTS_COLLECTION, USER_CLOUD_DOC_ID)),
      ...LEADERBOARD_METRICS.map((metric) =>
        deleteDoc(doc(db, LEADERBOARDS_COLLECTION, metric, ENTRIES_SUBCOLLECTION, user.uid))
      ),
    ];

    const settled = await Promise.allSettled(deleteTasks);
    cloudDeletePartial = settled.some((item) => item.status === 'rejected');
  }

  try {
    await deleteUser(user);
  } catch (error) {
    if (isFirebaseErrorCode(error, ACCOUNT_DELETION_ERROR_CODES.requiresRecentLogin)) {
      return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.requiresRecentLogin };
    }
    return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.authDeleteFail };
  }

  try {
    clearLocalData();
    useEntitlementStore.getState().resetEntitlement();
  } catch {
    return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.localCleanupFail };
  }

  if (cloudDeletePartial) {
    return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.cloudDeletePartial };
  }

  return { ok: true, cloudDeletePartial: false };
}
