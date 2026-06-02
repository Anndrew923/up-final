import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSixAxisOverallFromMerged,
  coupleBatchTargetsWithOverall,
} from "../ladder/overallScore.js";

describe("calculateSixAxisOverallFromMerged", () => {
  it("averages six clamped axes at 2dp", () => {
    const avg = calculateSixAxisOverallFromMerged({
      strength: 87.85,
      explosivePower: 100,
      cardio: 82,
      muscleMass: 91.62,
      bodyFat: 100,
      gripStrength: 98.4,
    });
    assert.equal(avg, 93.31);
  });
});

describe("coupleBatchTargetsWithOverall", () => {
  it("appends ladderScore when preview merged scores are present", () => {
    const out = coupleBatchTargetsWithOverall(
      [{ metric: "bodyFat_ffmi", score: 100 }],
      { bodyFat: 100, strength: 80, explosivePower: 80, cardio: 80, muscleMass: 80, gripStrength: 80 }
    );
    const byMetric = Object.fromEntries(out.map((t) => [t.metric, t.score]));
    assert.equal(byMetric.bodyFat_ffmi, 100);
    assert.ok(byMetric.ladderScore > 0);
  });
});
