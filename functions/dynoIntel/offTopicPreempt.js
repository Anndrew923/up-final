/**
 * Conservative off-topic preemption — only blocks clear trivia with zero axis/methodology signals.
 * WHY: Mirrors system_v1 off-topic contract without paying Gemini for obvious chit-chat.
 */
import { shouldForceDynoIntelOnTopic } from "./enforceOnTopicRail.js";
import { normalizeDynoIntelQuestion } from "./normalizeDynoIntelQuestion.js";
import { resolveDynoQuestionIntent } from "./resolveQuestionIntent.js";

const OFF_TOPIC_TRIVIA_PATTERNS = [
  /今晚吃什麼|今天吃什麼|明天吃什麼|食譜|料理|餐廳|宵夜|點什麼/i,
  /天氣|下雨|氣溫|股市|政治|新聞|八卦/i,
  /講個笑話|說個故事|聊聊天|你是誰|你幾歲|談戀愛/i,
  /what\s+should\s+i\s+eat|recipe|restaurant|weather|stock\s+market|tell\s+me\s+a\s+joke/i,
  /who\s+are\s+you|chat\s+with\s+me/i,
];

function truncateOffTopicSubject(userQuestion, maxChars = 12) {
  const q = normalizeDynoIntelQuestion(userQuestion)
    .replace(/[？?！!。．,，\s]+$/g, "")
    .trim();
  if (!q) return "此主題";
  if (q.length <= maxChars) return q;
  return q.slice(0, maxChars);
}

export function shouldPreemptOffTopic(userQuestion, context = null) {
  const intent = context?.intent ?? resolveDynoQuestionIntent(userQuestion, context);
  if (intent !== "general") return false;
  if (shouldForceDynoIntelOnTopic(userQuestion, context)) return false;

  const q = normalizeDynoIntelQuestion(userQuestion);
  if (!q) return false;

  return OFF_TOPIC_TRIVIA_PATTERNS.some((pattern) => pattern.test(q));
}

export function buildPreemptiveOffTopicReply(userQuestion, context = null) {
  const locale = context?.locale === "en" ? "en" : "zh-Hant";
  const subject = truncateOffTopicSubject(userQuestion, 12);

  if (locale === "en") {
    return {
      commentary: `I'm DYNO INTEL on this Ultimate Physique host — I only decode your six-axis telemetry, tier bands, and this app's scoring methodology; ${subject} is outside my scope.`,
      action_directive: "",
      is_off_topic: true,
      detected_weakest_axis: String(context?.weakestAxis ?? ""),
    };
  }

  return {
    commentary: `我是這台《最強肉體》主機上的 DYNO INTEL，只解讀你的六軸遙測、級距解碼，以及本 App 的給分標準說明，${subject}不在我的服務範圍內。`,
    action_directive: "",
    is_off_topic: true,
    detected_weakest_axis: String(context?.weakestAxis ?? ""),
  };
}
