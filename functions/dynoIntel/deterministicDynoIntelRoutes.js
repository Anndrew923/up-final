import { buildOfficialHumanAnchor, isMethodologyReplyContext } from "./dynoIntelChassisFactory.js";
import { resolveMethodologyFullBrief } from "./methodologyBeatRepair.js";
import { buildPreemptiveOffTopicReply, shouldPreemptOffTopic } from "./offTopicPreempt.js";
import { resolveDynoQuestionIntent } from "./resolveQuestionIntent.js";

export const DYNO_INTEL_COACHING_BOUNDARY_ZH =
  "我是 DYNO INTEL，只負責解碼你的六軸遙測數據與級距座標，不開立訓練處方。有關『如何進步』，請回到對應評測頁對照短板指標與計分說明；如需具體訓練課表，請諮詢專業教練。";

export const DYNO_INTEL_COACHING_BOUNDARY_EN =
  "I am DYNO INTEL, engineered solely to decode your six-axis telemetry data and performance tiers. I do not prescribe training protocols. To improve, return to the assessment matrix to analyze your weak metrics and scoring methodology; for personalized workout plans, consult a certified coach.";

/** Seed reply for gaps — enforceGapsCommentary synthesizes the final two-beat contract. */
export function buildGapsSeedReply(context) {
  return {
    commentary: "",
    action_directive: "",
    is_off_topic: false,
    detected_weakest_axis: String(
      context?.weakestAxis ?? context?.gaps?.[0]?.axis ?? ""
    ),
  };
}

/**
 * Zero-token coaching boundary — prescription asks never reach Gemini.
 * WHY: Product sovereignty — decode dashboard, never personal trainer.
 */
export function shouldPreemptCoaching(userQuestion, context = null) {
  const intent = context?.intent ?? resolveDynoQuestionIntent(userQuestion, context);
  return intent === "coaching";
}

export function buildCoachingBoundaryReply(context = null) {
  const locale = context?.locale === "en" ? "en" : "zh-Hant";
  return {
    commentary:
      locale === "en" ? DYNO_INTEL_COACHING_BOUNDARY_EN : DYNO_INTEL_COACHING_BOUNDARY_ZH,
    action_directive: "",
    is_off_topic: true,
    detected_weakest_axis: String(context?.weakestAxis ?? ""),
  };
}

/**
 * Deterministic fallback when Gemini fails or is bypassed.
 * WHY: Preserve on-topic UX without retry loops amplifying bad bills.
 */
export function resolveDeterministicDynoIntelReply(context, userQuestion) {
  if (Array.isArray(context?.gaps) && context.gaps.length > 0) {
    return buildGapsSeedReply(context);
  }

  if (shouldPreemptCoaching(userQuestion, context)) {
    return buildCoachingBoundaryReply(context);
  }

  if (shouldPreemptOffTopic(userQuestion, context)) {
    return buildPreemptiveOffTopicReply(userQuestion, context);
  }

  if (isMethodologyReplyContext(context)) {
    const fullBrief = resolveMethodologyFullBrief(context);
    if (fullBrief) {
      return {
        commentary: fullBrief,
        action_directive: "",
        is_off_topic: false,
        detected_weakest_axis: String(
          context?.weakestAxis ?? context?.questionFocusAxis ?? ""
        ),
      };
    }
  }

  const anchor = buildOfficialHumanAnchor(context);
  if (anchor) {
    return {
      commentary: anchor,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: String(context?.weakestAxis ?? ""),
    };
  }

  return null;
}
