import type { DynoIntelLogEntry } from './dynoIntelLogTypes';
import type { DynoIntelPriorTurnV1 } from './dynoIntelTypes';

/**
 * Builds the callable `priorTurn` snapshot from the newest local uplink log.
 *
 * WHY (client-owned memory): Dyno Intel logs live on-device. Cloud Functions cannot
 * read dynoIntelLog, so multi-turn pantheon anaphora must ride on the request
 * payload — never by having CF scrape conversation history.
 */
export function resolveDynoIntelPriorTurnFromLog(
  entry: Pick<DynoIntelLogEntry, 'focusAxis' | 'userQuestion'> | null | undefined
): DynoIntelPriorTurnV1 | null {
  if (!entry) return null;
  const focusAxis = typeof entry.focusAxis === 'string' ? entry.focusAxis.trim() : '';
  const userQuestion =
    typeof entry.userQuestion === 'string' ? entry.userQuestion.trim() : '';
  if (!focusAxis || !userQuestion) return null;
  return { focusAxis, userQuestion };
}
