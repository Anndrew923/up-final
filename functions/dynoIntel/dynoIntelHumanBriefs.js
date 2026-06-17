/**
 * v3.3.2 — Dual-layer human brief codex (population pyramid + per-axis tier tails).
 * WHY: Commentary P1 = axis prefix + populationClass + core-aligned tier tail; overall uses scale summaryHuman.
 */
import {
  DYNO_INTEL_AXIS_TIER_BRIEFS_EN,
  DYNO_INTEL_AXIS_TIER_BRIEFS_ZH,
} from "./dynoIntelAxisTierBriefs.data.js";
import {
  DYNO_INTEL_HUMAN_SCALE_MATRIX_EN,
  DYNO_INTEL_HUMAN_SCALE_MATRIX_ZH,
} from "./dynoIntelHumanScaleMatrix.js";
import { resolvePrimaryBeatSnap, resolveReplyLocale } from "./beatTemplates.js";
import { isChassisMacroQuestion, detectQuestionFocusAxis } from "./resolveQuestionIntent.js";
import {
  resolveHumanScaleDecadeKey,
  resolveScoreBandId,
} from "./scoreBandResolver.js";

const SCALE_MATRIX_BY_LOCALE = {
  "zh-Hant": DYNO_INTEL_HUMAN_SCALE_MATRIX_ZH,
  en: DYNO_INTEL_HUMAN_SCALE_MATRIX_EN,
};

const AXIS_TIER_BRIEFS_BY_LOCALE = {
  "zh-Hant": DYNO_INTEL_AXIS_TIER_BRIEFS_ZH,
  en: DYNO_INTEL_AXIS_TIER_BRIEFS_EN,
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

function isChassisMacroContext(context) {
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

function resolveAxisTierBriefs(locale) {
  return AXIS_TIER_BRIEFS_BY_LOCALE[normalizeLocale(locale)];
}

function resolveAxisPrefix(axis, locale) {
  const map = AXIS_PREFIX_BY_LOCALE[normalizeLocale(locale)];
  return map[axis] ?? map.overall;
}

function resolveScaleRow(decadeKey, locale) {
  const matrix = resolveScaleMatrix(locale);
  return matrix[decadeKey] ?? matrix["0"];
}

function resolveAxisTierTail(axis, tierId, locale) {
  const briefs = resolveAxisTierBriefs(locale);
  const axisBriefs = briefs[axis];
  if (!axisBriefs) return null;
  return (
    axisBriefs[tierId] ??
    axisBriefs.BASE ??
    axisBriefs.TIER_50 ??
    Object.values(axisBriefs)[0] ??
    null
  );
}

function belongsGlue(locale) {
  return normalizeLocale(locale) === "en" ? " maps to " : "屬於";
}

/**
 * v3.3.2 — deterministic P1 anchor from population pyramid + per-axis tier tail.
 */
export function resolveRigidHumanPopulationClass(axis, score, locale = "zh-Hant") {
  const metric = BRIEF_METRICS.has(axis) ? axis : "overall";
  const tierId = resolveScoreBandId(metric === "5km" ? "cardio" : metric === "overall" ? "strength" : metric, score);
  const decadeKey = resolveHumanScaleDecadeKey(tierId);
  const scaleRow = resolveScaleRow(decadeKey, locale);
  const prefix = resolveAxisPrefix(metric, locale);

  if (metric === "overall") {
    const tail = resolveAxisTierTail("overall", tierId, locale) ?? scaleRow.summaryHuman;
    const anchor =
      normalizeLocale(locale) === "en"
        ? `${prefix}${belongsGlue(locale)}${scaleRow.populationClass}. ${tail}`
        : `${prefix}${belongsGlue(locale)}${scaleRow.populationClass}，${tail}`;
    return containsVehicleLexicon(anchor) ? scrubVehicleLexicon(anchor) : anchor;
  }

  const tail = resolveAxisTierTail(metric, tierId, locale);
  if (!tail) return null;

  const anchor =
    normalizeLocale(locale) === "en"
      ? `${prefix}${belongsGlue(locale)}${scaleRow.populationClass}. ${tail}`
      : `${prefix}${belongsGlue(locale)}${scaleRow.populationClass}，${tail}`;

  if (containsVehicleLexicon(anchor)) {
    const scrubbed = scrubVehicleLexicon(anchor);
    return scrubbed && !containsVehicleLexicon(scrubbed) ? scrubbed : null;
  }
  return anchor;
}

/**
 * Resolves the official P1 human brief for the active inference context.
 */
export function resolveHumanBrief(context) {
  if (!context) return null;
  const locale = resolveReplyLocale(context);
  const hasGaps = Array.isArray(context.gaps) && context.gaps.length > 0;
  if (hasGaps) return null;

  if (isChassisMacroContext(context)) {
    const overallScore = context?.overallScore ?? 90;
    return resolveRigidHumanPopulationClass("overall", overallScore, locale);
  }

  const focus = resolvePrimaryBeatSnap(context);
  if (!focus?.snap || focus.snap.score == null) {
    return null;
  }

  const metric = focus.metric;
  const score = focus.snap.score;
  return resolveRigidHumanPopulationClass(metric, score, locale);
}
