/**
 * v5.2 — Golden three-segment human brief: segment1 core + PR (macro) + legal shield (60+ hall).
 * WHY: Mobile-readable breathing room via \\n\\n; AI only extends segment1; segments 2–3 are backend-hardcoded.
 */
import {
  DYNO_INTEL_HUMAN_SCALE_MATRIX_EN,
  DYNO_INTEL_HUMAN_SCALE_MATRIX_ZH,
} from "./dynoIntelHumanScaleMatrix.js";
import {
  DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH,
  DYNO_INTEL_HALL_OF_FAME_SENTENCE_ZH,
  DYNO_INTEL_PR_PERCENTILE_FALLBACK_ZH,
} from "./dynoIntelHumanPraise.data.js";
import { resolveHallOfFameSentence } from "./hallOfFameResolver.js";
import { resolvePrimaryBeatSnap, resolveReplyLocale } from "./beatTemplates.js";
import { isChassisMacroQuestion, detectQuestionFocusAxis } from "./resolveQuestionIntent.js";
import {
  resolveHumanScaleDecadeKey,
  resolveScoreBandId,
  resolveSoulGenderTrack,
  resolveSoulMatrixFieldKey,
  resolveSoulStream,
} from "./scoreBandResolver.js";

const SCALE_MATRIX_BY_LOCALE = {
  "zh-Hant": DYNO_INTEL_HUMAN_SCALE_MATRIX_ZH,
  en: DYNO_INTEL_HUMAN_SCALE_MATRIX_EN,
};

/** v3.3.2 — axis anchor prefixes (layer 1 opening). */
export const AXIS_ANCHOR_PREFIX_ZH = {
  strength: "以同齡一般人來看，你的多關節力量",
  explosivePower: "以同齡一般人來看，你的爆發起跳",
  cardio: "以同齡一般人來看，你的心肺續航",
  muscleMass: "以同齡同體重來看，你的骨骼肌量",
  bodyFat: "以同齡同身高來看，你的 FFMI 去脂效率",
  gripStrength: "以同齡一般人來看，你的手部握力",
  armSize: "以同齡未訓練一般人來看，你的臂圍維度",
  cooper: "以同齡一般人來看，你的十二分鐘跑距離",
  "5km": "以同齡一般人來看，你的五公里跑節奏",
  overall: "以同齡競技常模來看，你的六軸綜合體能",
};

export const AXIS_ANCHOR_PREFIX_EN = {
  strength: "Against same-age norms, your multi-joint strength",
  explosivePower: "Against same-age norms, your explosive first-step power",
  cardio: "Against same-age norms, your cardio endurance",
  muscleMass: "For your body weight and age cohort, your skeletal muscle mass",
  bodyFat: "For your height and age cohort, your FFMI lean-mass efficiency",
  gripStrength: "Against same-age norms, your grip strength",
  armSize: "Against untrained same-age norms, your arm girth",
  cooper: "Against same-age norms, your Cooper 12-minute distance",
  "5km": "Against same-age norms, your 5 km run pace",
  overall: "Against competitive sport norms, your six-axis combined output",
};

const AXIS_PREFIX_BY_LOCALE = {
  "zh-Hant": AXIS_ANCHOR_PREFIX_ZH,
  en: AXIS_ANCHOR_PREFIX_EN,
};

const BRIEF_METRICS = new Set([
  "strength",
  "explosivePower",
  "cardio",
  "muscleMass",
  "bodyFat",
  "gripStrength",
  "armSize",
  "cooper",
  "5km",
  "overall",
]);

export function isChassisMacroContext(context) {
  if (context?.mode !== "cross-axis") return false;
  const userQuestion = context?.userQuestion ?? "";
  if (!isChassisMacroQuestion(userQuestion)) return false;
  const detectedAxis = detectQuestionFocusAxis(userQuestion, {
    mode: "cross-axis",
    focusAxis: null,
    focusAxisLexicon: null,
  });
  return detectedAxis == null;
}

/** v3.3.2 — rigid vehicle lexicon lint for AI commentary assembly. */
export const VEHICLE_LEXICON_REGEX =
  /馬力|跑車|輪胎|冷卻|底盤|Bar|hp|Nm|排量|渦輪|熱熔|通電|遙測主機|引擎|防滾架|車架|續航天賦|淨引擎|遙測底盤|抓地頻譜|空力噸位/i;

export function containsVehicleLexicon(text) {
  return VEHICLE_LEXICON_REGEX.test(String(text ?? ""));
}

export function scrubVehicleLexicon(text) {
  return String(text ?? "")
    .replace(VEHICLE_LEXICON_REGEX, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[，,、]{2,}/g, "，")
    .trim();
}

function normalizeLocale(locale) {
  return locale === "en" ? "en" : "zh-Hant";
}

function resolveScaleMatrix(locale) {
  return SCALE_MATRIX_BY_LOCALE[normalizeLocale(locale)];
}

function resolveAxisPrefix(axis, locale) {
  const map = AXIS_PREFIX_BY_LOCALE[normalizeLocale(locale)];
  return map[axis] ?? map.overall;
}

function resolveScaleRow(decadeKey, locale) {
  const matrix = resolveScaleMatrix(locale);
  return matrix[decadeKey] ?? matrix["0"];
}

function belongsGlue(locale) {
  return normalizeLocale(locale) === "en" ? " maps to " : "屬於";
}

function resolveSoulPraiseSegment(scaleRow, axis, locale, profile) {
  if (normalizeLocale(locale) === "en") {
    return String(scaleRow.summaryHuman ?? "").trim();
  }

  if (axis === "overall") {
    return String(scaleRow.overall ?? scaleRow.summaryHuman ?? "").trim();
  }

  const stream = resolveSoulStream(axis);
  const genderTrack = resolveSoulGenderTrack(profile);
  const fieldKey = resolveSoulMatrixFieldKey(stream, genderTrack);
  const soul = scaleRow[fieldKey];
  if (typeof soul === "string" && soul.trim()) {
    return soul.trim();
  }

  const maleFallbackKey = resolveSoulMatrixFieldKey(stream, "male");
  return String(scaleRow[maleFallbackKey] ?? scaleRow.summaryHuman ?? "").trim();
}

function ensureTerminalPunctuation(text, locale) {
  const row = String(text ?? "").trim();
  if (!row) return row;
  if (normalizeLocale(locale) === "en") {
    return /[.!?]$/.test(row) ? row : `${row}.`;
  }
  if (/[。！？]$/.test(row)) return row;
  return `${row}。`;
}

function assembleP1Anchor(prefix, populationClass, soulPraise, locale) {
  const soul = String(soulPraise ?? "").trim();
  if (!soul) {
    return ensureTerminalPunctuation(
      normalizeLocale(locale) === "en"
        ? `${prefix}${belongsGlue(locale)}${populationClass}.`
        : `${prefix}${belongsGlue(locale)}${populationClass}`,
      locale
    );
  }

  if (normalizeLocale(locale) === "en") {
    return ensureTerminalPunctuation(
      `${prefix}${belongsGlue(locale)}${populationClass}. ${soul}`,
      locale
    );
  }

  return ensureTerminalPunctuation(
    `${prefix}${belongsGlue(locale)}${populationClass}，${soul}`,
    locale
  );
}

/**
 * v5.0 — viral-growth PR placeholder; reserved for future dynamic percentile injection.
 * @param {string} locale
 * @param {boolean} isOverallMacro
 * @param {{ prPercentile?: number | null } | null | undefined} context
 */
export function resolvePrPercentileSegment(locale, isOverallMacro, context = null) {
  if (!isOverallMacro || normalizeLocale(locale) !== "zh-Hant") return null;
  const dynamicPr = context?.prPercentile;
  if (typeof dynamicPr === "number" && Number.isFinite(dynamicPr)) {
    return `綜合你所有表現，你的總分排在全人類的 ${dynamicPr.toFixed(1)}%。`;
  }
  return DYNO_INTEL_PR_PERCENTILE_FALLBACK_ZH;
}

/**
 * v5.0 — zh-only hall-of-fame anchor from sparse matrix (60+ decades, non-blank cells only).
 */
export function resolveHallOfFameBriefSegment(axis, decadeKey, locale) {
  if (normalizeLocale(locale) !== "zh-Hant") return null;
  return resolveHallOfFameSentence(axis, decadeKey, DYNO_INTEL_HALL_OF_FAME_SENTENCE_ZH);
}

/**
 * v5.2 — golden three-segment joiner; zh-Hant uses \\n\\n for mobile breathing room.
 */
export function joinBriefSegments(segments, locale) {
  const rows = segments.map((row) => String(row ?? "").trim()).filter(Boolean);
  if (!rows.length) return null;
  const separator = normalizeLocale(locale) === "en" ? " " : "\n\n";
  return rows.join(separator);
}

/** Appends a suffix as a new sentence within the same segment (segment1 AI merge only). */
function appendLocalizedSuffix(base, suffix, locale) {
  const head = String(base ?? "").trim();
  const tail = String(suffix ?? "").trim();
  if (!head) return tail || null;
  if (!tail) return head;
  if (normalizeLocale(locale) === "en") {
    return ensureTerminalPunctuation(`${head} ${tail}`, locale);
  }
  const trimmed = head.replace(/[。！？]$/, "");
  return ensureTerminalPunctuation(`${trimmed}。${tail}`, locale);
}

function attachHallOfFameToAnchor(anchor, hallSegment, locale) {
  return appendLocalizedSuffix(anchor, hallSegment, locale);
}

/**
 * v5.2 — hall-of-fame legal shield as standalone segment 3 (zh-only).
 */
export function resolveLegalShieldSegment(score, hallSegment, locale) {
  if (!shouldAttachHallOfFameLegalShield(score, hallSegment, locale)) return null;
  return String(DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH ?? "").trim() || null;
}

/**
 * v5.1 — Boss spec gate: score >= 60 AND hall-of-fame names rendered (hallSegment truthy).
 */
export function shouldAttachHallOfFameLegalShield(score, hallSegment, locale) {
  if (!hallSegment || normalizeLocale(locale) !== "zh-Hant") return false;
  const safeScore = Number(score);
  return Number.isFinite(safeScore) && safeScore >= 60;
}

/** @deprecated v5.2 — prefer resolveLegalShieldSegment + joinBriefSegments */
export function attachLegalShieldSuffix(brief, locale) {
  const shield = String(DYNO_INTEL_HALL_OF_FAME_LEGAL_SHIELD_ZH ?? "").trim();
  if (!shield || normalizeLocale(locale) !== "zh-Hant") {
    return String(brief ?? "").trim() || null;
  }
  const head = String(brief ?? "").trim();
  return `${head}${shield}`;
}

/**
 * v5.2 — segment 1 only: axis prefix + populationClass + soul praise + optional hall-of-fame.
 * WHY: AI extension and beat repair must never touch PR or legal segments.
 */
export function resolveSegment1Core(axis, score, locale = "zh-Hant", context = null) {
  const parts = resolveHumanBriefParts(axis, score, locale, context);
  return parts?.segment1Core ?? null;
}

/**
 * v5.2 — structured golden-three assembly for a metric/score tuple.
 * @returns {{ segment1Core: string, prSegment: string | null, legalSegment: string | null, fullBrief: string } | null}
 */
export function resolveHumanBriefParts(axis, score, locale = "zh-Hant", context = null) {
  const metric = BRIEF_METRICS.has(axis) ? axis : "overall";
  const bandMetric = metric === "5km" ? "cardio" : metric === "overall" ? "strength" : metric;
  const tierId = resolveScoreBandId(bandMetric, score);
  const decadeKey = resolveHumanScaleDecadeKey(tierId);
  const scaleRow = resolveScaleRow(decadeKey, locale);
  const prefix = resolveAxisPrefix(metric, locale);
  const profile = context?.profile ?? null;
  const soulPraise = resolveSoulPraiseSegment(scaleRow, metric, locale, profile);
  const isOverallMacro = isChassisMacroContext(context);

  if (!soulPraise && normalizeLocale(locale) !== "en") {
    return null;
  }

  let segment1Core = assembleP1Anchor(prefix, scaleRow.populationClass, soulPraise, locale);
  const hallSegment = resolveHallOfFameBriefSegment(metric, decadeKey, locale);
  segment1Core = attachHallOfFameToAnchor(segment1Core, hallSegment, locale);

  if (containsVehicleLexicon(segment1Core)) {
    const scrubbed = scrubVehicleLexicon(segment1Core);
    segment1Core = scrubbed && !containsVehicleLexicon(scrubbed) ? scrubbed : null;
  }

  if (!segment1Core) return null;

  const prSegment = resolvePrPercentileSegment(locale, isOverallMacro, context);
  const legalSegment = resolveLegalShieldSegment(score, hallSegment, locale);
  const fullBrief = joinBriefSegments([segment1Core, prSegment, legalSegment], locale);

  return { segment1Core, prSegment, legalSegment, fullBrief };
}

/**
 * v5.2 — deterministic full brief (golden three segments joined).
 */
export function resolveRigidHumanPopulationClass(axis, score, locale = "zh-Hant", context = null) {
  return resolveHumanBriefParts(axis, score, locale, context)?.fullBrief ?? null;
}

/**
 * Resolves brief parts for the active inference context.
 * @returns {{ segment1Core: string, prSegment: string | null, legalSegment: string | null, fullBrief: string } | null}
 */
export function resolveHumanBriefPartsFromContext(context) {
  if (!context) return null;
  const locale = resolveReplyLocale(context);
  const hasGaps = Array.isArray(context.gaps) && context.gaps.length > 0;
  if (hasGaps) return null;

  if (isChassisMacroContext(context)) {
    const overallScore = context?.overallScore ?? 90;
    return resolveHumanBriefParts("overall", overallScore, locale, context);
  }

  const focus = resolvePrimaryBeatSnap(context);
  if (!focus?.snap || focus.snap.score == null) {
    return null;
  }

  return resolveHumanBriefParts(focus.metric, focus.snap.score, locale, context);
}

/**
 * Resolves the official P1 human brief for the active inference context.
 */
export function resolveHumanBrief(context) {
  return resolveHumanBriefPartsFromContext(context)?.fullBrief ?? null;
}
