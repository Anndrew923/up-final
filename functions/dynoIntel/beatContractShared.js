/**
 * v3.0 — Shared beat-contract utilities (single-beat + gaps/methodology).
 */
import { resolveReplyLocale } from "./beatTemplates.js";

const CAMEL_AXIS_IN_PAREN =
  /\(\s*(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)(?:\s*(軸分數|axis\s*score))?\s*\)/gi;

export function splitCommentaryParagraphs(commentary) {
  return String(commentary ?? "")
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Strip engineering axis tags from final commentary (contract layer). */
export function stripEngineeringLeakageFromCommentary(text, locale = "zh-Hant") {
  const lines = String(text ?? "").split("\n");
  const cleaned = lines.map((line) => {
    let row = line.replace(CAMEL_AXIS_IN_PAREN, "");
    row = row.replace(
      /這份判讀直接錨定在你的遙測級距上，不是憑空套用的通用人話。?/g,
      ""
    );
    row = row.replace(
      /That verdict is anchored on your telemetry tier — not a generic ladder guess\.?/gi,
      ""
    );
    if (locale === "en") {
      row = row.replace(
        /\b(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)\s*axis\s*score\b/gi,
        "axis score"
      );
    } else {
      row = row.replace(
        /\b(strength|cardio|bodyFat|muscleMass|explosivePower|gripStrength)\s*軸分數\b/gi,
        ""
      );
    }
    return row.replace(/\s{2,}/g, " ").trimEnd();
  });
  return cleaned.join("\n").trim();
}

function normalizeParagraphKey(text) {
  return String(text ?? "")
    .replace(/\s+/g, "")
    .trim();
}

/** CJK / Latin character bigrams — catches paraphrase when substring match fails. */
function bigramSet(text) {
  const norm = normalizeParagraphKey(text);
  const set = new Set();
  for (let i = 0; i < norm.length - 1; i += 1) {
    set.add(norm.slice(i, i + 2));
  }
  return set;
}

function bigramJaccardSimilarity(a, b) {
  const left = bigramSet(a);
  const right = bigramSet(b);
  if (!left.size || !right.size) return 0;
  let intersect = 0;
  for (const token of left) {
    if (right.has(token)) intersect += 1;
  }
  return intersect / (left.size + right.size - intersect);
}

const NEAR_DUPLICATE_JACCARD_THRESHOLD = 0.38;
/** When shorter text reuses this share of its bigrams from the longer text, treat as paraphrase. */
const NEAR_DUPLICATE_COVERAGE_THRESHOLD = 0.52;

function shorterTextBigramCoverage(shorter, longer) {
  const shortBigrams = bigramSet(shorter);
  const longBigrams = bigramSet(longer);
  let covered = 0;
  for (const token of shortBigrams) {
    if (longBigrams.has(token)) covered += 1;
  }
  return covered / shortBigrams.size;
}

export function paragraphsAreNearDuplicate(a, b) {
  const left = normalizeParagraphKey(a);
  const right = normalizeParagraphKey(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length > 40 && right.length > 40 && (left.includes(right) || right.includes(left))) {
    return true;
  }

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  const lenRatio = shorter.length / longer.length;

  if (shorter.length >= 24 && longer.length >= 24 && lenRatio >= 0.55) {
    if (bigramJaccardSimilarity(left, right) >= NEAR_DUPLICATE_JACCARD_THRESHOLD) {
      return true;
    }
  }

  if (shorter.length >= 24 && longer.length >= 24) {
    if (shorterTextBigramCoverage(shorter, longer) >= NEAR_DUPLICATE_COVERAGE_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/** Split locale-aware sentences for per-sentence extension filtering. */
export function splitCommentarySentences(text) {
  return String(text ?? "")
    .split(/(?<=[。！？!?])\s*/)
    .map((row) => row.trim())
    .filter(Boolean);
}

/** Guarantee beat paragraph ends with locale-appropriate terminal punctuation. */
export function ensureBeatTerminalPunctuation(paragraph, locale = "zh-Hant") {
  const row = String(paragraph ?? "").trim();
  if (!row) return row;
  if (locale === "en") {
    return /[.!?]$/.test(row) ? row : `${row}.`;
  }
  if (/[。！？]$/.test(row)) return row;
  return `${row}。`;
}

/** Fuzzy match — model paraphrases but must preserve the pre-resolved anchor phrase. */
export function lineAlreadyPresent(commentary, line) {
  const normalized = String(line ?? "").trim();
  if (!normalized) return true;
  if (commentary.includes(normalized)) return true;

  const probeLength = Math.min(24, normalized.length);
  if (probeLength < 8) return false;
  return commentary.includes(normalized.slice(0, probeLength));
}

export function finalizeContractCommentary(commentary, context, options = {}) {
  const locale = options.locale ?? resolveReplyLocale(context);
  const mode = options.contractMode ?? "single";
  let text = stripEngineeringLeakageFromCommentary(String(commentary ?? "").trim(), locale);

  if (mode === "single" || mode === "methodology") {
    text = text
      .split(/\n\n+/)
      .map((row) => row.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return text;
}
