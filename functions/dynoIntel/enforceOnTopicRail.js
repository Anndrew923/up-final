/**
 * Deterministic on-topic guard — overrides model misclassification (e.g. FFMI → off-topic).
 */
import { buildOfficialHumanAnchor, isMethodologyReplyContext } from "./dynoIntelChassisFactory.js";
import { ensureMethodologyCommentaryComplete } from "./methodologyBeatRepair.js";
import { normalizeDynoIntelQuestion } from "./normalizeDynoIntelQuestion.js";
import {
  detectQuestionFocusAxis,
  detectQuestionFocusSupplemental,
  isChassisMacroQuestion,
  resolveDynoQuestionIntent,
} from "./resolveQuestionIntent.js";

const OFF_TOPIC_BOILERPLATE_ZH =
  /我是這台《最強肉體》主機上的 DYNO INTEL|不在我的服務範圍內|只解讀你的六軸遙測/i;
const OFF_TOPIC_BOILERPLATE_EN =
  /I'm DYNO INTEL on this Ultimate Physique host|outside my scope|only decode your six-axis telemetry/i;

function isOffTopicBoilerplate(commentary, locale = "zh-Hant") {
  const row = String(commentary ?? "").trim();
  if (!row) return false;
  const pattern = locale === "en" ? OFF_TOPIC_BOILERPLATE_EN : OFF_TOPIC_BOILERPLATE_ZH;
  return pattern.test(row);
}

function resolveIntent(context, userQuestion) {
  return context?.intent ?? resolveDynoQuestionIntent(userQuestion, context);
}

export function shouldForceDynoIntelOnTopic(userQuestion, context) {
  const q = normalizeDynoIntelQuestion(userQuestion);
  if (!q || !context) return false;

  // WHY: Prescription asks must never be rewritten into status/methodology anchors.
  if (resolveDynoQuestionIntent(userQuestion, context) === "coaching") return false;

  const intent = resolveIntent(context, userQuestion);
  if (intent === "methodology" || intent === "status" || intent === "progress") {
    return true;
  }

  if (detectQuestionFocusAxis(userQuestion, context)) return true;
  if (detectQuestionFocusSupplemental(userQuestion)) return true;
  if (context.questionFocusAxis) return true;

  if (Array.isArray(context.gaps) && context.gaps.length > 0) return true;
  if (context.mode === "weight-simulation") return true;
  if (isChassisMacroQuestion(userQuestion)) return true;

  return false;
}

function resolveForcedOnTopicFallbackCommentary(context, userQuestion) {
  const intent = resolveIntent(context, userQuestion);
  if (intent === "methodology" || isMethodologyReplyContext(context)) {
    const methodologyCopy = ensureMethodologyCommentaryComplete("", context);
    if (methodologyCopy) return methodologyCopy;
  }

  const humanAnchor = buildOfficialHumanAnchor(context);
  if (humanAnchor) return humanAnchor;

  return "";
}

export function enforceOnTopicRail(reply, context, userQuestion) {
  if (!reply || !reply.is_off_topic || !context) return reply;
  if (!shouldForceDynoIntelOnTopic(userQuestion, context)) return reply;

  const locale = context.locale === "en" ? "en" : "zh-Hant";
  let commentary = String(reply.commentary ?? "").trim();

  if (!commentary || isOffTopicBoilerplate(commentary, locale)) {
    commentary = resolveForcedOnTopicFallbackCommentary(context, userQuestion);
  }

  return {
    ...reply,
    is_off_topic: false,
    commentary,
    action_directive: "",
  };
}
