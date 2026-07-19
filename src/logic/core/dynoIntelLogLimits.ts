import type { DynoIntelLogEntry } from './dynoIntelLogTypes';

export const DYNO_INTEL_LOCAL_LOG_CAP = 100;

/**
 * Device safety boundary shared by every entitlement tier.
 * WHY: Dyno logs live in one localStorage value per UID; a hard FIFO cap keeps
 * the JSON shard bounded and prevents paid usage volume from exhausting storage.
 */
export function enforceDynoIntelLogCap(
  entries: DynoIntelLogEntry[],
  cap = DYNO_INTEL_LOCAL_LOG_CAP
): DynoIntelLogEntry[] {
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  return sorted.slice(0, cap);
}

export function appendDynoIntelLogEntry(
  existing: readonly DynoIntelLogEntry[],
  entry: DynoIntelLogEntry
): DynoIntelLogEntry[] {
  const next = [entry, ...existing];
  return enforceDynoIntelLogCap(next);
}

/** Newest-first ordering for restore UI and accordion display. */
export function sortDynoIntelLogsNewestFirst(
  entries: readonly DynoIntelLogEntry[]
): DynoIntelLogEntry[] {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp);
}
