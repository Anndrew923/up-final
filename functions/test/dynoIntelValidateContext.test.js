import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateDynoIntelContext } from "../dynoIntel/validateContext.js";

const baseContext = {
  schemaVersion: 1,
  mode: "single-axis",
  axes: [],
  momentum: { hasHistory: false, deltas: [], overallDelta: null },
};

describe("validateDynoIntelContext", () => {
  it("accepts a minimal valid context", () => {
    assert.equal(validateDynoIntelContext(baseContext), true);
  });

  it("rejects unsupported schema version", () => {
    assert.throws(
      () => validateDynoIntelContext({ ...baseContext, schemaVersion: 2 }),
      /unsupported-schema/
    );
  });

  it("rejects invalid mode", () => {
    assert.throws(
      () => validateDynoIntelContext({ ...baseContext, mode: "free-chat" }),
      /invalid-mode/
    );
  });

  it("rejects forbidden PII keys", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          profile: { displayName: "Boss", ageBucket: "18-30" },
        }),
      /forbidden-pii:displayName/
    );
  });

  it("requires weightSimulation block for weight-simulation mode", () => {
    assert.throws(
      () =>
        validateDynoIntelContext({
          ...baseContext,
          mode: "weight-simulation",
        }),
      /weight-simulation-context-missing/
    );
  });

  it("accepts weight-simulation when simulation payload is enabled", () => {
    assert.equal(
      validateDynoIntelContext({
        ...baseContext,
        mode: "weight-simulation",
        weightSimulation: { enabled: true, targetWeightKg: 72, strengthScoreAtTarget: 80 },
      }),
      true
    );
  });
});
