/**
 * v3.0 — Single-beat chassis factory (pure human P1 + AI extension merge).
 * WHY: Scores/tier titles render in UI cards; commentary is one paragraph only.
 */
import { isChassisMacroQuestion, detectQuestionFocusAxis } from "./resolveQuestionIntent.js";
import { resolveHumanBrief } from "./dynoIntelHumanBriefs.js";
import { resolveReplyLocale } from "./beatTemplates.js";

/** Shared gate — methodology replies use brief-led single paragraph assembly. */
export function isMethodologyReplyContext(context) {
  return (
    context?.intent === "methodology" || context?.closingBeatKind === "methodology-nudge"
  );
}

export function shouldUseChassisSynthesisPipeline(context) {
  if (isMethodologyReplyContext(context)) return false;
  if (context?.mode !== "cross-axis") return false;

  const userQuestion = context?.userQuestion ?? "";
  if (!isChassisMacroQuestion(userQuestion)) return false;

  const detectedAxis = detectQuestionFocusAxis(userQuestion, {
    mode: "cross-axis",
    focusAxis: null,
    focusAxisLexicon: null,
  });
  if (detectedAxis != null) return false;

  return true;
}

function ensureTerminalPunctuation(text, locale) {
  const row = String(text ?? "").trim();
  if (!row) return row;
  if (locale === "en") {
    return /[.!?]$/.test(row) ? row : `${row}.`;
  }
  if (/[。！？]$/.test(row)) return row;
  return `${row}。`;
}

/**
 * v3.0 — merge official human brief with coach extension into one paragraph (no \\n\\n).
 */
export function assembleSingleBeatCommentary(summaryHuman, extension, locale = "zh-Hant") {
  const base = ensureTerminalPunctuation(String(summaryHuman ?? "").trim(), locale);
  const extra = String(extension ?? "").trim();
  if (!extra) return base;
  if (!base) return ensureTerminalPunctuation(extra, locale);
  if (base.includes(extra)) return base;

  const joiner = locale === "en" ? " " : "";
  const merged = `${base}${joiner}${extra}`.replace(/\s{2,}/g, " ").trim();
  return ensureTerminalPunctuation(merged, locale);
}

export function injectChassisBeatsIntoContext(context) {
  if (!context) return context;
  const hasGaps = Array.isArray(context.gaps) && context.gaps.length > 0;
  if (hasGaps || isMethodologyReplyContext(context)) {
    return context;
  }

  const summaryHuman = resolveHumanBrief(context);
  if (!summaryHuman) return context;

  return {
    ...context,
    chassisBeats: {
      summaryHuman,
      p1Official: summaryHuman,
    },
  };
}

export function buildOfficialHumanAnchor(context) {
  return resolveHumanBrief(context);
}

export function resolveSingleBeatLocale(context) {
  return resolveReplyLocale(context);
}
