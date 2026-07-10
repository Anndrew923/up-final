import type { SixAxisMetric } from '../../types/scoring';
import type { DynoIntelContextV1, DynoQuestionIntent, DynoSupplementalMetricId } from './dynoIntelTypes';

export type { DynoQuestionIntent };

/** Mirrors functions/dynoIntel/resolveQuestionIntent.js — keep regex lists in sync (v3.0.4.1). */
const METHODOLOGY_PATTERNS: RegExp[] = [
  /公式|常模|給分|計分|計算方式|怎[麼么]算|如何計算|係数|系数|評分標準|評測標準|計分依據|評分邏輯|评分逻辑|计分依据|评测标准|打分|換算|怎[麼么]評分|如何評分|評分方式|評分機制|评分方式|怎[麼么]評測|如何評測|評測方式|怎[麼么]測|如何測/i,
  /how\s+(is|are|does).*(calculat|formula|computed|determined)/i,
  /how\s+to\s+(calculate|compute)\b/i,
  /how\s+(does|do)\s+.*\bscor/i,
  /formula|methodology|scoring\s+(rule|standard|logic)|evaluation\s+criteria|norm\s+table|coefficient|dots|brzycki|mcculloch|ffmi\s*公式/i,
  /captains\s+of\s+crush|ironmind|cooper\s*test/i,
  /(?<![的])評分(?!多少|如何|怎樣|怎麼樣)/,
  /評斷|評定|判定|判斷|評測參考|評測依據|依據|如何評斷|怎[麼么]評斷|如何判定|怎[麼么]判定|如何評判|分數.{0,6}如何|如何.{0,6}分數/i,
];

const PROGRESS_PATTERNS: RegExp[] = [
  /進步了嗎|有進步|進步多少|進展如何|提升了嗎|有沒有進步|比上次|歷程|歷史|紀錄|趋势|趨勢|progress(ed)?\?|did\s+i\s+improve|getting\s+better|momentum|\bhistory\b|\blog\b/i,
];

/** Prescription / coaching asks — decode dashboard only, never personal trainer. */
const COACHING_PATTERNS: RegExp[] = [
  /如何進步|怎[麼么]進步|怎[麼么]練|如何提升|如何變強|課表/i,
  /how\s+to\s+improve|how\s+can\s+i\s+improve|training\s+plan|workout\s+schedule|how\s+to\s+get\s+stronger/i,
];

const GAPS_PATTERNS: RegExp[] = [
  /盲區|盲区|未測|未测|沒測|沒測過|沒數據|丟失|漏掉|少測|少算|雷達圖失衡|失衡|remote\s*error|gap|error|missing/i,
];

const STATUS_PERFORMANCE_PATTERNS =
  /表現如何|表現怎樣|表現怎麼樣|成績如何|成績怎樣|成績怎麼樣|評分如何|評分怎樣|評分怎麼樣|算厲害|算粗|算細|比起一般人|總分|整車|六軸.{0,8}成績|狀況|状态|解讀|解读|分析|診斷|诊断|評估|how\s+.*perform|overall\s+score|status|diagnos|interpret/i;

/** v2.4.2 — whole-chassis reads only; mirrors functions/dynoIntel/resolveQuestionIntent.js */
export const CHASSIS_MACRO_PATTERNS =
  /總分|整車|六軸.{0,8}(成績|分數)|全車.{0,6}(成績|分數)|解碼|整體|overall\s+score|total\s+score|total\s+performance|full\s+report|aggregate\s+score|summary\s+score|average\s+score|mean\s+score|what'?s\s+my\s+score|how\s+is\s+my\s+score\b|how\s+am\s+i\s+doing\s+overall|whole[\s-]chassis|six[\s-]axis.{0,12}score/i;

const CHASSIS_MACRO_FORMULA_ESCAPE =
  /how\s+to\s+(calculate|compute)\b|how\s+(is|are|does).*(calculat|formula|computed|determined)/i;

export function isChassisMacroQuestion(userQuestion: string): boolean {
  const q = normalizeQuestion(userQuestion);
  if (!q) return false;
  return CHASSIS_MACRO_PATTERNS.test(q);
}

const METHODOLOGY_HEURISTIC_HOW = /如何|怎[麼么]|what|how/i;
const METHODOLOGY_HEURISTIC_SCORE_STANDARD = /分|標準|score|scor|規|依據/i;
const METHODOLOGY_HEURISTIC_PANEL_READ = /我|我的|my|me|多少分/i;

const AXIS_QUESTION_PATTERNS: { axis: SixAxisMetric; patterns: RegExp[] }[] = [
  {
    axis: 'gripStrength',
    patterns: [/握力|手指|前臂|grip|captains\s+of\s+crush|coc|抓地/i],
  },
  {
    axis: 'bodyFat',
    patterns: [/ffmi|體脂|体脂|體脂肪|體脂率|排量|body\s*fat|lean\s*mass/i],
  },
  {
    axis: 'strength',
    patterns: [/力量|馬力|马力|絕對力量|重量|強度|strength|dots|1rm|深蹲|臥推|硬舉|bench|squat|deadlift/i],
  },
  {
    axis: 'explosivePower',
    patterns: [/爆發|爆发|扭矩|彈射|垂直跳|彈跳|explosive|vertical|jump/i],
  },
  {
    axis: 'cardio',
    patterns: [/心肺|心肺功能|cardio|cooper|5\s*km|五公里|跑步|續航|耐力|耐力表現/i],
  },
  {
    axis: 'muscleMass',
    patterns: [/肌肉量|骨骼肌|肌肉|smm|muscle\s*mass|車體剛性|剛性/i],
  },
];

const SUPPLEMENTAL_PATTERNS: { metric: DynoSupplementalMetricId; patterns: RegExp[] }[] = [
  { metric: 'armSize', patterns: [/臂圍|臂围|手粗|arm\s*size|bicep/i] },
  { metric: 'cooper', patterns: [/cooper|12\s*分鐘|12\s*minute/i] },
  { metric: '5km', patterns: [/5\s*km|五公里/i] },
];

function normalizeQuestion(raw: string): string {
  return String(raw ?? '')
    .normalize('NFKC')
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type MethodologyHeuristicContext = Pick<
  DynoIntelContextV1,
  'focusAxis' | 'mode' | 'focusAxisLexicon'
>;

/** v2.3.5 P1 — client parity with server heuristic escalation. */
export function shouldEscalateMethodologyViaHeuristic(
  userQuestion: string,
  context: MethodologyHeuristicContext | null | undefined
): boolean {
  const q = normalizeQuestion(userQuestion);
  if (!q || !context) return false;
  if (/解讀|解读|怎[麼么]看|如何看|代表什麼|代表什么/i.test(q)) return false;
  if (!detectQuestionFocusAxis(userQuestion, context)) return false;
  if (!METHODOLOGY_HEURISTIC_HOW.test(q)) return false;
  if (!METHODOLOGY_HEURISTIC_SCORE_STANDARD.test(q)) return false;
  if (METHODOLOGY_HEURISTIC_PANEL_READ.test(q)) return false;
  return true;
}

export function resolveDynoQuestionIntent(
  userQuestion: string,
  context?: MethodologyHeuristicContext | null
): DynoQuestionIntent {
  const q = normalizeQuestion(userQuestion);
  if (!q) return 'general';

  if (GAPS_PATTERNS.some((re) => re.test(q))) return 'status';

  if (COACHING_PATTERNS.some((re) => re.test(q))) return 'coaching';

  if (PROGRESS_PATTERNS.some((re) => re.test(q))) return 'progress';

  if (STATUS_PERFORMANCE_PATTERNS.test(q)) return 'status';

  if (isChassisMacroQuestion(userQuestion) && !CHASSIS_MACRO_FORMULA_ESCAPE.test(q)) return 'status';

  if (METHODOLOGY_PATTERNS.some((re) => re.test(q))) return 'methodology';
  if (shouldEscalateMethodologyViaHeuristic(userQuestion, context)) return 'methodology';

  if (
    detectQuestionFocusAxis(userQuestion, context ?? undefined) ||
    detectQuestionFocusSupplemental(userQuestion)
  ) {
    return 'status';
  }

  return 'general';
}

/** v2.4.2 — axis lock from question keywords only; context is ignored (signature kept for call-site stability). */
export function detectQuestionFocusAxis(
  userQuestion: string,
  _context?: Pick<DynoIntelContextV1, 'focusAxis' | 'mode' | 'focusAxisLexicon'>
): SixAxisMetric | null {
  const q = normalizeQuestion(userQuestion);

  for (const entry of AXIS_QUESTION_PATTERNS) {
    if (entry.patterns.some((re) => re.test(q))) {
      return entry.axis;
    }
  }

  const supplemental = detectQuestionFocusSupplemental(userQuestion);
  if (supplemental === 'cooper' || supplemental === '5km') return 'cardio';

  return null;
}

export function detectQuestionFocusSupplemental(
  userQuestion: string
): DynoSupplementalMetricId | null {
  const q = normalizeQuestion(userQuestion);
  for (const entry of SUPPLEMENTAL_PATTERNS) {
    if (entry.patterns.some((re) => re.test(q))) return entry.metric;
  }
  return null;
}

/** WHY: Question-focus beats global momentum unless user explicitly asks about progress. */
export function shouldPreferQuestionFocusClosing(
  userQuestion: string,
  context: Pick<DynoIntelContextV1, 'focusAxis' | 'mode'>
): boolean {
  const intent = resolveDynoQuestionIntent(userQuestion, context);
  if (intent === 'progress') return false;
  if (intent === 'methodology') return true;
  if (detectQuestionFocusAxis(userQuestion, context)) return true;
  return intent === 'status' && isChassisMacroQuestion(userQuestion);
}
