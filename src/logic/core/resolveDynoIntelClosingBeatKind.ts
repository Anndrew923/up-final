import type { DynoClosingBeatKind, DynoIntelContextV1 } from './dynoIntelTypes';
import { resolveDynoQuestionIntent } from './resolveDynoIntelQuestionFocus';

function stableBeatVariant(seed: string): 0 | 1 | 2 {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 3) as 0 | 1 | 2;
}

/**
 * Selects beat-3 sentence-2 mode — kills evergreen assessment-page ad on status/progress replies.
 * WHY: ~33% passion-close vs ~67% return-ritual keeps ritual as default cadence without losing heat spikes.
 */
export function resolveDynoIntelClosingBeatKind(
  userQuestion: string,
  context: Pick<DynoIntelContextV1, 'generatedAt'>
): DynoClosingBeatKind {
  const intent = resolveDynoQuestionIntent(userQuestion);
  if (intent === 'methodology') return 'methodology-nudge';

  const seed = `${context.generatedAt}:${userQuestion.trim()}`;
  return stableBeatVariant(seed) === 0 ? 'passion-close' : 'return-ritual';
}

export function resolveClosingBeatVariantIndex(userQuestion: string, generatedAt: string): 0 | 1 | 2 {
  return stableBeatVariant(`${generatedAt}:${userQuestion.trim()}`);
}
