import {
  DYNO_INTEL_CONTEXT_SCHEMA_VERSION,
  SIX_AXIS_METRICS,
} from "../shared/constants.js";

const VALID_MODES = new Set(["single-axis", "cross-axis", "weight-simulation"]);
const VALID_LOCALES = new Set(["zh-Hant", "en"]);
const VALID_SUPPLEMENTAL_METRICS = new Set(["armSize", "cooper", "5km"]);
const VALID_SCORING_METHODOLOGY_METRICS = new Set([
  ...SIX_AXIS_METRICS,
  "armSize",
  "cooper",
  "5km",
]);
const METHODOLOGY_TITLE_MAX_LENGTH = 200;
const METHODOLOGY_BODY_MAX_LENGTH = 8000;
const ASSESSMENT_DEEP_DIVE_NUDGE_MAX_LENGTH = 500;
const REPLY_CLOSING_CUE_MAX_LENGTH = 800;

/** Mirrors client scoreMeaning card copy — prevents Callable abuse. */
const CARD_COPY_TITLE_MAX_LENGTH = 200;
const CARD_COPY_SUMMARY_MAX_LENGTH = 2000;

const FORBIDDEN_CONTEXT_KEYS = new Set([
  "displayName",
  "avatarUrl",
  "city",
  "district",
  "region",
  "countryCode",
  "jobCategory",
  "age",
  "uid",
  "email",
]);

function assertNoForbiddenKeys(value, path = "") {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_CONTEXT_KEYS.has(key)) {
      const err = new Error(`forbidden-pii:${key}`);
      err.code = "invalid-argument";
      throw err;
    }
    assertNoForbiddenKeys(nested, path ? `${path}.${key}` : key);
  }
}

function assertFocusAxisLexicon(lexicon) {
  if (lexicon == null) return;
  if (typeof lexicon !== "object" || Array.isArray(lexicon)) {
    const err = new Error("invalid-focus-axis-lexicon");
    err.code = "invalid-argument";
    throw err;
  }
  if (!isValidSixAxisMetric(lexicon.axis) || !isValidSixAxisMetric(lexicon.telemetryKey)) {
    const err = new Error("invalid-focus-axis-lexicon-axis");
    err.code = "invalid-argument";
    throw err;
  }
  if (
    typeof lexicon.surfaceLabel !== "string" ||
    lexicon.surfaceLabel.length === 0 ||
    lexicon.surfaceLabel.length > 200
  ) {
    const err = new Error("invalid-focus-axis-lexicon-label");
    err.code = "invalid-argument";
    throw err;
  }
}

function assertCardCopy(cardCopy, pathLabel) {
  if (cardCopy == null) return;
  if (typeof cardCopy !== "object" || Array.isArray(cardCopy)) {
    const err = new Error(`invalid-card-copy:${pathLabel}`);
    err.code = "invalid-argument";
    throw err;
  }
  const { title, summary } = cardCopy;
  if (typeof title !== "string" || title.length === 0 || title.length > CARD_COPY_TITLE_MAX_LENGTH) {
    const err = new Error(`invalid-card-copy-title:${pathLabel}`);
    err.code = "invalid-argument";
    throw err;
  }
  if (
    typeof summary !== "string" ||
    summary.length === 0 ||
    summary.length > CARD_COPY_SUMMARY_MAX_LENGTH
  ) {
    const err = new Error(`invalid-card-copy-summary:${pathLabel}`);
    err.code = "invalid-argument";
    throw err;
  }
}

function assertAxisCardCopy(axis, index) {
  assertCardCopy(axis?.cardCopy, `axes[${index}]`);
}

function assertSupplementalMetricCardCopy(metric, index) {
  assertCardCopy(metric?.cardCopy, `supplementalMetrics[${index}]`);
}

function assertSupplementalMetrics(supplementalMetrics) {
  if (supplementalMetrics == null) return;
  if (!Array.isArray(supplementalMetrics)) {
    const err = new Error("invalid-supplemental-metrics");
    err.code = "invalid-argument";
    throw err;
  }
  const seenMetrics = new Set();
  for (let index = 0; index < supplementalMetrics.length; index += 1) {
    const entry = supplementalMetrics[index];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      const err = new Error(`invalid-supplemental-metric:supplementalMetrics[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    if (!VALID_SUPPLEMENTAL_METRICS.has(entry.metric)) {
      const err = new Error(`invalid-supplemental-metric-id:supplementalMetrics[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    if (seenMetrics.has(entry.metric)) {
      const err = new Error(`duplicate-supplemental-metric:supplementalMetrics[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    seenMetrics.add(entry.metric);
    if (typeof entry.score !== "number" || !Number.isFinite(entry.score) || entry.score <= 0) {
      const err = new Error(`invalid-supplemental-metric-score:supplementalMetrics[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    if (typeof entry.tierBandId !== "string" || entry.tierBandId.length === 0) {
      const err = new Error(`invalid-supplemental-metric-tier:supplementalMetrics[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    assertSupplementalMetricCardCopy(entry, index);
  }
}

function assertFocusSupplemental(focusSupplemental) {
  if (focusSupplemental == null) return;
  if (!VALID_SUPPLEMENTAL_METRICS.has(focusSupplemental)) {
    const err = new Error("invalid-focus-supplemental");
    err.code = "invalid-argument";
    throw err;
  }
}

function assertScoringMethodologyBriefs(scoringMethodologyBriefs) {
  if (scoringMethodologyBriefs == null) return;
  if (!Array.isArray(scoringMethodologyBriefs)) {
    const err = new Error("invalid-scoring-methodology-briefs");
    err.code = "invalid-argument";
    throw err;
  }
  if (scoringMethodologyBriefs.length === 0) {
    const err = new Error("empty-scoring-methodology-briefs");
    err.code = "invalid-argument";
    throw err;
  }
  const seenMetrics = new Set();
  for (let index = 0; index < scoringMethodologyBriefs.length; index += 1) {
    const entry = scoringMethodologyBriefs[index];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      const err = new Error(`invalid-scoring-methodology-brief:scoringMethodologyBriefs[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    if (!VALID_SCORING_METHODOLOGY_METRICS.has(entry.metric)) {
      const err = new Error(`invalid-scoring-methodology-metric:scoringMethodologyBriefs[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    if (seenMetrics.has(entry.metric)) {
      const err = new Error(`duplicate-scoring-methodology-metric:scoringMethodologyBriefs[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    seenMetrics.add(entry.metric);
    if (
      typeof entry.title !== "string" ||
      entry.title.length === 0 ||
      entry.title.length > METHODOLOGY_TITLE_MAX_LENGTH
    ) {
      const err = new Error(`invalid-scoring-methodology-title:scoringMethodologyBriefs[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
    if (
      typeof entry.body !== "string" ||
      entry.body.length === 0 ||
      entry.body.length > METHODOLOGY_BODY_MAX_LENGTH
    ) {
      const err = new Error(`invalid-scoring-methodology-body:scoringMethodologyBriefs[${index}]`);
      err.code = "invalid-argument";
      throw err;
    }
  }
}

function assertAssessmentDeepDiveNudge(assessmentDeepDiveNudge) {
  if (assessmentDeepDiveNudge == null) return;
  if (typeof assessmentDeepDiveNudge !== "string") {
    const err = new Error("invalid-assessment-deep-dive-nudge");
    err.code = "invalid-argument";
    throw err;
  }
  if (assessmentDeepDiveNudge.length === 0) {
    const err = new Error("empty-assessment-deep-dive-nudge");
    err.code = "invalid-argument";
    throw err;
  }
  if (assessmentDeepDiveNudge.length > ASSESSMENT_DEEP_DIVE_NUDGE_MAX_LENGTH) {
    const err = new Error("invalid-assessment-deep-dive-nudge-length");
    err.code = "invalid-argument";
    throw err;
  }
}

function assertReplyClosingCue(replyClosingCue) {
  if (replyClosingCue == null) return;
  if (typeof replyClosingCue !== "string") {
    const err = new Error("invalid-reply-closing-cue");
    err.code = "invalid-argument";
    throw err;
  }
  if (replyClosingCue.length === 0) {
    const err = new Error("empty-reply-closing-cue");
    err.code = "invalid-argument";
    throw err;
  }
  if (replyClosingCue.length > REPLY_CLOSING_CUE_MAX_LENGTH) {
    const err = new Error("invalid-reply-closing-cue-length");
    err.code = "invalid-argument";
    throw err;
  }
}

export function validateDynoIntelContext(context) {
  if (!context || typeof context !== "object") {
    const err = new Error("invalid-context");
    err.code = "invalid-argument";
    throw err;
  }
  if (context.schemaVersion !== DYNO_INTEL_CONTEXT_SCHEMA_VERSION) {
    const err = new Error("unsupported-schema");
    err.code = "invalid-argument";
    throw err;
  }
  if (!context.mode || typeof context.mode !== "string" || !VALID_MODES.has(context.mode)) {
    const err = new Error("invalid-mode");
    err.code = "invalid-argument";
    throw err;
  }
  if (
    context.locale != null &&
    (typeof context.locale !== "string" || !VALID_LOCALES.has(context.locale))
  ) {
    const err = new Error("invalid-locale");
    err.code = "invalid-argument";
    throw err;
  }
  if (!Array.isArray(context.axes)) {
    const err = new Error("invalid-axes");
    err.code = "invalid-argument";
    throw err;
  }
  assertNoForbiddenKeys(context);

  for (let index = 0; index < context.axes.length; index += 1) {
    assertAxisCardCopy(context.axes[index], index);
  }

  assertSupplementalMetrics(context.supplementalMetrics);
  assertFocusSupplemental(context.focusSupplemental);
  assertScoringMethodologyBriefs(context.scoringMethodologyBriefs);
  assertAssessmentDeepDiveNudge(context.assessmentDeepDiveNudge);
  assertReplyClosingCue(context.replyClosingCue);

  if (context.focusAxisLexicon != null) {
    assertFocusAxisLexicon(context.focusAxisLexicon);
    if (
      context.focusAxis != null &&
      context.focusAxisLexicon.axis !== context.focusAxis
    ) {
      const err = new Error("invalid-focus-axis-lexicon-mismatch");
      err.code = "invalid-argument";
      throw err;
    }
    if (context.focusAxisLexicon.telemetryKey !== context.focusAxisLexicon.axis) {
      const err = new Error("invalid-focus-axis-lexicon-telemetry");
      err.code = "invalid-argument";
      throw err;
    }
  }

  if (context.profile && typeof context.profile.age === "number") {
    const err = new Error("exact-age-forbidden");
    err.code = "invalid-argument";
    throw err;
  }

  if (
    context.mode === "weight-simulation" &&
    (!context.weightSimulation || !context.weightSimulation.enabled)
  ) {
    const err = new Error("weight-simulation-context-missing");
    err.code = "invalid-argument";
    throw err;
  }

  return true;
}

export function isValidSixAxisMetric(value) {
  return typeof value === "string" && SIX_AXIS_METRICS.includes(value);
}
