import {
  detectQuestionFocusAxis,
  detectQuestionFocusSupplemental,
  resolveDynoQuestionIntent,
} from "./resolveQuestionIntent.js";

const MAX_ON_DEMAND_BRIEFS = 2;

/**
 * WHY: Client ships all nine briefs for validation parity; inference only pays tokens for relevant metrics.
 */
export function collectOnDemandMethodologyMetrics(userQuestion, context, intent) {
  if (intent === "methodology") return null;

  const ordered = [];
  const push = (metric) => {
    if (typeof metric !== "string" || !metric) return;
    if (!ordered.includes(metric)) ordered.push(metric);
  };

  push(detectQuestionFocusAxis(userQuestion, context));
  push(context.questionFocusAxis);
  const supplemental =
    detectQuestionFocusSupplemental(userQuestion) ?? context.focusSupplemental ?? null;
  push(supplemental);
  push(context.focusAxis);

  if (supplemental === "cooper" || supplemental === "5km") {
    push("cardio");
  }

  if (ordered.length === 0 && context.weakestAxis) {
    push(context.weakestAxis);
  }

  return ordered.slice(0, MAX_ON_DEMAND_BRIEFS);
}

export function pruneScoringMethodologyBriefs(briefs, userQuestion, intent, context) {
  const source = Array.isArray(briefs) ? briefs : [];
  if (source.length === 0) return [];

  if (intent === "methodology") {
    return source;
  }

  const metrics = collectOnDemandMethodologyMetrics(userQuestion, context, intent);
  if (!metrics || metrics.length === 0) {
    return [];
  }

  const metricSet = new Set(metrics);
  const selected = source.filter((entry) => metricSet.has(entry.metric));
  return selected.slice(0, MAX_ON_DEMAND_BRIEFS);
}

export function buildDynoIntelInferenceContext(context, userQuestion) {
  const intent = resolveDynoQuestionIntent(userQuestion, context);
  return {
    ...context,
    intent,
    scoringMethodologyBriefs: pruneScoringMethodologyBriefs(
      context.scoringMethodologyBriefs,
      userQuestion,
      intent,
      context
    ),
  };
}
