import matrixDoc from "./data/hallOfFameMatrix.v1.json" with { type: "json" };
import { DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH } from "./dynoIntelHumanPraise.data.js";
import {
  detectQuestionFocusAxis,
  detectQuestionFocusSupplemental,
  isChassisMacroQuestion,
} from "./resolveQuestionIntent.js";
import { normalizeDynoIntelQuestion } from "./normalizeDynoIntelQuestion.js";
import { resolveHallOfFameDisplayNames } from "./hallOfFameResolver.js";

const HALL_OF_FAME_CONSULT_PATTERNS = [
  /名人堂|萬神殿|名人堂聖殿|聖殿矩陣|歷史傳奇|有哪些名人|有哪些人名|哪些傳奇|哪些名字|誰在.*分|誰有.*分/i,
];

const BLOCKED_REPLY_ZH =
  "在 Dyno Intel 的萬神殿深處，該區間已正式跨入超凡神格區間。你目前的綜合實力尚未解鎖該重力場。拼盡全力訓練吧！當你將功能推向臨界點時，天梯大腦會在你的專屬報告中，為你開啟與該階層歷史傳奇的正面對帳通道！";

const TIER_PATTERNS = [
  { decadeKey: "150", label: "150+（地表最強）", pattern: /150\+|150\s*分以上|150以上|a2/i },
  { decadeKey: "140", label: "140-150（怪物領域）", pattern: /140\s*[-~～到至]\s*150|140分以上|140以上|a3/i },
  { decadeKey: "130", label: "130-140（統計神話）", pattern: /130\s*[-~～到至]\s*140|130分以上|130以上|a4/i },
  { decadeKey: "120", label: "120-130（歷史級別）", pattern: /120\s*[-~～到至]\s*130|120分以上|120以上|a5/i },
  { decadeKey: "110", label: "110-120（超凡入聖）", pattern: /110\s*[-~～到至]\s*120|110分以上|110以上|a6/i },
  { decadeKey: "100", label: "100-110（凡體覺醒）", pattern: /100\s*[-~～到至]\s*110|100分以上|100以上|a7/i },
  { decadeKey: "90", label: "90-100（凡人頂尖）", pattern: /90\s*[-~～到至]\s*100|90分以上|90以上|a8/i },
  { decadeKey: "80", label: "80-90（高階玩家）", pattern: /80\s*[-~～到至]\s*90|80分以上|80以上|a9/i },
  { decadeKey: "70", label: "70-80（進階健身者）", pattern: /70\s*[-~～到至]\s*80|70分以上|70以上/ },
  { decadeKey: "60", label: "60-70（大眾健康常模）", pattern: /60\s*[-~～到至]\s*70|60分以上|60以上/ },
];

const AXIS_LABELS_ZH = {
  overall: "總分",
  strength: "力量",
  explosivePower: "爆發力",
  cardio: "心肺機能",
  muscleMass: "肌肉量",
  bodyFat: "FFMI",
  gripStrength: "握力",
  armSize: "臂圍",
  cooper: "十二分鐘跑",
  "5km": "五公里跑",
};

/** Exported for chatCallable cache bypass — consult replies are score-gated and must not replay stale cache. */
export function isHallOfFameConsultQuestion(userQuestion) {
  const q = normalizeDynoIntelQuestion(userQuestion);
  if (!q) return false;
  return HALL_OF_FAME_CONSULT_PATTERNS.some((pattern) => pattern.test(q));
}

export function resolveHallOfFameConsultTier(userQuestion) {
  const q = normalizeDynoIntelQuestion(userQuestion);
  if (!q) return null;
  return TIER_PATTERNS.find((entry) => entry.pattern.test(q)) ?? null;
}

function resolveConsultAxis(userQuestion, context) {
  const focusAxis = detectQuestionFocusAxis(userQuestion, context);
  if (focusAxis) return focusAxis;

  const supplemental = detectQuestionFocusSupplemental(userQuestion);
  if (supplemental) return supplemental;

  if (isChassisMacroQuestion(userQuestion)) return "overall";
  return null;
}

function resolveAxisScore(context, axis) {
  if (!context || !axis) return Number.NaN;
  if (axis === "overall") return Number(context.overallScore);

  const primary = Array.isArray(context.axes)
    ? context.axes.find((entry) => entry?.axis === axis)
    : null;
  if (primary?.score != null) return Number(primary.score);

  const supplemental = Array.isArray(context.supplementalMetrics)
    ? context.supplementalMetrics.find((entry) => entry?.metric === axis)
    : null;
  return Number(supplemental?.score);
}

function resolveAggregateTierNames(decadeKey, limit = 6) {
  const seen = new Set();
  const names = [];

  for (const entry of matrixDoc.entries ?? []) {
    if (entry?.decadeKey !== decadeKey) continue;
    for (const anchor of entry.anchors ?? []) {
      const name = String(anchor?.displayZh ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(name);
      if (names.length >= limit) return names;
    }
  }

  return names;
}

function buildUnlockedReply({ decadeLabel, axis, names }) {
  const axisLabel = AXIS_LABELS_ZH[axis] ?? "該軸";
  const body = axis
    ? `你已解鎖 ${decadeLabel} 的${axisLabel}萬神殿對帳權限。這一階目前可開啟的代表性名字包括 ${names.join("、")}。`
    : `你已解鎖 ${decadeLabel} 的萬神殿對帳權限。這一階目前可開啟的代表性名字包括 ${names.join("、")}。`;
  return `${body}${DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH}`;
}

export function resolveHallOfFameConsultReply(context, userQuestion) {
  if (!isHallOfFameConsultQuestion(userQuestion)) return null;

  const tier = resolveHallOfFameConsultTier(userQuestion);
  if (!tier) return null;

  const axis = resolveConsultAxis(userQuestion, context);
  const unlockScore = resolveAxisScore(context, axis ?? "overall");
  if (!Number.isFinite(unlockScore) || unlockScore < Number(tier.decadeKey)) {
    return {
      commentary: BLOCKED_REPLY_ZH,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: String(context?.weakestAxis ?? ""),
    };
  }

  const names = axis
    ? resolveHallOfFameDisplayNames(axis, tier.decadeKey, axis === "overall" ? 6 : 4)
    : [];
  const fallbackNames =
    axis && names.length === 0 ? [] : names.length > 0 ? names : resolveAggregateTierNames(tier.decadeKey, 6);

  if (fallbackNames.length === 0) {
    return {
      commentary: `你已解鎖 ${tier.label} 的萬神殿對帳權限，但這一格目前仍是空白錨點，尚無可公開對帳名單。`,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: String(context?.weakestAxis ?? ""),
    };
  }

  return {
    commentary: buildUnlockedReply({ decadeLabel: tier.label, axis, names: fallbackNames }),
    action_directive: "",
    is_off_topic: false,
    detected_weakest_axis: String(context?.weakestAxis ?? ""),
  };
}
