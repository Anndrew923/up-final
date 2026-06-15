import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SIX_AXIS_METRICS } from "../shared/constants.js";
import { validateDynoIntelContext } from "../dynoIntel/validateContext.js";

/** Keep in sync with src/logic/core/dynoIntelScoringMethodologyCatalog.ts */
const EXPECTED_SCORING_METHODOLOGY_METRICS = [
  ...SIX_AXIS_METRICS,
  "armSize",
  "cooper",
  "5km",
];

const baseContext = {
  schemaVersion: 1,
  mode: "single-axis",
  axes: [],
  momentum: { hasHistory: false, deltas: [], overallDelta: null },
};

describe("validateDynoIntelContext", () => {
  it("accepts scoring methodology metrics aligned with product catalog", () => {
    assert.equal(EXPECTED_SCORING_METHODOLOGY_METRICS.length, 9);
    assert.deepEqual([...new Set(EXPECTED_SCORING_METHODOLOGY_METRICS)], EXPECTED_SCORING_METHODOLOGY_METRICS);
  });

  it("accepts a minimal valid context", () => {
    assert.equal(validateDynoIntelContext(baseContext), true);
  });

  it("rejects unsupported schema version", () => {
    assert.throws(
      () => validateDynoIntelContext({ ...baseContext, schemaVersion: 2 }),
      /unsupported-schema/
    );
  });

  it("rejects invalid mode", () => {
    assert.throws(
      () => validateDynoIntelContext({ ...baseContext, mode: "free-chat" }),
      /invalid-mode/
    );
  });

  it("rejects forbidden PII keys", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          profile: { displayName: "Boss", ageBucket: "18-30" },
        }),
      /forbidden-pii:displayName/
    );
  });

  it("requires weightSimulation block for weight-simulation mode", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          mode: "weight-simulation",
        }),
      /weight-simulation-context-missing/
    );
  });

  it("accepts weight-simulation when simulation payload is enabled", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        mode: "weight-simulation",
        weightSimulation: { enabled: true, targetWeightKg: 72, strengthScoreAtTarget: 80 },
      }),
      true
    );
  });

  it("accepts axes with valid cardCopy metadata", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        axes: [
          {
            axis: "strength",
            score: 72,
            tierBandId: "TIER_70",
            cardCopy: {
              title: "250hp後驅小跑",
              summary: "【250hp後驅小跑】商業健身房中的高階表現。",
            },
          },
        ],
      }),
      true
    );
  });

  it("rejects cardCopy with empty title", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          axes: [
            {
              axis: "strength",
              score: 72,
              cardCopy: { title: "", summary: "valid summary" },
            },
          ],
        }),
      /invalid-card-copy-title/
    );
  });

  it("rejects cardCopy summary exceeding max length", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          axes: [
            {
              axis: "muscleMass",
              score: 80,
              cardCopy: {
                title: "6.2L V8肌肉巨獸",
                summary: "x".repeat(2001),
              },
            },
          ],
        }),
      /invalid-card-copy-summary/
    );
  });

  it("accepts valid focusAxisLexicon", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        focusAxisLexicon: {
          axis: "bodyFat",
          telemetryKey: "bodyFat",
          surfaceLabel: "FFMI / 引擎排量 (bodyFat 軸分數)",
        },
      }),
      true
    );
  });

  it("rejects focusAxisLexicon with invalid axis", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          focusAxisLexicon: {
            axis: "ffmi",
            telemetryKey: "bodyFat",
            surfaceLabel: "FFMI",
          },
        }),
      /invalid-focus-axis-lexicon-axis/
    );
  });

  it("rejects focusAxisLexicon that mismatches focusAxis", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          focusAxis: "bodyFat",
          focusAxisLexicon: {
            axis: "strength",
            telemetryKey: "strength",
            surfaceLabel: "Strength",
          },
        }),
      /invalid-focus-axis-lexicon-mismatch/
    );
  });

  it("rejects focusAxisLexicon with mismatched telemetryKey", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          focusAxis: "bodyFat",
          focusAxisLexicon: {
            axis: "bodyFat",
            telemetryKey: "strength",
            surfaceLabel: "FFMI",
          },
        }),
      /invalid-focus-axis-lexicon-telemetry/
    );
  });

  it("rejects unsupported locale", () => {
    assert.throws(
      () => validateDynoIntelContext({ ...baseContext, locale: "ja" }),
      /invalid-locale/
    );
  });

  it("accepts en locale", () => {
    assert.equal(validateDynoIntelContext({ ...baseContext, locale: "en" }), true);
  });

  it("accepts valid intent values", () => {
    assert.equal(validateDynoIntelContext({ ...baseContext, intent: "methodology" }), true);
    assert.equal(validateDynoIntelContext({ ...baseContext, intent: "general" }), true);
  });

  it("rejects invalid intent", () => {
    assert.throws(
      () => validateDynoIntelContext({ ...baseContext, intent: "free-chat" }),
      /invalid-intent/
    );
  });

  it("accepts supplementalMetrics with valid cardCopy", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        supplementalMetrics: [
          {
            metric: "armSize",
            score: 130,
            tierBandId: "TIER_130",
            cardCopy: {
              title: "臂圍怪獸",
              summary: "【臂圍怪獸】頂級圍度規格。",
            },
          },
        ],
        focusSupplemental: "armSize",
      }),
      true
    );
  });

  it("rejects invalid supplemental metric id", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          supplementalMetrics: [{ metric: "grip", score: 80, tierBandId: "TIER_80" }],
        }),
      /invalid-supplemental-metric-id/
    );
  });

  it("rejects invalid focusSupplemental", () => {
    assert.throws(
      () => validateDynoIntelContext({ ...baseContext, focusSupplemental: "cardio" }),
      /invalid-focus-supplemental/
    );
  });

  it("rejects duplicate supplemental metric ids", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          supplementalMetrics: [
            { metric: "armSize", score: 130, tierBandId: "TIER_130" },
            { metric: "armSize", score: 120, tierBandId: "TIER_120" },
          ],
        }),
      /duplicate-supplemental-metric/
    );
  });

  it("accepts valid scoringMethodologyBriefs", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        scoringMethodologyBriefs: [
          {
            metric: "strength",
            title: "計分說明",
            body: "Brzycki 與 DOTS 換算。",
          },
          {
            metric: "cooper",
            title: "Cooper 12 分鐘跑步測驗",
            body: "依年齡組對照常模距離表換算。",
          },
        ],
      }),
      true
    );
  });

  it("rejects invalid scoring methodology metric id", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          scoringMethodologyBriefs: [{ metric: "benchPress", title: "x", body: "y" }],
        }),
      /invalid-scoring-methodology-metric/
    );
  });

  it("rejects duplicate scoring methodology metric ids", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          scoringMethodologyBriefs: [
            { metric: "strength", title: "a", body: "b" },
            { metric: "strength", title: "c", body: "d" },
          ],
        }),
      /duplicate-scoring-methodology-metric/
    );
  });

  it("rejects empty scoringMethodologyBriefs array", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          scoringMethodologyBriefs: [],
        }),
      /empty-scoring-methodology-briefs/
    );
  });

  it("accepts assessmentDeepDiveNudge when enriched", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        assessmentDeepDiveNudge: "各評測頁面備有更完整的計分說明——請直接進入對應評測頁查閱。",
      }),
      true
    );
  });

  it("rejects empty assessmentDeepDiveNudge", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          assessmentDeepDiveNudge: "",
        }),
      /empty-assessment-deep-dive-nudge/
    );
  });

  it("accepts replyClosingCue when enriched", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        replyClosingCue: "通電完成。這份遙測已寫入主機——下次再來對照。",
        closingBeatKind: "return-ritual",
        closingBeatSecondLine: "下次通電時，帶著新的分數回來——我會在這裡等你。",
      }),
      true
    );
  });

  it("rejects replyClosingCue without beat-3 bundle fields", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          replyClosingCue: "通電完成。這份遙測已寫入主機——下次再來對照。",
        }),
      /missing-closing-beat-kind/
    );
  });

  it("rejects invalid questionFocusAxis", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          questionFocusAxis: "invalid-axis",
        }),
      /invalid-question-focus-axis/
    );
  });

  it("rejects empty replyClosingCue", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          replyClosingCue: "",
        }),
      /empty-reply-closing-cue/
    );
  });

  it("accepts closingBeatKind and closingBeatSecondLine when enriched", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        replyClosingCue: "通電完成。這份遙測已寫入主機——下次再來對照。",
        closingBeatKind: "return-ritual",
        closingBeatSecondLine: "下次通電時，帶著新的分數回來——我會在這裡等你。",
      }),
      true
    );
  });

  it("rejects invalid closingBeatKind", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          closingBeatKind: "evergreen-ad",
        }),
      /invalid-closing-beat-kind/
    );
  });

  it("rejects empty closingBeatSecondLine", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          closingBeatSecondLine: "",
        }),
      /empty-closing-beat-second-line/
    );
  });
});
