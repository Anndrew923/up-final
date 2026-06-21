import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveHumanScaleDecadeKey,
  resolveScoreBandId,
  resolveSoulGenderTrack,
  resolveSoulMatrixFieldKey,
  resolveSoulStream,
  SOUL_STREAM_NEURO,
  SOUL_STREAM_VOLUME,
} from "../dynoIntel/scoreBandResolver.js";

describe("resolveSoulStream v3.5.1", () => {
  it("routes strength, explosivePower, gripStrength to neuro stream", () => {
    assert.equal(resolveSoulStream("strength"), SOUL_STREAM_NEURO);
    assert.equal(resolveSoulStream("explosivePower"), SOUL_STREAM_NEURO);
    assert.equal(resolveSoulStream("gripStrength"), SOUL_STREAM_NEURO);
  });

  it("routes volume axes including supplemental and overall to volume stream", () => {
    assert.equal(resolveSoulStream("muscleMass"), SOUL_STREAM_VOLUME);
    assert.equal(resolveSoulStream("bodyFat"), SOUL_STREAM_VOLUME);
    assert.equal(resolveSoulStream("armSize"), SOUL_STREAM_VOLUME);
    assert.equal(resolveSoulStream("cardio"), SOUL_STREAM_VOLUME);
    assert.equal(resolveSoulStream("cooper"), SOUL_STREAM_VOLUME);
    assert.equal(resolveSoulStream("5km"), SOUL_STREAM_VOLUME);
    assert.equal(resolveSoulStream("overall"), SOUL_STREAM_VOLUME);
  });
});

describe("resolveSoulGenderTrack v3.5.1", () => {
  it("defaults to male when profile or gender is missing", () => {
    assert.equal(resolveSoulGenderTrack(null), "male");
    assert.equal(resolveSoulGenderTrack(undefined), "male");
    assert.equal(resolveSoulGenderTrack({}), "male");
    assert.equal(resolveSoulGenderTrack({ gender: null }), "male");
  });

  it("routes female profile to female track", () => {
    assert.equal(resolveSoulGenderTrack({ gender: "female" }), "female");
  });
});

describe("resolveSoulMatrixFieldKey v3.5.1", () => {
  it("builds four-track matrix keys", () => {
    assert.equal(resolveSoulMatrixFieldKey(SOUL_STREAM_NEURO, "male"), "neuro_male");
    assert.equal(resolveSoulMatrixFieldKey(SOUL_STREAM_NEURO, "female"), "neuro_female");
    assert.equal(resolveSoulMatrixFieldKey(SOUL_STREAM_VOLUME, "male"), "volume_male");
    assert.equal(resolveSoulMatrixFieldKey(SOUL_STREAM_VOLUME, "female"), "volume_female");
  });
});

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
