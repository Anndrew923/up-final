import { buildOfficialHumanAnchor, isMethodologyReplyContext } from "./dynoIntelChassisFactory.js";
import { resolveMethodologyFullBrief } from "./methodologyBeatRepair.js";
import { buildPreemptiveOffTopicReply, shouldPreemptOffTopic } from "./offTopicPreempt.js";

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
 * Deterministic fallback when Gemini fails or is bypassed.
 * WHY: Preserve on-topic UX without retry loops amplifying bad bills.
 */
export function resolveDeterministicDynoIntelReply(context, userQuestion) {
  if (Array.isArray(context?.gaps) && context.gaps.length > 0) {
    return buildGapsSeedReply(context);
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
