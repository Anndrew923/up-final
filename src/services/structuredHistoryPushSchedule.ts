import type { EntitlementState } from '../types/entitlement';
import type { LocalHistoryRecord } from './localStorageService';

/**
 * `historyStore` must not statically import `userStructuredSyncService`:
 * the service calls `useHistoryStore` during restore, which would create a module cycle.
 * Push is best-effort after local append already succeeded.
 */
export function scheduleStructuredHistoryPushAfterLocalAppend(
  ent: EntitlementState,
  record: LocalHistoryRecord
): void {
  void import('./userStructuredSyncService')
    .then(({ pushStructuredHistoryRecord }) => pushStructuredHistoryRecord(ent, record))
    .catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[structured-sync] history push failed', err);
      }
    });
}
