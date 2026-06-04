import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEmptySummary, shouldSyncBatchPreview } from "../ladder/syncBatch.js";

describe("shouldSyncBatchPreview", () => {
  const mergedScores = {
    strength: 80,
    explosivePower: 80,
    cardio: 80,
    muscleMass: 80,
    bodyFat: 80,
    gripStrength: 80,
  };

  it("syncs preview when scores unchanged and no avatar (no HTTPS gate)", () => {
    const tally = createEmptySummary();
    tally.attempted = 3;
    tally.unchanged = 3;
    assert.equal(
      shouldSyncBatchPreview({ mergedScores }, tally),
      true
    );
  });

  it("syncs preview when shards updated without avatar", () => {
    const tally = createEmptySummary();
    tally.attempted = 2;
    tally.updated = 2;
    assert.equal(
      shouldSyncBatchPreview({ mergedScores }, tally),
      true
    );
  });

  it("does not sync when preview mergedScores missing", () => {
    const tally = createEmptySummary();
    tally.attempted = 1;
    tally.updated = 1;
    assert.equal(shouldSyncBatchPreview(null, tally), false);
    assert.equal(shouldSyncBatchPreview({}, tally), false);
  });

  it("does not sync when batch attempted zero shards", () => {
    const tally = createEmptySummary();
    assert.equal(
      shouldSyncBatchPreview({ mergedScores }, tally),
      false
    );
  });

  it("does not sync when all shards failed with no successful outcome", () => {
    const tally = createEmptySummary();
    tally.attempted = 2;
    tally.rateLimited = 2;
    tally.errors = 2;
    assert.equal(
      shouldSyncBatchPreview({ mergedScores }, tally),
      false
    );
  });

  it("syncs when only avatar patched on extra shards", () => {
    const tally = createEmptySummary();
    tally.attempted = 1;
    tally.unchanged = 1;
    tally.avatarPatched = 1;
    assert.equal(
      shouldSyncBatchPreview({ mergedScores }, tally),
      true
    );
  });
});
