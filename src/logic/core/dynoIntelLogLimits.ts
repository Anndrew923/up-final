import type { DynoIntelLogEntry } from './dynoIntelLogTypes';

export const DYNO_INTEL_CORE_LOG_CAP = 5;

/**
 * Core users: FIFO cap by newest timestamp. Pro: local unlimited (strategy 1).
 * WHY: Core 5-entry moat; Pro unlimited local archive before cloud roam ships.
 */
export function enforceDynoIntelLogCap(
  entries: DynoIntelLogEntry[],
  isPro: boolean,
  cap = DYNO_INTEL_CORE_LOG_CAP
): DynoIntelLogEntry[] {
  if (isPro) return entries;
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  return sorted.slice(0, cap);
}

export function appendDynoIntelLogEntry(
  existing: readonly DynoIntelLogEntry[],
  entry: DynoIntelLogEntry,
  isPro: boolean
): DynoIntelLogEntry[] {
  const next = [entry, ...existing];
  return enforceDynoIntelLogCap(next, isPro);
}

/** Newest-first ordering for restore UI and accordion display. */
export function sortDynoIntelLogsNewestFirst(
  entries: readonly DynoIntelLogEntry[]
): DynoIntelLogEntry[] {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp);
}
