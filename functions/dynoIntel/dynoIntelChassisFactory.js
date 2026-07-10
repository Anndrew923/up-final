/**
 * v5.2 — Golden three-segment chassis factory (segment1 AI merge + backend-hardcoded segments 2–3).
 * WHY: Scores/tier titles render in UI cards; commentary uses \\n\\n paragraph breaks on zh-Hant.
 */
import { isChassisMacroQuestion, detectQuestionFocusAxis } from "./resolveQuestionIntent.js";
import {
  resolveHumanBrief,
  resolveHumanBriefPartsFromContext,
} from "./dynoIntelHumanBriefs.js";
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
 * v5.2 — merge segment1 official copy with coach extension (single flowing block, no \\n\\n).
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

  const parts = resolveHumanBriefPartsFromContext(context);
  if (!parts?.segment1Core) return context;

  return {
    ...context,
    chassisBeats: {
      summaryHuman: parts.fullBrief,
      p1Official: parts.segment1Core,
      prSegment: parts.prSegment,
      legalSegment: parts.legalSegment,
    },
  };
}

/** Single resolve — segment1 + trailing segments for beat repair (avoids double matrix lookup). */
export function resolveChassisBriefAssembly(context) {
  const cachedP1 = context?.chassisBeats?.p1Official;
  if (typeof cachedP1 === "string" && cachedP1.trim()) {
    const cachedTrailing = [context.chassisBeats?.prSegment, context.chassisBeats?.legalSegment].filter(
      (row) => typeof row === "string" && row.trim()
    );
    if (cachedTrailing.length > 0) {
      return { segment1Core: cachedP1.trim(), trailingSegments: cachedTrailing };
    }
    // Gemini payload keeps p1 only — refresh PR/legal without reshuffling the welded segment1.
    const parts = resolveHumanBriefPartsFromContext(context);
    return {
      segment1Core: cachedP1.trim(),
      trailingSegments: [parts?.prSegment, parts?.legalSegment].filter(Boolean),
    };
  }

  const parts = resolveHumanBriefPartsFromContext(context);
  if (!parts?.segment1Core) return null;
  return {
    segment1Core: parts.segment1Core,
    trailingSegments: [parts.prSegment, parts.legalSegment].filter(Boolean),
  };
}

/** Segment 1 only — AI extension target; excludes PR and legal shield. */
export function buildOfficialHumanAnchor(context) {
  return resolveChassisBriefAssembly(context)?.segment1Core ?? null;
}

/** Segments 2–3 — backend-hardcoded; beat repair re-appends after AI merge. */
export function buildBriefTrailingSegments(context) {
  return resolveChassisBriefAssembly(context)?.trailingSegments ?? [];
}

/** @deprecated v5.2 — use buildOfficialHumanAnchor for AI target; resolveHumanBrief for full output */
export function buildOfficialHumanBrief(context) {
  return resolveHumanBrief(context);
}

export function resolveSingleBeatLocale(context) {
  return resolveReplyLocale(context);
}
