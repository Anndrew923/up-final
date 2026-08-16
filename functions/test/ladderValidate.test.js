import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getShardScoreMax, validateScore } from "../ladder/validate.js";
import {
  erasureLeaderboardShardIds,
  KNOWN_LEADERBOARD_SHARD_IDS,
} from "../shared/constants.js";

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

  it("rejects delisted login-days shard", () => {
    assert.equal(validateScore("totalLoginDays", 10_000), false);
  });

  it("rejects unknown shards and invalid numbers", () => {
    assert.equal(validateScore("unknown", 1), false);
    assert.equal(validateScore("armSize", Number.POSITIVE_INFINITY), false);
    assert.equal(validateScore("armSize", -1), false);
  });
});

describe("erasure shard union", () => {
  it("sweeps delisted login days without re-allowing live writes", () => {
    const ids = erasureLeaderboardShardIds();
    assert.equal(ids.includes("totalLoginDays"), true);
    assert.equal(ids.includes("ladderScore"), true);
    assert.equal(KNOWN_LEADERBOARD_SHARD_IDS.has("totalLoginDays"), false);
  });
});
