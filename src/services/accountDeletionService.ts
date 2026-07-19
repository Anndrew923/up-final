import { clearLocalData } from './localStorageService';
import {
  getCurrentFirebaseUser,
  reauthenticateCurrentGoogleUserWeb,
  signOutFirebase,
} from './firebaseClient';
import { useEntitlementStore } from '../stores/entitlementStore';
import { deleteAccountOnServer } from './accountDeletionCallableService';

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
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
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

  try {
    await user.getIdToken(true);
    await deleteAccountOnServer();
  } catch (error) {
    if (
      isFirebaseErrorCode(error, 'functions/failed-precondition') ||
      isFirebaseErrorCode(error, ACCOUNT_DELETION_ERROR_CODES.requiresRecentLogin)
    ) {
      return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.requiresRecentLogin };
    }
    return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.cloudDeletePartial };
  }

  // Server already removed Firebase Auth; sign-out only clears local JS/native SDK sessions.
  await signOutFirebase().catch(() => undefined);
  try {
    clearLocalData();
    useEntitlementStore.getState().resetEntitlement();
  } catch {
    return { ok: false, code: ACCOUNT_DELETION_ERROR_CODES.localCleanupFail };
  }

  return { ok: true, cloudDeletePartial: false };
}
