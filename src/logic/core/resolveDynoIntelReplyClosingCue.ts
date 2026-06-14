import type { TFunction } from 'i18next';
import type { SixAxisMetric } from '../../types/scoring';
import { getAxisSurfaceLabel } from './dynoIntelAxisLexicon';
import type { DynoAxisSnapshot, DynoIntelContextV1 } from './dynoIntelTypes';

const HIGH_TIER_BAND_IDS = new Set(['LEGEND', 'PANTHEON', 'TIER_140', 'TIER_150', 'TIER_160']);
const LOW_TIER_BAND_IDS = new Set(['BASE', 'TIER_40', 'TIER_50', 'TIER_60']);

function resolvePrimaryAxisSnap(context: DynoIntelContextV1): DynoAxisSnapshot | null {
  if (context.focusAxis) {
    return context.axes.find((snap) => snap.axis === context.focusAxis) ?? null;
  }
  return null;
}

function findBestPositiveMomentum(
  context: DynoIntelContextV1
): { axis: SixAxisMetric; delta: number } | null {
  if (!context.momentum.hasHistory) return null;

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

function resolveWeakestCompanionCue(
  context: DynoIntelContextV1,
  primary: DynoAxisSnapshot | null,
  t: TFunction
): string | null {
  const locale = context.locale;

  // Single-axis: anchor on focus axis score even when other axes are unscored gaps.
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

function formatDelta(delta: number): string {
  return Number.isInteger(delta) ? String(delta) : delta.toFixed(1);
}

/**
 * Selects one data-anchored closing cue for beat 3 — priority: momentum up > high tier > weakest companion > default.
 * WHY: Emotional resonance must bind to JSON truth, not free-form cheerleading.
 */
export function resolveDynoIntelReplyClosingCue(
  context: DynoIntelContextV1,
  t: TFunction
): string {
  const locale = context.locale;
  const primary = resolvePrimaryAxisSnap(context);
  const momentumUp = findBestPositiveMomentum(context);

  if (momentumUp) {
    return t('dynoIntel.replyClosingCue.momentumUp', {
      axisLabel: getAxisSurfaceLabel(momentumUp.axis, locale),
      delta: formatDelta(momentumUp.delta),
    });
  }

  const highTierSnap = findHighTierSnap(context);
  if (highTierSnap?.cardCopy?.title) {
    return t('dynoIntel.replyClosingCue.highTier', {
      tierTitle: highTierSnap.cardCopy.title,
    });
  }

  const weakestCompanion = resolveWeakestCompanionCue(context, primary, t);
  if (weakestCompanion) return weakestCompanion;

  return t('dynoIntel.replyClosingCue.default');
}
