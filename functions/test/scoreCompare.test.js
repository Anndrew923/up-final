import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoresEqualForLadderWrite } from "../ladder/scoreCompare.js";

describe("scoresEqualForLadderWrite", () => {
  it("matches at 2dp", () => {
    assert.equal(scoresEqualForLadderWrite(98.364, 98.36), true);
  });

  it("rejects meaningful deltas", () => {
    assert.equal(scoresEqualForLadderWrite(100, 99.99), false);
  });
});
