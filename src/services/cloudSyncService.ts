import { useEntitlementStore } from '../stores/entitlementStore';
import { getCloudAdapterForEntitlement } from './localCloudAdapter';
import { loadHistory, loadScores, saveHistory, saveScores } from './localStorageService';

export type CloudSyncOutcome =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'empty-restore' | 'auth-failed' | 'unknown' };

/**
 * Pushes local scores + history to Firestore (Pro + Firebase only).
 */
export async function backupLocalToCloud(): Promise<CloudSyncOutcome> {
  try {
    const ent = useEntitlementStore.getState();
    const adapter = getCloudAdapterForEntitlement(ent);
    if (!(await adapter.isAvailable())) {
      return { ok: false, reason: 'unavailable' };
    }
    await adapter.backup({
      scores: loadScores(),
      history: loadHistory(),
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unknown' };
  }
}

/**
 * Overwrites local scores + history from the latest cloud snapshot.
 */
export async function restoreCloudToLocal(): Promise<CloudSyncOutcome> {
  try {
    const ent = useEntitlementStore.getState();
    const adapter = getCloudAdapterForEntitlement(ent);
    if (!(await adapter.isAvailable())) {
      return { ok: false, reason: 'unavailable' };
    }
    const payload = await adapter.restore();
    if (!payload) {
      return { ok: false, reason: 'empty-restore' };
    }
    saveScores(payload.scores);
    saveHistory(payload.history);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unknown' };
  }
}
