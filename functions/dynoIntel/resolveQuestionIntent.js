/**
 * Mirrors src/logic/core/resolveDynoIntelQuestionFocus.ts — keep regex lists in sync (v2.3.5).
 * WHY: Server is routing source of truth so clients cannot force flash on every request.
 */

const METHODOLOGY_PATTERNS = [
  /公式|常模|給分|計分|計算方式|怎[麼么]算|如何計算|係数|系数|評分標準|評測標準|計分依據|評分邏輯|评分逻辑|计分依据|评测标准|打分|換算|怎[麼么]評分|如何評分|評分方式|評分機制|评分方式|how\s+(is|are|does).*(score|calculat|formula)/i,
  /formula|methodology|scoring\s+(rule|standard|logic)|evaluation\s+criteria|norm\s+table|coefficient|dots|brzycki|mcculloch|ffmi\s*公式|how\s+.*\bscor/i,
  /captains\s+of\s+crush|ironmind|cooper\s*test/i,
  /(?<![的])評分(?!多少)/,
  /評斷|評定|判定|判斷|評測參考|評測依據|依據|如何評斷|怎[麼么]評斷|如何判定|怎[麼么]判定|如何評判|分數.{0,6}如何|如何.{0,6}分數/i,
];

const PROGRESS_PATTERNS = [
  /進步了嗎|有進步|進步多少|進展如何|提升了嗎|有沒有進步|比上次|progress(ed)?\?|did\s+i\s+improve|getting\s+better|momentum/i,
];

const STATUS_PERFORMANCE_PATTERNS =
  /表現如何|表現怎樣|表現怎麼樣|成績如何|成績怎樣|成績怎麼樣|how\s+.*perform/i;

const METHODOLOGY_HEURISTIC_HOW = /如何|怎[麼么]|what|how/i;
const METHODOLOGY_HEURISTIC_SCORE_STANDARD = /分|標準|score|scor|規|依據/i;
const METHODOLOGY_HEURISTIC_PANEL_READ = /我|我的|my|me|多少分/i;

/**
 * v2.3.5 P1 — escalate when axis + methodology probes hit but regex missed.
 * WHY: Colloquial phrasing (評斷/判定 variants) must not route to flash-lite.
 */
export function shouldEscalateMethodologyViaHeuristic(userQuestion, context) {
  const q = String(userQuestion ?? "").trim();
  if (!q || !context) return false;
  if (/解讀|解读|怎[麼么]看|如何看|代表什麼|代表什么/i.test(q)) return false;
  if (!detectQuestionFocusAxis(userQuestion, context)) return false;
  if (!METHODOLOGY_HEURISTIC_HOW.test(q)) return false;
  if (!METHODOLOGY_HEURISTIC_SCORE_STANDARD.test(q)) return false;
  if (METHODOLOGY_HEURISTIC_PANEL_READ.test(q)) return false;
  return true;
}

export function resolveDynoQuestionIntent(userQuestion, context = null) {
  const q = String(userQuestion ?? "").trim();
  if (!q) return "general";
  if (STATUS_PERFORMANCE_PATTERNS.test(q)) return "status";
  if (METHODOLOGY_PATTERNS.some((re) => re.test(q))) return "methodology";
  if (shouldEscalateMethodologyViaHeuristic(userQuestion, context)) return "methodology";
  if (PROGRESS_PATTERNS.some((re) => re.test(q))) return "progress";
  if (
    /狀態|状态|解讀|解读|分析|diagnos|status|interpret/.test(q) ||
    STATUS_PERFORMANCE_PATTERNS.test(q)
  ) {
    return "status";
  }
  return "general";
}

const AXIS_QUESTION_PATTERNS = [
  { axis: "bodyFat", patterns: [/ffmi|體脂|体脂|體脂肪|引擎排量|排量|body\s*fat|lean\s*mass/i] },
  { axis: "gripStrength", patterns: [/握力|grip|captains\s+of\s+crush|coc|抓地/i] },
  {
    axis: "strength",
    patterns: [/力量|馬力|马力|strength|dots|1rm|深蹲|臥推|硬舉|bench|squat|deadlift/i],
  },
  { axis: "explosivePower", patterns: [/爆發|爆发|扭矩|explosive|vertical|跳/i] },
  { axis: "cardio", patterns: [/心肺|cardio|cooper|5\s*km|五公里|跑步|續航|耐力/i] },
  { axis: "muscleMass", patterns: [/肌肉量|骨骼肌|smm|muscle\s*mass|車體剛性/i] },
];

const SUPPLEMENTAL_PATTERNS = [
  { metric: "armSize", patterns: [/臂圍|臂围|arm\s*size|bicep/i] },
  { metric: "cooper", patterns: [/cooper|12\s*分鐘|12\s*minute/i] },
  { metric: "5km", patterns: [/5\s*km|五公里/i] },
];

export function detectQuestionFocusSupplemental(userQuestion) {
  const q = String(userQuestion ?? "").trim();
  for (const entry of SUPPLEMENTAL_PATTERNS) {
    if (entry.patterns.some((re) => re.test(q))) return entry.metric;
  }
  return null;
}

export function detectQuestionFocusAxis(userQuestion, context) {
  const q = String(userQuestion ?? "").trim();

  for (const entry of AXIS_QUESTION_PATTERNS) {
    if (entry.patterns.some((re) => re.test(q))) {
      return entry.axis;
    }
  }

  if (context?.mode === "single-axis" && context.focusAxis) {
    return context.focusAxis;
  }

  if (context?.focusAxisLexicon?.axis) {
    const head = String(context.focusAxisLexicon.surfaceLabel ?? "")
      .split(/[(/]/)[0]
      ?.trim()
      .toLowerCase();
    if (head && q.toLowerCase().includes(head)) {
      return context.focusAxisLexicon.axis;
    }
  }

  const supplemental = detectQuestionFocusSupplemental(userQuestion);
  if (supplemental === "cooper" || supplemental === "5km") {
    return "cardio";
  }

  return null;
}
