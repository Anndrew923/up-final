import type { EntitlementState } from '../types/entitlement';
import type { DynoIntelLogEntry } from '../logic/core/dynoIntelLogTypes';

/**
 * Pro cloud roam backup — stub until Firestore collection ships.
 * WHY: Keeps store free of Firebase SDK imports; dynamic import boundary only.
 */
export async function pushDynoIntelLog(
  _ent: EntitlementState,
  _entry: DynoIntelLogEntry
): Promise<void> {
  // Future: write summary shard to Firestore for Pro roam restore.
}
