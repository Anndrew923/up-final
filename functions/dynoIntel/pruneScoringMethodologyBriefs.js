import {
  detectQuestionFocusAxis,
  detectQuestionFocusSupplemental,
  resolveDynoQuestionIntent,
} from "./resolveQuestionIntent.js";

const MAX_ON_DEMAND_BRIEFS = 2;

/**
 * WHY: Client ships all nine briefs for validation parity; inference only pays tokens for relevant metrics.
 * v3.0.3: methodology routes lock to question-detected axis first — never catalog-order bodyFat over grip.
 */
export function collectOnDemandMethodologyMetrics(userQuestion, context, intent = null) {
  const resolvedIntent = intent ?? resolveDynoQuestionIntent(userQuestion, context);
  const detected = detectQuestionFocusAxis(userQuestion, context);

  if (resolvedIntent === "methodology" && detected) {
    const ordered = [detected];
    const supplemental =
      detectQuestionFocusSupplemental(userQuestion) ?? context?.focusSupplemental ?? null;
    if (supplemental === "cooper" || supplemental === "5km") {
      if (!ordered.includes("cardio")) ordered.push("cardio");
    } else if (supplemental && !ordered.includes(supplemental)) {
      ordered.push(supplemental);
    }
    return ordered.slice(0, MAX_ON_DEMAND_BRIEFS);
  }

  const ordered = [];
  const push = (metric) => {
    if (typeof metric !== "string" || !metric) return;
    if (!ordered.includes(metric)) ordered.push(metric);
  };

  push(detected);
  if (detected && context?.questionFocusAxis && context.questionFocusAxis !== detected) {
    push(context.questionFocusAxis);
  } else if (!detected) {
    push(context?.questionFocusAxis);
  }

  const supplemental =
    detectQuestionFocusSupplemental(userQuestion) ?? context?.focusSupplemental ?? null;
  push(supplemental);
  if (!detected) {
    push(context?.focusAxis);
  }

  if (supplemental === "cooper" || supplemental === "5km") {
    push("cardio");
  }

  if (ordered.length === 0 && context?.weakestAxis) {
    push(context.weakestAxis);
  }

  return ordered.slice(0, MAX_ON_DEMAND_BRIEFS);
}

function selectBriefsByMetricOrder(source, metrics) {
  const byMetric = new Map(source.map((entry) => [entry.metric, entry]));
  const selected = [];
  for (const metric of metrics) {
    const entry = byMetric.get(metric);
    if (entry) selected.push(entry);
    if (selected.length >= MAX_ON_DEMAND_BRIEFS) break;
  }
  return selected;
}

export function pruneScoringMethodologyBriefs(briefs, userQuestion, intent, context) {
  const source = Array.isArray(briefs) ? briefs : [];
  if (source.length === 0) return [];

  const metrics = collectOnDemandMethodologyMetrics(userQuestion, context, intent);
  if (!metrics || metrics.length === 0) {
    if (intent === "methodology" && context?.focusAxis) {
      return source.filter((entry) => entry.metric === context.focusAxis).slice(0, 1);
    }
    return [];
  }

  return selectBriefsByMetricOrder(source, metrics);
}

export function buildDynoIntelInferenceContext(context, userQuestion) {
  const intent = resolveDynoQuestionIntent(userQuestion, context);
  const questionFocusAxis = detectQuestionFocusAxis(userQuestion, context);
  return {
    ...context,
    intent,
    questionFocusAxis,
    userQuestion,
    scoringMethodologyBriefs: pruneScoringMethodologyBriefs(
      context.scoringMethodologyBriefs,
      userQuestion,
      intent,
      context
    ),
  };
}
