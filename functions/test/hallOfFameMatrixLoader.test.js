/**
 * Unit tests for Firestore-first hall-of-fame matrix loader (no live network).
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  buildHallOfFameIndex,
  getHallOfFameMatrix,
  getHallOfFameMatrixSource,
  getHallOfFameMaxDisplayNames,
  isValidHallOfFameMatrix,
  resetHallOfFameMatrixToFallback,
  invalidateHallOfFameMatrixCache,
  HALL_OF_FAME_MATRIX_TTL_MS,
} from "../dynoIntel/hallOfFameMatrixLoader.js";
import fallback from "../dynoIntel/data/hallOfFameMatrix.v1.json" with { type: "json" };

describe("hallOfFameMatrixLoader", () => {
  beforeEach(() => {
    resetHallOfFameMatrixToFallback();
  });

  it("validates sparse matrix schema", () => {
    assert.equal(isValidHallOfFameMatrix(fallback), true);
    assert.equal(isValidHallOfFameMatrix(null), false);
    assert.equal(isValidHallOfFameMatrix({ entries: [] }), false);
    assert.equal(
      isValidHallOfFameMatrix({
        entries: [{ decadeKey: "80", axisId: "strength", anchors: [] }],
      }),
      true
    );
  });

  it("starts on bundled fallback with expected cell count", () => {
    assert.equal(getHallOfFameMatrixSource(), "fallback");
    assert.equal(getHallOfFameMatrix().entries.length, fallback.entries.length);
    assert.equal(getHallOfFameMaxDisplayNames(), 3);
    assert.ok(HALL_OF_FAME_MATRIX_TTL_MS >= 5 * 60 * 1000);
    assert.ok(HALL_OF_FAME_MATRIX_TTL_MS <= 15 * 60 * 1000);
  });

  it("buildHallOfFameIndex keys decade:axis cells", () => {
    const index = buildHallOfFameIndex(fallback);
    assert.ok(index.has("150:strength"));
    assert.ok(Array.isArray(index.get("150:strength")));
  });

  it("invalidate forces TTL miss without clearing fallback snapshot", () => {
    invalidateHallOfFameMatrixCache();
    assert.equal(getHallOfFameMatrix().entries.length, fallback.entries.length);
  });
});
