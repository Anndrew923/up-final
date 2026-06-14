import type { TFunction } from 'i18next';
import { dynoSupplementalScoreMeaningMetric } from './buildDynoIntelSupplementalMetrics';
import type { DynoIntelContextV1 } from './dynoIntelTypes';
import { resolveDynoIntelClosingBeatKind } from './resolveDynoIntelClosingBeatKind';
import { resolveDynoIntelClosingBeatSecondLine } from './resolveDynoIntelClosingBeatSecondLine';
import { detectQuestionFocusAxis } from './resolveDynoIntelQuestionFocus';
import { resolveDynoIntelReplyClosingCue } from './resolveDynoIntelReplyClosingCue';
import { resolveDynoIntelScoringMethodologyBriefs } from './resolveDynoIntelScoringMethodologyBriefs';
import { translateScoreBandMeaning } from './scoreMeaningCopy';

/**
 * Attaches locale-resolved tier card copy and v2.3 beat-3 controls before Callable.
 * WHY: i18n stays client-side; userQuestion anchors closing away from global momentum drift.
 */
export function enrichDynoIntelContextCardCopy(
  context: DynoIntelContextV1,
  t: TFunction,
  userQuestion = ''
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
    questionFocusAxis: detectQuestionFocusAxis(userQuestion, context),
  };

  const closingBeatKind = resolveDynoIntelClosingBeatKind(userQuestion, withCardCopy);
  const replyClosingCue = resolveDynoIntelReplyClosingCue(withCardCopy, t, userQuestion);
  const enrichedBase: DynoIntelContextV1 = {
    ...withCardCopy,
    closingBeatKind,
    replyClosingCue,
    closingBeatSecondLine: '',
  };

  return {
    ...enrichedBase,
    closingBeatSecondLine: resolveDynoIntelClosingBeatSecondLine(
      closingBeatKind,
      enrichedBase,
      t,
      userQuestion
    ),
  };
}
