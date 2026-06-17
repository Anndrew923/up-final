import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveHumanScaleDecadeKey, resolveScoreBandId } from "../dynoIntel/scoreBandResolver.js";

describe("resolveHumanScaleDecadeKey v3.3.2", () => {
  it("maps BASE to decade key 0", () => {
    assert.equal(resolveHumanScaleDecadeKey("BASE"), "0");
  });

  it("maps LEGEND and PANTHEON to 150", () => {
    assert.equal(resolveHumanScaleDecadeKey("LEGEND"), "150");
    assert.equal(resolveHumanScaleDecadeKey("PANTHEON"), "150");
  });

  it("maps grip 150+ tiers to 150", () => {
    assert.equal(resolveHumanScaleDecadeKey("TIER_150"), "150");
    assert.equal(resolveHumanScaleDecadeKey("TIER_160"), "150");
    assert.equal(resolveHumanScaleDecadeKey("TIER_170"), "150");
  });

  it("maps decade tiers from score bands", () => {
    assert.equal(resolveHumanScaleDecadeKey(resolveScoreBandId("strength", 87.9)), "80");
    assert.equal(resolveHumanScaleDecadeKey(resolveScoreBandId("muscleMass", 91.6)), "90");
    assert.equal(resolveHumanScaleDecadeKey(resolveScoreBandId("muscleMass", 124.4)), "120");
  });
});
