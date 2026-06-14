import type { TFunction } from 'i18next';
import { dynoSupplementalScoreMeaningMetric } from './buildDynoIntelSupplementalMetrics';
import type { DynoIntelContextV1 } from './dynoIntelTypes';
import { resolveDynoIntelReplyClosingCue } from './resolveDynoIntelReplyClosingCue';
import { resolveDynoIntelScoringMethodologyBriefs } from './resolveDynoIntelScoringMethodologyBriefs';
import { translateScoreBandMeaning } from './scoreMeaningCopy';

/**
 * Attaches locale-resolved tier card copy and scoring methodology briefs before Callable.
 * WHY: i18n stays client-side; backend receives human-readable product truth only.
 */
export function enrichDynoIntelContextCardCopy(
  context: DynoIntelContextV1,
  t: TFunction
): DynoIntelContextV1 {
  const withCardCopy = {
    ...context,
    axes: context.axes.map((snap) => {
      if (snap.score == null) {
        return { ...snap, cardCopy: null };
      }
      const { title, summary } = translateScoreBandMeaning(t, snap.axis, snap.score);
      return { ...snap, cardCopy: { title, summary } };
    }),
    supplementalMetrics: context.supplementalMetrics.map((snap) => {
      const meaningMetric = dynoSupplementalScoreMeaningMetric(snap.metric);
      const { title, summary } = translateScoreBandMeaning(t, meaningMetric, snap.score);
      return { ...snap, cardCopy: { title, summary } };
    }),
    scoringMethodologyBriefs: resolveDynoIntelScoringMethodologyBriefs(t),
    assessmentDeepDiveNudge: t('dynoIntel.replyAssessmentDeepDiveNudge'),
  };

  return {
    ...withCardCopy,
    replyClosingCue: resolveDynoIntelReplyClosingCue(withCardCopy, t),
  };
}
