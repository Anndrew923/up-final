import type { SixAxisMetric } from '../../types/scoring';
import type { DynoIntelContextV1, DynoQuestionIntent, DynoSupplementalMetricId } from './dynoIntelTypes';

export type { DynoQuestionIntent };

/** Mirrors functions/dynoIntel/resolveQuestionIntent.js — keep regex lists in sync (v2.3.5). */
const METHODOLOGY_PATTERNS: RegExp[] = [
  /公式|常模|給分|計分|計算方式|怎[麼么]算|如何計算|係数|系数|評分標準|評測標準|計分依據|評分邏輯|评分逻辑|计分依据|评测标准|打分|換算|怎[麼么]評分|如何評分|評分方式|評分機制|评分方式|how\s+(is|are|does).*(score|calculat|formula)/i,
  /formula|methodology|scoring\s+(rule|standard|logic)|evaluation\s+criteria|norm\s+table|coefficient|dots|brzycki|mcculloch|ffmi\s*公式|how\s+.*\bscor/i,
  /captains\s+of\s+crush|ironmind|cooper\s*test/i,
  /(?<![的])評分(?!多少)/,
  /評斷|評定|判定|判斷|評測參考|評測依據|依據|如何評斷|怎[麼么]評斷|如何判定|怎[麼么]判定|如何評判|分數.{0,6}如何|如何.{0,6}分數/i,
];

const PROGRESS_PATTERNS: RegExp[] = [
  /進步了嗎|有進步|進步多少|進展如何|提升了嗎|有沒有進步|比上次|progress(ed)?\?|did\s+i\s+improve|getting\s+better|momentum/i,
];

const METHODOLOGY_HEURISTIC_HOW = /如何|怎[麼么]|what|how/i;
const METHODOLOGY_HEURISTIC_SCORE_STANDARD = /分|標準|score|scor|規|依據/i;
const METHODOLOGY_HEURISTIC_PANEL_READ = /我|我的|my|me|多少分/i;

const AXIS_QUESTION_PATTERNS: { axis: SixAxisMetric; patterns: RegExp[] }[] = [
  {
    axis: 'bodyFat',
    patterns: [/ffmi|體脂|体脂|體脂肪|引擎排量|排量|body\s*fat|lean\s*mass/i],
  },
  {
    axis: 'gripStrength',
    patterns: [/握力|grip|captains\s+of\s+crush|coc|抓地/i],
  },
  {
    axis: 'strength',
    patterns: [/力量|馬力|马力|strength|dots|1rm|深蹲|臥推|硬舉|bench|squat|deadlift/i],
  },
  {
    axis: 'explosivePower',
    patterns: [/爆發|爆发|扭矩|explosive|vertical|跳/i],
  },
  {
    axis: 'cardio',
    patterns: [/心肺|cardio|cooper|5\s*km|五公里|跑步|續航|耐力/i],
  },
  {
    axis: 'muscleMass',
    patterns: [/肌肉量|骨骼肌|smm|muscle\s*mass|車體剛性/i],
  },
];

const SUPPLEMENTAL_PATTERNS: { metric: DynoSupplementalMetricId; patterns: RegExp[] }[] = [
  { metric: 'armSize', patterns: [/臂圍|臂围|arm\s*size|bicep/i] },
  { metric: 'cooper', patterns: [/cooper|12\s*分鐘|12\s*minute/i] },
  { metric: '5km', patterns: [/5\s*km|五公里/i] },
];

function normalizeQuestion(raw: string): string {
  return raw.trim();
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
  if (METHODOLOGY_PATTERNS.some((re) => re.test(q))) return 'methodology';
  if (shouldEscalateMethodologyViaHeuristic(userQuestion, context)) return 'methodology';
  if (PROGRESS_PATTERNS.some((re) => re.test(q))) return 'progress';
  if (/狀態|状态|解讀|解读|分析|diagnos|status|interpret/i.test(q)) return 'status';
  return 'general';
}

export function detectQuestionFocusAxis(
  userQuestion: string,
  context: Pick<DynoIntelContextV1, 'focusAxis' | 'mode' | 'focusAxisLexicon'>
): SixAxisMetric | null {
  const q = normalizeQuestion(userQuestion);

  for (const entry of AXIS_QUESTION_PATTERNS) {
    if (entry.patterns.some((re) => re.test(q))) {
      return entry.axis;
    }
  }

  if (context.mode === 'single-axis' && context.focusAxis) {
    return context.focusAxis;
  }

  if (context.focusAxisLexicon?.axis) {
    const head = context.focusAxisLexicon.surfaceLabel.split(/[(/]/)[0]?.trim().toLowerCase();
    if (head && q.toLowerCase().includes(head)) {
      return context.focusAxisLexicon.axis;
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
  if (context.mode === 'single-axis' && context.focusAxis) return true;
  return intent === 'status';
}
