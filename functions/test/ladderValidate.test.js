import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getShardScoreMax, validateScore } from "../ladder/validate.js";

describe("ladder score server bounds", () => {
  it("caps normalized shards at the six-axis ceiling", () => {
    assert.equal(getShardScoreMax("ladderScore"), 200);
    assert.equal(validateScore("ladderScore", 200), true);
    assert.equal(validateScore("ladderScore", 200.01), false);
  });

  it("allows raw SBD totals only inside the physical abuse bound", () => {
    assert.equal(validateScore("strength", 2_000), true);
    assert.equal(validateScore("strength", 2_000.01), false);
  });

  it("requires login days to be a bounded integer", () => {
    assert.equal(validateScore("totalLoginDays", 10_000), true);
    assert.equal(validateScore("totalLoginDays", 10.5), false);
    assert.equal(validateScore("totalLoginDays", 36_501), false);
  });

  it("rejects unknown shards and invalid numbers", () => {
    assert.equal(validateScore("unknown", 1), false);
    assert.equal(validateScore("armSize", Number.POSITIVE_INFINITY), false);
    assert.equal(validateScore("armSize", -1), false);
  });
});
