import type { TFunction } from 'i18next';
import type { DynoClosingBeatKind, DynoIntelContextV1 } from './dynoIntelTypes';
import { resolveClosingBeatVariantIndex } from './resolveDynoIntelClosingBeatKind';

const PASSION_KEYS = ['passionClose0', 'passionClose1', 'passionClose2'] as const;
const RITUAL_KEYS = ['returnRitual0', 'returnRitual1', 'returnRitual2'] as const;

function formatScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

/**
 * Pre-resolves beat-3 sentence 2 for Callable — model must paraphrase, not invent routes.
 */
export function resolveDynoIntelClosingBeatSecondLine(
  closingBeatKind: DynoClosingBeatKind,
  context: DynoIntelContextV1,
  t: TFunction,
  userQuestion = ''
): string {
  if (closingBeatKind === 'methodology-nudge') {
    return context.assessmentDeepDiveNudge;
  }

  const variant = resolveClosingBeatVariantIndex(userQuestion, context.generatedAt);
  const focusSnap =
    (context.questionFocusAxis
      ? context.axes.find((snap) => snap.axis === context.questionFocusAxis)
      : null) ??
    context.axes.find((snap) => snap.score != null) ??
    null;

  const axisScore = formatScore(focusSnap?.score);
  const tierTitle = focusSnap?.cardCopy?.title ?? '—';

  if (closingBeatKind === 'passion-close') {
    return t(`dynoIntel.closingBeatSecondLine.${PASSION_KEYS[variant]}`, {
      axisScore,
      tierTitle,
    });
  }

  return t(`dynoIntel.closingBeatSecondLine.${RITUAL_KEYS[variant]}`, {
    axisScore,
    tierTitle,
  });
}
