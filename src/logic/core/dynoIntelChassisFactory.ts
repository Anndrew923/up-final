/**
 * v5.2 — Client mirror of `functions/dynoIntel/dynoIntelChassisFactory.js`.
 * WHY: Lock golden-three-segment assembly routing across client ↔ Cloud Functions.
 */
import type {
  DynoClosingBeatKind,
  DynoIntelContextV1,
  DynoIntelMode,
  DynoQuestionIntent,
} from './dynoIntelTypes';
import { detectQuestionFocusAxis, isChassisMacroQuestion } from './resolveDynoIntelQuestionFocus';

/** Server rigid-mold output — v3.0 single human anchor only. */
export interface DynoIntelBeats {
  /** Official pure-human summary anchor injected before Gemini. */
  p1: string | null;
}

/** Injected into Callable context before Gemini — mirrors `injectChassisBeatsIntoContext`. */
export interface DynoIntelChassisBeatsOfficial {
  /** Full golden-three brief (segment1 + optional PR + optional legal). */
  summaryHuman: string;
  /** Segment 1 core only — AI extension target; excludes PR and legal shield. */
  p1Official: string;
  /** Segment 2 — PR viral-growth copy (overall macro, zh-Hant only). */
  prSegment?: string | null;
  /** Segment 3 — hall-of-fame legal shield (60+ with names, zh-Hant only). */
  legalSegment?: string | null;
}

/** Inputs for chassis-synthesis feature routing — mirrors server gate preconditions. */
export interface ChassisSynthesisGateInput {
  intent: DynoQuestionIntent;
  closingBeatKind: DynoClosingBeatKind;
  mode: DynoIntelMode;
  userQuestion: string;
  questionFocusAxis?: DynoIntelContextV1['questionFocusAxis'];
}

/**
 * v3.0 synthesis route matrix — documents which server pipeline owns assembly.
 */
export type ChassisSynthesisRoute =
  | 'gaps-short-circuit'
  | 'methodology-passthrough'
  | 'chassis-macro-synthesis'
  | 'single-axis-rigid-mold';

/** Shared gate — methodology replies use brief-led single paragraph on the server. */
export function isMethodologyReplyContext(
  context: Pick<DynoIntelContextV1, 'intent' | 'closingBeatKind'> | null | undefined
): boolean {
  return (
    context?.intent === 'methodology' || context?.closingBeatKind === 'methodology-nudge'
  );
}

/** Whole-chassis macro reads in cross-axis mode — mirrors `shouldUseChassisSynthesisPipeline`. */
export function shouldUseChassisSynthesisPipeline(
  context: ChassisSynthesisGateInput | null | undefined
): boolean {
  if (!context) return false;
  if (isMethodologyReplyContext(context)) return false;
  if (context.mode !== 'cross-axis') return false;

  const userQuestion = context.userQuestion ?? '';
  if (!isChassisMacroQuestion(userQuestion)) return false;

  const detectedAxis = detectQuestionFocusAxis(userQuestion, {
    mode: 'cross-axis',
    focusAxis: null,
    focusAxisLexicon: null,
  });
  if (detectedAxis != null) return false;

  return true;
}

/** Resolves which v3.0 assembly route the server will take for a given context + question. */
export function resolveChassisSynthesisRoute(
  context: ChassisSynthesisGateInput & { gaps?: DynoIntelContextV1['gaps'] }
): ChassisSynthesisRoute {
  if (Array.isArray(context.gaps) && context.gaps.length > 0) {
    return 'gaps-short-circuit';
  }
  if (isMethodologyReplyContext(context)) {
    return 'methodology-passthrough';
  }
  if (shouldUseChassisSynthesisPipeline(context)) {
    return 'chassis-macro-synthesis';
  }
  return 'single-axis-rigid-mold';
}

/** v3.0 — single-paragraph join (no blank-line separators). */
export function assembleSingleBeatCommentary(
  summaryHuman: string,
  extension: string | null | undefined,
  locale: 'zh-Hant' | 'en' = 'zh-Hant'
): string {
  const ensureTerminal = (text: string) => {
    const row = text.trim();
    if (!row) return row;
    if (locale === 'en') return /[.!?]$/.test(row) ? row : `${row}.`;
    return /[。！？]$/.test(row) ? row : `${row}。`;
  };

  const base = ensureTerminal(String(summaryHuman ?? '').trim());
  const extra = String(extension ?? '').trim();
  if (!extra) return base;
  if (!base) return ensureTerminal(extra);
  if (base.includes(extra)) return base;
  return ensureTerminal(`${base} ${extra}`.replace(/\s{2,}/g, ' ').trim());
}
