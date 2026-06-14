import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDynoIntelCacheHash, shouldPersistDynoIntelCache } from "../dynoIntel/cache.js";

describe("buildDynoIntelCacheHash", () => {
  const baseParts = {
    mergedScores: [{ axis: "bodyFat", score: 96 }],
    deltas: [],
    mode: "single-axis",
    focusAxis: "bodyFat",
    locale: "zh-Hant",
    weightSimulationTargetKg: null,
    promptTemplateId: "system_v1",
    userQuestion: "FFMI 分數多少",
  };

  it("is stable for identical diagnostic context", () => {
    const a = buildDynoIntelCacheHash(baseParts);
    const b = buildDynoIntelCacheHash({ ...baseParts });
    assert.equal(a, b);
  });

  it("changes when focus axis changes", () => {
    const bodyFatHash = buildDynoIntelCacheHash(baseParts);
    const strengthHash = buildDynoIntelCacheHash({
      ...baseParts,
      focusAxis: "strength",
    });
    assert.notEqual(bodyFatHash, strengthHash);
  });

  it("changes when mode changes", () => {
    const singleAxis = buildDynoIntelCacheHash(baseParts);
    const crossAxis = buildDynoIntelCacheHash({
      ...baseParts,
      mode: "cross-axis",
      focusAxis: null,
    });
    assert.notEqual(singleAxis, crossAxis);
  });

  it("changes when weight simulation target changes", () => {
    const baseline = buildDynoIntelCacheHash(baseParts);
    const simulated = buildDynoIntelCacheHash({
      ...baseParts,
      mode: "weight-simulation",
      weightSimulationTargetKg: 72,
    });
    assert.notEqual(baseline, simulated);
  });

  it("changes when supplemental focus or metrics change", () => {
    const baseline = buildDynoIntelCacheHash(baseParts);
    const withSupplemental = buildDynoIntelCacheHash({
      ...baseParts,
      supplementalMetrics: [{ metric: "armSize", score: 130, tierBandId: "TIER_130" }],
      focusSupplemental: "armSize",
    });
    assert.notEqual(baseline, withSupplemental);
  });

  it("changes when scoring methodology briefs change", () => {
    const baseline = buildDynoIntelCacheHash(baseParts);
    const withBriefs = buildDynoIntelCacheHash({
      ...baseParts,
      scoringMethodologyBriefs: [{ metric: "strength", title: "計分", body: "Brzycki" }],
    });
    assert.notEqual(baseline, withBriefs);
  });

  it("changes when reply closing cue changes", () => {
    const baseline = buildDynoIntelCacheHash(baseParts);
    const withCue = buildDynoIntelCacheHash({
      ...baseParts,
      replyClosingCue: "通電完成。這份遙測已寫入主機。",
    });
    assert.notEqual(baseline, withCue);
  });

  it("changes when closing beat fields change", () => {
    const baseline = buildDynoIntelCacheHash(baseParts);
    const withBeat = buildDynoIntelCacheHash({
      ...baseParts,
      closingBeatKind: "passion-close",
      closingBeatSecondLine: "主機記得這條曲線。",
      questionFocusAxis: "bodyFat",
    });
    assert.notEqual(baseline, withBeat);
  });
});

describe("shouldPersistDynoIntelCache", () => {
  it("rejects off-topic replies", () => {
    assert.equal(
      shouldPersistDynoIntelCache({
        commentary: "邊界宣告",
        action_directive: "",
        is_off_topic: true,
        detected_weakest_axis: "cardio",
      }),
      false
    );
  });

  it("accepts on-topic replies", () => {
    assert.equal(
      shouldPersistDynoIntelCache({
        commentary: "力量軸解讀",
        action_directive: "補測 grip",
        is_off_topic: false,
        detected_weakest_axis: "gripStrength",
      }),
      true
    );
  });
});
