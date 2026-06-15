import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDynoIntelInferenceContext,
  collectOnDemandMethodologyMetrics,
  pruneScoringMethodologyBriefs,
} from "../dynoIntel/pruneScoringMethodologyBriefs.js";
import {
  detectQuestionFocusAxis,
  detectQuestionFocusSupplemental,
} from "../dynoIntel/resolveQuestionIntent.js";

const ALL_BRIEFS = [
  { metric: "bodyFat", title: "FFMI", body: "a" },
  { metric: "strength", title: "力量", body: "b" },
  { metric: "gripStrength", title: "握力", body: "c" },
  { metric: "cardio", title: "心肺", body: "d" },
  { metric: "explosivePower", title: "爆發", body: "e" },
  { metric: "muscleMass", title: "肌肉量", body: "f" },
  { metric: "armSize", title: "臂圍", body: "g" },
  { metric: "cooper", title: "Cooper", body: "h" },
  { metric: "5km", title: "5km", body: "i" },
];

describe("detectQuestionFocusAxis", () => {
  it("maps FFMI questions to bodyFat", () => {
    assert.equal(detectQuestionFocusAxis("我的 FFMI 分數代表什麼？", {}), "bodyFat");
  });

  it("maps cooper supplemental to cardio axis", () => {
    assert.equal(detectQuestionFocusAxis("Cooper 測驗怎麼看？", {}), "cardio");
  });
});

describe("detectQuestionFocusSupplemental", () => {
  it("detects arm size supplemental", () => {
    assert.equal(detectQuestionFocusSupplemental("臂圍級距如何解讀？"), "armSize");
  });
});

describe("pruneScoringMethodologyBriefs", () => {
  it("returns all briefs for methodology intent", () => {
    const pruned = pruneScoringMethodologyBriefs(
      ALL_BRIEFS,
      "本 App 力量怎麼計分？",
      "methodology",
      {}
    );
    assert.equal(pruned.length, ALL_BRIEFS.length);
  });

  it("keeps at most two relevant briefs for general status questions", () => {
    const pruned = pruneScoringMethodologyBriefs(
      ALL_BRIEFS,
      "我的 FFMI 分數代表什麼？",
      "general",
      {}
    );
    assert.equal(pruned.length, 1);
    assert.equal(pruned[0].metric, "bodyFat");
  });

  it("includes cardio brief when cooper supplemental is detected", () => {
    const metrics = collectOnDemandMethodologyMetrics("Cooper 12 分鐘怎麼解讀？", {}, "status");
    assert.ok(metrics.includes("cardio"));
    const pruned = pruneScoringMethodologyBriefs(
      ALL_BRIEFS,
      "Cooper 12 分鐘怎麼解讀？",
      "status",
      {}
    );
    assert.ok(pruned.some((b) => b.metric === "cardio"));
    assert.ok(pruned.length <= 2);
  });

  it("falls back to weakestAxis when no focus detected", () => {
    const pruned = pruneScoringMethodologyBriefs(
      ALL_BRIEFS,
      "幫我看看整體狀態",
      "status",
      { weakestAxis: "gripStrength" }
    );
    assert.equal(pruned.length, 1);
    assert.equal(pruned[0].metric, "gripStrength");
  });
});

describe("buildDynoIntelInferenceContext", () => {
  it("overrides intent and prunes briefs on inference path", () => {
    const ctx = buildDynoIntelInferenceContext(
      {
        scoringMethodologyBriefs: ALL_BRIEFS,
        weakestAxis: "strength",
      },
      "握力分數怎麼看？"
    );
    assert.equal(ctx.intent, "general");
    assert.equal(ctx.scoringMethodologyBriefs.length, 1);
    assert.equal(ctx.scoringMethodologyBriefs[0].metric, "gripStrength");
  });
});
