/**
 * v3.0 — Resolve UI score/tier display meta from enriched Dyno Intel context.
 * WHY: Scores and tier titles render in UI cards, not in AI commentary.
 */
import type { DynoIntelContextV1, DynoSupplementalMetricId } from './dynoIntelTypes';
import type { SixAxisMetric } from '../../types/scoring';
import {
  detectQuestionFocusAxis,
  detectQuestionFocusSupplemental,
  isChassisMacroQuestion,
} from './resolveDynoIntelQuestionFocus';

export interface DynoIntelDisplayMeta {
  scoreLabel: string | null;
  tierTitle: string | null;
  axisKey: SixAxisMetric | DynoSupplementalMetricId | 'overall' | null;
  showMethodologyNudge: boolean;
  methodologyNudge: string | null;
}

function formatScore(score: number): string {
  const numeric = Number(score);
  if (Number.isInteger(numeric)) return String(numeric);
  return String(Math.round(numeric * 10) / 10);
}

function isOverallMacroQuestion(context: DynoIntelContextV1, userQuestion: string): boolean {
  if (context.mode !== 'cross-axis') return false;
  if (!isChassisMacroQuestion(userQuestion)) return false;
  return detectQuestionFocusAxis(userQuestion, context) == null;
}

function resolveSupplementalFocusMetric(
  context: DynoIntelContextV1,
  userQuestion: string
): DynoSupplementalMetricId | null {
  return detectQuestionFocusSupplemental(userQuestion) ?? context.focusSupplemental ?? null;
}

function resolveSupplementalDisplayMeta(
  context: DynoIntelContextV1,
  userQuestion: string,
  empty: DynoIntelDisplayMeta
): DynoIntelDisplayMeta | null {
  const metric = resolveSupplementalFocusMetric(context, userQuestion);
  if (!metric) return null;

  const snap = context.supplementalMetrics.find((row) => row.metric === metric);
  if (snap?.score == null) return null;

  return {
    ...empty,
    scoreLabel: formatScore(snap.score),
    tierTitle: snap.cardCopy?.title?.trim() || null,
    axisKey: metric,
  };
}

export function resolveDynoIntelDisplayMeta(
  context: DynoIntelContextV1,
  userQuestion = ''
): DynoIntelDisplayMeta {
  const empty: DynoIntelDisplayMeta = {
    scoreLabel: null,
    tierTitle: null,
    axisKey: null,
    showMethodologyNudge: context.intent === 'methodology',
    methodologyNudge: context.closingBeatSecondLine?.trim() || null,
  };

  if (context.intent === 'methodology') {
    return {
      ...empty,
      showMethodologyNudge: true,
    };
  }

  if (Array.isArray(context.gaps) && context.gaps.length > 0) {
    return empty;
  }

  if (isOverallMacroQuestion(context, userQuestion) && context.overallScore != null) {
    return {
      ...empty,
      scoreLabel: formatScore(context.overallScore),
      tierTitle: null,
      axisKey: 'overall',
    };
  }

  const supplementalMeta = resolveSupplementalDisplayMeta(context, userQuestion, empty);
  if (supplementalMeta) {
    return supplementalMeta;
  }

  const focusAxis = context.questionFocusAxis ?? detectQuestionFocusAxis(userQuestion, context);
  if (focusAxis) {
    const snap = context.axes.find((row) => row.axis === focusAxis);
    if (snap?.score != null) {
      return {
        ...empty,
        scoreLabel: formatScore(snap.score),
        tierTitle: snap.cardCopy?.title?.trim() || null,
        axisKey: focusAxis,
      };
    }
  }

  const fallback = context.axes.find((row) => row.score != null && row.cardCopy?.title);
  if (fallback?.score != null) {
    return {
      ...empty,
      scoreLabel: formatScore(fallback.score),
      tierTitle: fallback.cardCopy?.title?.trim() || null,
      axisKey: fallback.axis,
    };
  }

  return empty;
}
