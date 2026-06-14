import type { TFunction } from 'i18next';
import type { SixAxisMetric } from '../../types/scoring';
import { getAxisSurfaceLabel } from './dynoIntelAxisLexicon';
import type { DynoAxisSnapshot, DynoIntelContextV1 } from './dynoIntelTypes';
import {
  detectQuestionFocusAxis,
  resolveDynoQuestionIntent,
  shouldPreferQuestionFocusClosing,
} from './resolveDynoIntelQuestionFocus';

const HIGH_TIER_BAND_IDS = new Set(['LEGEND', 'PANTHEON', 'TIER_140', 'TIER_150', 'TIER_160']);
const LOW_TIER_BAND_IDS = new Set(['BASE', 'TIER_40', 'TIER_50', 'TIER_60']);

function resolvePrimaryAxisSnap(context: DynoIntelContextV1): DynoAxisSnapshot | null {
  if (context.questionFocusAxis) {
    return context.axes.find((snap) => snap.axis === context.questionFocusAxis) ?? null;
  }
  if (context.focusAxis) {
    return context.axes.find((snap) => snap.axis === context.focusAxis) ?? null;
  }
  return null;
}

function findBestPositiveMomentum(
  context: DynoIntelContextV1,
  restrictAxis: SixAxisMetric | null
): { axis: SixAxisMetric; delta: number } | null {
  if (!context.momentum.hasHistory) return null;

  if (restrictAxis) {
    const focusDelta = context.momentum.deltas.find((entry) => entry.axis === restrictAxis);
    if (focusDelta?.delta != null && focusDelta.delta > 0) {
      return { axis: focusDelta.axis, delta: focusDelta.delta };
    }
    return null;
  }

  if (context.focusAxis) {
    const focusDelta = context.momentum.deltas.find((entry) => entry.axis === context.focusAxis);
    if (focusDelta?.delta != null && focusDelta.delta > 0) {
      return { axis: focusDelta.axis, delta: focusDelta.delta };
    }
  }

  let best: { axis: SixAxisMetric; delta: number } | null = null;
  for (const entry of context.momentum.deltas) {
    if (entry.delta == null || entry.delta <= 0) continue;
    if (!best || entry.delta > best.delta) {
      best = { axis: entry.axis, delta: entry.delta };
    }
  }
  return best;
}

function findHighTierSnap(context: DynoIntelContextV1): DynoAxisSnapshot | null {
  const primary = resolvePrimaryAxisSnap(context);
  if (primary?.score != null && primary.tierBandId && HIGH_TIER_BAND_IDS.has(primary.tierBandId)) {
    return primary;
  }
  let best: DynoAxisSnapshot | null = null;
  for (const snap of context.axes) {
    if (snap.score == null || !snap.tierBandId || !HIGH_TIER_BAND_IDS.has(snap.tierBandId)) continue;
    if (!best || (snap.score ?? 0) > (best.score ?? 0)) best = snap;
  }
  return best;
}

function isLowScoreSnap(snap: DynoAxisSnapshot | null | undefined): boolean {
  if (!snap || snap.score == null) return false;
  if (snap.tierBandId && LOW_TIER_BAND_IDS.has(snap.tierBandId)) return true;
  return snap.score <= 60;
}

function formatDelta(delta: number): string {
  return Number.isInteger(delta) ? String(delta) : delta.toFixed(1);
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function resolveQuestionFocusCue(
  snap: DynoAxisSnapshot,
  locale: DynoIntelContextV1['locale'],
  t: TFunction
): string {
  const tierSuffix =
    snap.cardCopy?.title != null ? t('dynoIntel.replyClosingCue.questionFocusTierSuffix', {
      tierTitle: snap.cardCopy.title,
    }) : '';
  return t('dynoIntel.replyClosingCue.questionFocus', {
    axisLabel: getAxisSurfaceLabel(snap.axis, locale),
    score: formatScore(snap.score!),
    tierSuffix,
  });
}

function resolveChassisBalanceCue(context: DynoIntelContextV1, t: TFunction): string | null {
  const scored = context.axes.filter((snap) => snap.score != null);
  if (scored.length < 2) return null;

  let weakest = scored[0];
  let strongest = scored[0];
  for (const snap of scored) {
    if ((snap.score ?? 0) < (weakest.score ?? 0)) weakest = snap;
    if ((snap.score ?? 0) > (strongest.score ?? 0)) strongest = snap;
  }

  return t('dynoIntel.replyClosingCue.chassisBalance', {
    weakestLabel: getAxisSurfaceLabel(weakest.axis, context.locale),
    weakestScore: formatScore(weakest.score!),
    strongestLabel: getAxisSurfaceLabel(strongest.axis, context.locale),
    strongestScore: formatScore(strongest.score!),
  });
}

function resolveWeakestCompanionCue(
  context: DynoIntelContextV1,
  primary: DynoAxisSnapshot | null,
  t: TFunction
): string | null {
  const locale = context.locale;

  if (context.mode === 'single-axis' && isLowScoreSnap(primary)) {
    return t('dynoIntel.replyClosingCue.weakestCompanion', {
      axisLabel: getAxisSurfaceLabel(primary!.axis, locale),
    });
  }

  if (context.weakestAxis) {
    const weakestSnap = context.axes.find((snap) => snap.axis === context.weakestAxis);
    if (isLowScoreSnap(weakestSnap)) {
      return t('dynoIntel.replyClosingCue.weakestCompanion', {
        axisLabel: getAxisSurfaceLabel(context.weakestAxis, locale),
      });
    }
  }

  return null;
}

/**
 * v2.3 beat-3 sentence 1 — question-focus > chassis > progress momentum > tier > weakest > default.
 */
export function resolveDynoIntelReplyClosingCue(
  context: DynoIntelContextV1,
  t: TFunction,
  userQuestion: string
): string {
  const locale = context.locale;
  const intent = resolveDynoQuestionIntent(userQuestion);
  const questionFocusAxis =
    context.questionFocusAxis ?? detectQuestionFocusAxis(userQuestion, context);
  const preferQuestionFocus = shouldPreferQuestionFocusClosing(userQuestion, context);

  if (preferQuestionFocus && questionFocusAxis) {
    const focusSnap = context.axes.find((snap) => snap.axis === questionFocusAxis);
    if (focusSnap?.score != null) {
      return resolveQuestionFocusCue(focusSnap, locale, t);
    }
  }

  if (context.mode === 'cross-axis' && intent !== 'progress') {
    const chassis = resolveChassisBalanceCue(context, t);
    if (chassis) return chassis;
  }

  const momentumUp = findBestPositiveMomentum(
    context,
    intent === 'progress' ? questionFocusAxis : null
  );
  if (momentumUp) {
    return t('dynoIntel.replyClosingCue.momentumUp', {
      axisLabel: getAxisSurfaceLabel(momentumUp.axis, locale),
      delta: formatDelta(momentumUp.delta),
    });
  }

  const primary = resolvePrimaryAxisSnap(context);
  const highTierSnap = findHighTierSnap(context);
  if (highTierSnap?.cardCopy?.title) {
    return t('dynoIntel.replyClosingCue.highTier', {
      tierTitle: highTierSnap.cardCopy.title,
    });
  }

  const weakestCompanion = resolveWeakestCompanionCue(context, primary, t);
  if (weakestCompanion) return weakestCompanion;

  if (primary?.score != null) {
    return resolveQuestionFocusCue(primary, locale, t);
  }

  return t('dynoIntel.replyClosingCue.default');
}
