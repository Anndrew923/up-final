import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildFullRadarScoresMap } from "../ladder/preview.js";

describe("buildFullRadarScoresMap", () => {
  it("clamps axes to SCORE_AXIS_MAX (200), not legacy 100", () => {
    const map = buildFullRadarScoresMap({
      strength: 50,
      cardio: 0,
      explosivePower: 12,
      muscleMass: 80,
      bodyFat: 150,
      gripStrength: 205,
    });
    assert.equal(map.bodyFat, 150);
    assert.equal(map.gripStrength, 200);
    assert.equal(map.cardio, 0);
  });
});
