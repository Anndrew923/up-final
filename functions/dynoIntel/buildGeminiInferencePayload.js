import { injectChassisBeatsIntoContext } from "./dynoIntelChassisFactory.js";

/**
 * Drop bulky fields that the system prompt never reads for the active intent.
 * WHY: Target ~30–50% fewer input tokens by shipping only axis briefs + minimal telemetry.
 */
function pruneAxesForPayload(axes, focusAxis, intent) {
  const source = Array.isArray(axes) ? axes : [];
  if (source.length === 0) return [];

  if (intent === "methodology" && focusAxis) {
    return source
      .filter((row) => row?.axis === focusAxis)
      .map((row) => ({
        axis: row.axis,
        score: row.score,
        tierBandId: row.tierBandId ?? null,
      }));
  }

  // WHY: UI tier cards keep vehicle metaphors (工廠賽車/寬體); Dyno Intel must never
  // feed that prose to Gemini or the model will occasionally paraphrase it into replies.
  return source.map((row) => ({
    axis: row.axis,
    score: row.score,
    tierBandId: row.tierBandId ?? null,
  }));
}

function pruneMomentum(momentum, intent) {
  if (!momentum || typeof momentum !== "object") return undefined;
  if (intent !== "progress") return undefined;
  return {
    deltas: Array.isArray(momentum.deltas)
      ? momentum.deltas.slice(0, 6).map((row) => ({
          axis: row.axis,
          delta: row.delta,
        }))
      : [],
  };
}

/**
 * WHY: Gemini system prompt only reads chassisBeats.p1Official — PR, legal, and fullBrief
 * are backend-welded after inference. Shipping them inflates input tokens with zero model utility.
 * Methodology routes skip chassis entirely (briefs are the sole truth).
 */
export function buildGeminiInferencePayload(context) {
  const intent = context?.intent ?? "general";
  const focusAxis = context?.questionFocusAxis ?? context?.focusAxis ?? null;

  const base = {
    locale: context?.locale ?? "zh-Hant",
    mode: context?.mode,
    intent,
    userQuestion: context?.userQuestion,
    questionFocusAxis: context?.questionFocusAxis ?? null,
    focusAxis: context?.focusAxis ?? null,
    focusSupplemental: context?.focusSupplemental ?? null,
    weakestAxis: context?.weakestAxis ?? null,
    overallScore: context?.overallScore ?? null,
    // WHY: Keep product cues the model still reads — strip only bulky unused prose below.
    assessmentDeepDiveNudge: context?.assessmentDeepDiveNudge ?? null,
    replyClosingCue: context?.replyClosingCue ?? null,
    closingBeatKind: context?.closingBeatKind ?? null,
    closingBeatSecondLine: context?.closingBeatSecondLine ?? null,
    gaps: Array.isArray(context?.gaps) ? context.gaps.slice(0, 3) : [],
    scoringMethodologyBriefs: Array.isArray(context?.scoringMethodologyBriefs)
      ? context.scoringMethodologyBriefs.slice(0, intent === "methodology" ? 1 : 2)
      : [],
    axes: pruneAxesForPayload(context?.axes, focusAxis, intent),
    supplementalMetrics: Array.isArray(context?.supplementalMetrics)
      ? context.supplementalMetrics.slice(0, 3).map((row) => ({
          metric: row.metric,
          score: row.score,
          tierBandId: row.tierBandId ?? null,
        }))
      : [],
  };

  // WHY: Weight-sim mode requires the target kg contract — never prune it away for cost.
  if (context?.weightSimulation && typeof context.weightSimulation === "object") {
    base.weightSimulation = {
      targetWeightKg: context.weightSimulation.targetWeightKg ?? null,
    };
  }

  const momentum = pruneMomentum(context?.momentum, intent);
  if (momentum) base.momentum = momentum;

  // WHY: Methodology constitution lives in scoringMethodologyBriefs — chassis beats are status-only.
  if (intent === "methodology") {
    return base;
  }

  const enriched = injectChassisBeatsIntoContext(context);
  if (!enriched?.chassisBeats || typeof enriched.chassisBeats !== "object") {
    return base;
  }

  const p1Official = enriched.chassisBeats.p1Official ?? null;
  if (!p1Official) {
    return base;
  }

  return {
    ...base,
    chassisBeats: {
      p1Official,
    },
  };
}
