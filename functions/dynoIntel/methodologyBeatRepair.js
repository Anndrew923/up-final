/**
 * v3.0.5 — Methodology single-paragraph repair (axis-locked brief + completeness guard).
 */
import {
  paragraphsAreNearDuplicate,
  finalizeContractCommentary,
} from "./beatContractShared.js";
import { resolveSingleBeatLocale } from "./dynoIntelChassisFactory.js";
import { scrubVehicleLexicon } from "./dynoIntelHumanBriefs.js";

/** Anchor excerpt cap — sentence-aware, not a hard mid-clause slice. */
export const METHODOLOGY_ANCHOR_MAX_CHARS = 480;
/** Model synthesis above this length owns the paragraph — do not prepend brief anchor (v3.0.4). */
export const METHODOLOGY_MODEL_OWNERSHIP_MIN_CHARS = 32;
/** Methodology commentary shorter than this is treated as truncated / failed synthesis. */
export const METHODOLOGY_MIN_COMPLETE_CHARS = 40;

const METHODOLOGY_DEBRIS_PATTERNS = [
  /DYNO INTEL 收到你的詢問/gi,
  /收到你的詢問/gi,
  /收到詢問/gi,
  /payload贅肉/gi,
  /\bpayload\b/gi,
];

function collapseToSingleParagraph(text) {
  return String(text ?? "")
    .split(/\n\n+/)
    .map((row) => row.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripMethodologyDebris(text) {
  let row = String(text ?? "");
  for (const pattern of METHODOLOGY_DEBRIS_PATTERNS) {
    row = row.replace(pattern, "");
  }
  return row.replace(/\s{2,}/g, " ").trim();
}

function splitMethodologyClauses(text) {
  return String(text ?? "")
    .split(/(?<=[。！？!?；;])\s*/)
    .map((row) => row.trim())
    .filter((row) => row.length >= 8);
}

/**
 * Cap text at the last sentence boundary within maxChars — avoids mid-clause truncation.
 */
export function capTextAtSentenceBoundary(text, maxChars, locale = "zh-Hant") {
  const row = String(text ?? "").trim();
  if (!row || row.length <= maxChars) return row;

  const slice = row.slice(0, maxChars);
  const stops =
    locale === "en"
      ? [".", "!", "?", ";"]
      : ["。", "！", "？", "；", ".", "!", "?", ";"];

  let lastStop = -1;
  for (const stop of stops) {
    lastStop = Math.max(lastStop, slice.lastIndexOf(stop));
  }

  const minKeep = Math.floor(maxChars * 0.35);
  if (lastStop >= minKeep) {
    return slice.slice(0, lastStop + 1).trim();
  }

  return slice.trim();
}

/**
 * Detect truncated methodology synthesis (salvage flakes, MAX_TOKENS, model glitches).
 * WHY: Structural checks only — no symptom-specific regex; incomplete text fails terminal punct.
 */
export function isMethodologyCommentaryComplete(text, locale = "zh-Hant") {
  const row = String(text ?? "").trim();
  if (!row || row.length < METHODOLOGY_MIN_COMPLETE_CHARS) return false;

  if (locale === "en") {
    if (!/[.!?]$/.test(row)) return false;
    if (/[,;:]\s*$/.test(row)) return false;
    if (/\b(and|or|for|with|due)\s*$/i.test(row)) return false;
    return true;
  }

  if (!/[。！？]$/.test(row)) return false;
  if (/[，、：；]$/.test(row)) return false;

  return true;
}

/**
 * v3.0.4 — drop clause-level synonym loops inside a single methodology paragraph.
 */
export function pruneSynonymLoopsInParagraph(text) {
  const clauses = splitMethodologyClauses(text);
  if (clauses.length <= 1) return String(text ?? "").trim();

  const kept = [];
  for (const clause of clauses) {
    const isLoop = kept.some((prev) => paragraphsAreNearDuplicate(prev, clause));
    if (!isLoop) kept.push(clause);
  }

  if (!kept.length) return String(text ?? "").trim();
  return kept.join("");
}

function resolvePrimaryMethodologyBrief(context) {
  const briefs = Array.isArray(context?.scoringMethodologyBriefs)
    ? context.scoringMethodologyBriefs
    : [];
  if (!briefs.length) return null;

  const focus = context?.questionFocusAxis;
  if (focus) {
    const matched = briefs.find((row) => row.metric === focus);
    if (matched) return matched;
  }

  return briefs[0] ?? null;
}

function formatBriefWithTitle(primary) {
  const body = collapseToSingleParagraph(primary?.body);
  const title = String(primary?.title ?? "").trim();
  if (title && body && !body.includes(title)) {
    return `${title}：${body}`;
  }
  return body || title || null;
}

/**
 * Full pruned brief — deterministic fallback when model/salvage output is incomplete.
 */
export function resolveMethodologyFullBrief(context) {
  const primary = resolvePrimaryMethodologyBrief(context);
  if (!primary) return null;
  return formatBriefWithTitle(primary);
}

/**
 * Short fallback anchor from the pruned primary brief — never dump all nine axis bodies.
 */
export function resolveMethodologyBriefAnchor(context) {
  const primary = resolvePrimaryMethodologyBrief(context);
  if (!primary) return null;

  const body = String(primary.body ?? "").trim();
  if (!body) {
    return String(primary.title ?? "").trim() || null;
  }

  const locale = resolveSingleBeatLocale(context);
  const firstParagraph =
    body
      .split(/\n\n+/)
      .map((row) => row.trim())
      .filter(Boolean)[0] ?? body;
  const capped = capTextAtSentenceBoundary(firstParagraph, METHODOLOGY_ANCHOR_MAX_CHARS, locale);
  const title = String(primary.title ?? "").trim();
  if (title && capped && !capped.includes(title)) {
    return `${title}：${capped}`;
  }
  return capped || title || null;
}

/**
 * Replace truncated model/salvage commentary with catalog truth when needed.
 */
export function ensureMethodologyCommentaryComplete(commentary, context) {
  const locale = resolveSingleBeatLocale(context);
  let row = scrubVehicleLexicon(String(commentary ?? "").trim());
  if (isMethodologyCommentaryComplete(row, locale)) {
    return row;
  }

  const full = resolveMethodologyFullBrief(context);
  if (full) {
    return pruneSynonymLoopsInParagraph(scrubVehicleLexicon(full));
  }

  const anchor = resolveMethodologyBriefAnchor(context);
  return anchor || row;
}

function mergeMethodologyCommentary(modelText, briefAnchor) {
  let commentary = stripMethodologyDebris(collapseToSingleParagraph(modelText));
  const anchor = briefAnchor ? stripMethodologyDebris(briefAnchor) : "";

  if (!commentary && anchor) return pruneSynonymLoopsInParagraph(anchor);
  if (!anchor) return pruneSynonymLoopsInParagraph(commentary);

  if (paragraphsAreNearDuplicate(commentary, anchor)) {
    const pick = commentary.length >= anchor.length ? commentary : anchor;
    return pruneSynonymLoopsInParagraph(pick);
  }

  const probe = anchor.slice(0, Math.min(16, anchor.length));
  if (probe.length >= 6 && commentary.includes(probe)) {
    return pruneSynonymLoopsInParagraph(commentary);
  }

  // v3.0.4: model synthesis owns the paragraph — never stack anchor + paraphrase.
  if (commentary.length >= METHODOLOGY_MODEL_OWNERSHIP_MIN_CHARS) {
    return pruneSynonymLoopsInParagraph(commentary);
  }

  const merged = `${anchor} ${commentary}`.trim();
  return pruneSynonymLoopsInParagraph(merged);
}

/**
 * Repair methodology replies to a stable single-paragraph commentary block.
 */
export function repairMethodologyCommentary(reply, context) {
  let commentary = collapseToSingleParagraph(reply.commentary);
  if (!commentary) {
    commentary =
      resolveMethodologyFullBrief(context) ?? resolveMethodologyBriefAnchor(context) ?? "";
    if (!commentary) return reply;
  }

  const briefAnchor = resolveMethodologyBriefAnchor(context);
  commentary = mergeMethodologyCommentary(commentary, briefAnchor);
  commentary = pruneSynonymLoopsInParagraph(commentary);
  commentary = ensureMethodologyCommentaryComplete(commentary, context);
  const locale = resolveSingleBeatLocale(context);

  return {
    ...reply,
    commentary: finalizeContractCommentary(commentary, context, {
      contractMode: "methodology",
      locale,
    }),
  };
}

/** @deprecated v3.0 — no-op; kept for backward-compatible re-exports only. */
export function repairMissingHumanBeat(paragraphs) {
  return paragraphs;
}
