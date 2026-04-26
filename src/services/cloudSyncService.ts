import { useEntitlementStore } from '../stores/entitlementStore';
import {
  canRunStructuredUserSync,
  runStructuredBackup,
  runStructuredRestore,
} from './userStructuredSyncService';

export type CloudSyncOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'unavailable'
        | 'empty-restore'
        | 'auth-failed'
        | 'permission-denied'
        | 'unknown';
    };

type CloudSyncErrorReason = Extract<CloudSyncOutcome, { ok: false }>['reason'];

function firebaseErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function mapCloudSyncError(error: unknown): CloudSyncErrorReason {
  if (error instanceof Error && error.message === 'cloud-auth-required') {
    return 'auth-failed';
  }
  if (error instanceof Error && error.message === 'structured-sync-blocked') {
    return 'unavailable';
  }
  const code = firebaseErrorCode(error);
  if (code === 'permission-denied') {
    return 'permission-denied';
  }
  return 'unknown';
}

/**
 * Pushes local profile + all history docs to Firestore (Pro + structured paths; migrates legacy blob once).
 */
export async function backupLocalToCloud(): Promise<CloudSyncOutcome> {
  try {
    const ent = useEntitlementStore.getState();
    if (!canRunStructuredUserSync(ent)) {
      return { ok: false, reason: 'unavailable' };
    }
    await runStructuredBackup(ent);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: mapCloudSyncError(error) };
  }
}

/**
 * Overwrites local scores, inputs, ladder profile, and history from Firestore structured snapshot.
 */
export async function restoreCloudToLocal(): Promise<CloudSyncOutcome> {
  try {
    const ent = useEntitlementStore.getState();
    if (!canRunStructuredUserSync(ent)) {
      return { ok: false, reason: 'unavailable' };
    }
    const restored = await runStructuredRestore(ent);
    if (!restored) {
      return { ok: false, reason: 'empty-restore' };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: mapCloudSyncError(error) };
  }
}
