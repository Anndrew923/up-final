import { hasProAccess } from '../logic/core/entitlement';
import type { EntitlementState } from '../types/entitlement';
import type { DynoIntelLogEntry } from '../logic/core/dynoIntelLogTypes';

/**
 * Best-effort Pro cloud sync after local append — decoupled via dynamic import.
 * WHY: Mirrors structuredHistoryPushSchedule; never blocks local-first write path.
 */
export function scheduleDynoIntelLogCloudSync(
  ent: EntitlementState,
  entry: DynoIntelLogEntry
): void {
  if (!hasProAccess(ent)) return;
  void import('./dynoIntelLogFirestoreSync')
    .then(({ pushDynoIntelLog }) => pushDynoIntelLog(ent, entry))
    .catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[dyno-intel-log] cloud sync stub failed', err);
      }
    });
}
