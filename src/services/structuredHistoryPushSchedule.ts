import type { EntitlementState } from '../types/entitlement';
import { useEntitlementStore } from '../stores/entitlementStore';
import { shouldBlockStructuredUserSync } from '../logic/core/entitlement';
import type { LocalHistoryRecord } from './localStorageService';
import {
  captureStructuredSyncSession,
  isStructuredSyncSessionCurrent,
  registerStructuredSyncTimer,
  releaseStructuredSyncTimer,
} from './structuredSyncSession';
import { pushStructuredHistoryRecord } from './userStructuredSyncService';

/**
 * `historyStore` must not statically import `userStructuredSyncService`:
 * the service calls `useHistoryStore` during restore, which would create a module cycle.
 * Push is best-effort after local append already succeeded.
 */
export function scheduleStructuredHistoryPushAfterLocalAppend(
  ent: EntitlementState,
  record: LocalHistoryRecord
): void {
  if (shouldBlockStructuredUserSync(ent)) return;
  const session = captureStructuredSyncSession();
  if (!session) return;

  const timer = setTimeout(() => {
    releaseStructuredSyncTimer(timer);
    if (!isStructuredSyncSessionCurrent(session)) return;

    void pushStructuredHistoryRecord(useEntitlementStore.getState(), record, session)
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('[structured-sync] history push failed', err);
        }
      });
  }, 0);
  registerStructuredSyncTimer(timer);
}
