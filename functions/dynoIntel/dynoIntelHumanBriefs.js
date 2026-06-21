/**
 * v3.5.1 — P1 human brief: axis prefix + populationClass + soul praise (tier tail retired).
 * WHY: Drop axis tier tails to kill synonym loops; zh uses four-track soul matrix, en uses summaryHuman.
 */
import {
  DYNO_INTEL_HUMAN_SCALE_MATRIX_EN,
  DYNO_INTEL_HUMAN_SCALE_MATRIX_ZH,
} from "./dynoIntelHumanScaleMatrix.js";
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
 * v3.5.1 — deterministic P1 anchor: prefix + populationClass + soul praise (no tier tail).
 */
export function resolveRigidHumanPopulationClass(axis, score, locale = "zh-Hant", context = null) {
  const metric = BRIEF_METRICS.has(axis) ? axis : "overall";
  const bandMetric = metric === "5km" ? "cardio" : metric === "overall" ? "strength" : metric;
  const tierId = resolveScoreBandId(bandMetric, score);
  const decadeKey = resolveHumanScaleDecadeKey(tierId);
  const scaleRow = resolveScaleRow(decadeKey, locale);
  const prefix = resolveAxisPrefix(metric, locale);
  const profile = context?.profile ?? null;
  const soulPraise = resolveSoulPraiseSegment(scaleRow, metric, locale, profile);

  if (!soulPraise && normalizeLocale(locale) !== "en") {
    return null;
  }

  const anchor = assembleP1Anchor(prefix, scaleRow.populationClass, soulPraise, locale);

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
    return resolveRigidHumanPopulationClass("overall", overallScore, locale, context);
  }

  const focus = resolvePrimaryBeatSnap(context);
  if (!focus?.snap || focus.snap.score == null) {
    return null;
  }

  const metric = focus.metric;
  const score = focus.snap.score;
  return resolveRigidHumanPopulationClass(metric, score, locale, context);
}
