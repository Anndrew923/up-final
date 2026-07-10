import matrixDoc from "./data/hallOfFameMatrix.v1.json" with { type: "json" };
import {
  DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_EN,
  DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_ZH,
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_EN,
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH,
} from "./dynoIntelHumanPraise.data.js";
import {
  detectQuestionFocusAxis,
  detectQuestionFocusSupplemental,
  isChassisMacroQuestion,
} from "./resolveQuestionIntent.js";
import { normalizeDynoIntelQuestion } from "./normalizeDynoIntelQuestion.js";
import { resolveHallOfFameDisplayNames } from "./hallOfFameResolver.js";
import { resolveReplyLocale } from "./beatTemplates.js";

/**
 * WHY (v5.7): Stop toothpaste patches on colloquial roster asks.
 * Two-rail consult detection:
 *  1) Direct sanctum / peer / classic list asks → always consult.
 *  2) Roster lexicon (運動員 / athletes / tell me more…) → consult only when a
 *     score-band token is also present — blocks "Tell me more about my strength"
 *     from stealing the status path.
 */
const HALL_SANCTUM_PATTERNS = [
  /名人堂|萬神殿|名人堂聖殿|聖殿矩陣|歷史傳奇|Hall of Fame|Pantheon|historical legends?/i,
];

const PEER_AND_LIST_PATTERNS = [
  /有哪些名人|有哪些人名|有哪些人|哪些傳奇|哪些名字|誰在.*分|誰有.*分|誰是.*分|有誰|是誰/i,
  /還有誰|也是.*分|同.*分.*誰|誰跟我一樣|一樣是.*分|同個分數|同級距|同.*分/i,
  /who else|same (score )?band|anyone else|who is also|shared\s+scores?/i,
  /who.*(?:at|above|over).*\d+|who\s+(?:is|are|sit).*(?:at|in|above|over)/i,
];

/** Roster / "know more" lexicon — must co-occur with a decade/score cue. */
const ROSTER_LEXICON_PATTERNS = [
  /運動員|球星|巨星|名人|傳奇|角色|選手|人名|名字|知道更多|看更多|更多.*分|哪些人.*分|分.*的人/i,
  /athletes?|players?|celebrities|legends?|figures?|more\s+names?|tell\s+me\s+more|famous names?/i,
];

const SCORE_BAND_CUE =
  /\d+\s*(?:多|幾)?\s*分|\d+\s*\+|in the \d+0?s|\d+0s|(?:above|over)\s*\d+|points?|地表最強|怪物領域|統計神話|歷史級別|超凡入聖|凡體覺醒|凡人頂尖|高階玩家|進階健身者|大眾健康常模|新手期|探索期|嬰兒期/i;

function matchesAny(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

/** Colloquial + formal decade bands — 0~150+ including official class labels. */
const TIER_PATTERNS = [
  {
    decadeKey: "150",
    label: "150+（地表最強）",
    labelEn: "150+ (Earth's apex)",
    pattern:
      /150\s*(?:\+|分?以上)|150以上|150多|150幾|一百五十多|地表最強|a2|(?:above|over)\s*150|150\s*points?|150s|in the 150s/i,
  },
  {
    decadeKey: "140",
    label: "140-150（怪物領域）",
    labelEn: "140-150 (Monster tier)",
    pattern:
      /140\s*[-~～到至]\s*150|140分以上|140以上|140多|140幾|一百四十多|怪物領域|a3|(?:above|over)\s*140|140\s*points?|140s|in the 140s/i,
  },
  {
    decadeKey: "130",
    label: "130-140（統計神話）",
    labelEn: "130-140 (Statistical myth)",
    pattern:
      /130\s*[-~～到至]\s*140|130分以上|130以上|130多|130幾|一百三十多|統計神話|a4|(?:above|over)\s*130|130\s*points?|130s|in the 130s/i,
  },
  {
    decadeKey: "120",
    label: "120-130（歷史級別）",
    labelEn: "120-130 (Historic tier)",
    pattern:
      /120\s*[-~～到至]\s*130|120分以上|120以上|120多|120幾|一百二十多|歷史級別|a5|(?:above|over)\s*120|120\s*points?|120s|in the 120s/i,
  },
  {
    decadeKey: "110",
    label: "110-120（超凡入聖）",
    labelEn: "110-120 (Transcendent tier)",
    pattern:
      /110\s*[-~～到至]\s*120|110分以上|110以上|110多|110幾|一百一十多|超凡入聖|a6|(?:above|over)\s*110|110\s*points?|110s|in the 110s/i,
  },
  {
    decadeKey: "100",
    label: "100-110（凡體覺醒）",
    labelEn: "100-110 (Awakened mortal)",
    pattern:
      /100\s*[-~～到至]\s*110|100分以上|100以上|100多|100幾|一百多|凡體覺醒|a7|(?:above|over)\s*100|100\s*points?|100s|in the 100s/i,
  },
  {
    decadeKey: "90",
    label: "90-100（凡人頂尖）",
    labelEn: "90-100 (Top mortal tier)",
    pattern:
      /90\s*[-~～到至]\s*100|90分以上|90以上|90多|90幾|九十多|凡人頂尖|a8|(?:above|over)\s*90|90\s*points?|90s|in the 90s/i,
  },
  {
    decadeKey: "80",
    label: "80-90（高階玩家）",
    labelEn: "80-90 (Advanced tier)",
    pattern:
      /80\s*[-~～到至]\s*90|80分以上|80以上|80多|80幾|八十多|高階玩家|a9|(?:above|over)\s*80|80\s*points?|80s|in the 80s/i,
  },
  {
    decadeKey: "70",
    label: "70-80（進階健身者）",
    labelEn: "70-80 (Intermediate lifter)",
    pattern:
      /70\s*[-~～到至]\s*80|70分以上|70以上|70多|70幾|七十多|進階健身者|(?:above|over)\s*70|70\s*points?|70s|in the 70s/i,
  },
  {
    decadeKey: "60",
    label: "60-70（大眾健康常模）",
    labelEn: "60-70 (General health norm)",
    pattern:
      /60\s*[-~～到至]\s*70|60分以上|60以上|60多|60幾|六十多|大眾健康常模|(?:above|over)\s*60|60\s*points?|60s|in the 60s/i,
  },
  {
    decadeKey: "50",
    label: "50-60（新手期）",
    labelEn: "50-60 (Novice Phase)",
    pattern:
      /50\s*[-~～到至]\s*60|50分以上|50以上|50多|50幾|五十多|新手期|(?:above|over)\s*50|50\s*points?|50s|in the 50s/i,
  },
  {
    decadeKey: "40",
    label: "40-50（探索期）",
    labelEn: "40-50 (Exploration Phase)",
    pattern:
      /40\s*[-~～到至]\s*50|40分以上|40以上|40多|40幾|四十多|探索期|(?:above|over)\s*40|40\s*points?|40s|in the 40s/i,
  },
  {
    decadeKey: "0",
    label: "0-40（嬰兒期）",
    labelEn: "0-40 (Infant Phase)",
    pattern:
      /(?:^|[^\d])(?:0|0\s*[-~～到至]\s*40|40分以下|嬰兒期)(?:[^\d]|$)|(?:above|over)\s*0\b|in the (?:0|teens)|0s\b/i,
  },
];

function resolveTierLabel(tier, locale) {
  return locale === "en" ? tier.labelEn : tier.label;
}

function resolveBlockedReplyCopy(context) {
  return resolveReplyLocale(context) === "en"
    ? DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_EN
    : DYNO_INTEL_HALL_OF_FAME_BLOCKED_REPLY_ZH;
}

function resolveConsultLegalShieldCopy(context) {
  return resolveReplyLocale(context) === "en"
    ? DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_EN
    : DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH;
}

function buildBlockedConsultReply(context) {
  return wrapHallOfFameConsultReply({
    commentary: resolveBlockedReplyCopy(context),
    action_directive: "",
    is_off_topic: false,
    detected_weakest_axis: String(context?.weakestAxis ?? ""),
  });
}

/** WHY: Consult replies are final copy — beat contract must not merge chassis segment1 over them. */
export function wrapHallOfFameConsultReply(reply) {
  return { ...reply, hallOfFameConsultReply: true };
}

export function isHallOfFameConsultHardReply(reply) {
  return reply?.hallOfFameConsultReply === true;
}

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

const AXIS_LABELS_EN = {
  overall: "overall",
  strength: "strength",
  explosivePower: "explosive power",
  cardio: "cardio",
  muscleMass: "muscle mass",
  bodyFat: "FFMI",
  gripStrength: "grip strength",
  armSize: "arm size",
  cooper: "Cooper 12-minute run",
  "5km": "5 km run",
};

/** Exported for chatCallable cache bypass — consult replies are score-gated and must not replay stale cache. */
export function isHallOfFameConsultQuestion(userQuestion) {
  const q = normalizeDynoIntelQuestion(userQuestion);
  if (!q) return false;

  if (matchesAny(HALL_SANCTUM_PATTERNS, q) || matchesAny(PEER_AND_LIST_PATTERNS, q)) {
    return true;
  }

  // Roster lexicon alone is too broad — require a score-band / decade cue.
  if (matchesAny(ROSTER_LEXICON_PATTERNS, q) && (SCORE_BAND_CUE.test(q) || resolveHallOfFameConsultTier(q))) {
    return true;
  }

  return false;
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

function buildUnlockedReply({ decadeLabel, axis, names, context }) {
  const locale = resolveReplyLocale(context);
  const axisLabels = locale === "en" ? AXIS_LABELS_EN : AXIS_LABELS_ZH;
  const axisLabel = axisLabels[axis] ?? (locale === "en" ? "this axis" : "該軸");
  const joinedNames = locale === "en" ? names.join(", ") : names.join("、");
  const legalShield = resolveConsultLegalShieldCopy(context);

  if (locale === "en") {
    const body = axis
      ? `You have unlocked ${decadeLabel} ${axisLabel} Pantheon benchmarking. Representative names currently available in this band include ${joinedNames}.`
      : `You have unlocked ${decadeLabel} Pantheon benchmarking. Representative names currently available in this band include ${joinedNames}.`;
    return `${body}${legalShield}`;
  }

  const body = axis
    ? `你已解鎖 ${decadeLabel} 的${axisLabel}萬神殿對帳權限。這一階目前可開啟的代表性名字包括 ${joinedNames}。`
    : `你已解鎖 ${decadeLabel} 的萬神殿對帳權限。這一階目前可開啟的代表性名字包括 ${joinedNames}。`;
  return `${body}${legalShield}`;
}

export function resolveHallOfFameConsultReply(context, userQuestion) {
  if (!isHallOfFameConsultQuestion(userQuestion)) return null;

  const tier = resolveHallOfFameConsultTier(userQuestion);
  if (!tier) {
    return buildBlockedConsultReply(context);
  }

  const axis = resolveConsultAxis(userQuestion, context);
  const unlockScore = resolveAxisScore(context, axis ?? "overall");
  if (!Number.isFinite(unlockScore) || unlockScore < Number(tier.decadeKey)) {
    return buildBlockedConsultReply(context);
  }

  const names = axis
    ? resolveHallOfFameDisplayNames(axis, tier.decadeKey, axis === "overall" ? 6 : 4)
    : [];
  const fallbackNames =
    axis && names.length === 0 ? [] : names.length > 0 ? names : resolveAggregateTierNames(tier.decadeKey, 6);

  const locale = resolveReplyLocale(context);

  if (fallbackNames.length === 0) {
    const commentary =
      locale === "en"
        ? `You have unlocked ${resolveTierLabel(tier, locale)} Pantheon benchmarking, but this cell is still a blank anchor with no public roster yet.`
        : `你已解鎖 ${tier.label} 的萬神殿對帳權限，但這一格目前仍是空白錨點，尚無可公開對帳名單。`;
    return wrapHallOfFameConsultReply({
      commentary,
      action_directive: "",
      is_off_topic: false,
      detected_weakest_axis: String(context?.weakestAxis ?? ""),
    });
  }

  return wrapHallOfFameConsultReply({
    commentary: buildUnlockedReply({
      decadeLabel: resolveTierLabel(tier, resolveReplyLocale(context)),
      axis,
      names: fallbackNames,
      context,
    }),
    action_directive: "",
    is_off_topic: false,
    detected_weakest_axis: String(context?.weakestAxis ?? ""),
  });
}
