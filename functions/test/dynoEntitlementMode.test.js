import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertDynoIntelModeAllowed,
  assertDynoIntelTrialCoreOwned,
} from "../shared/dynoEntitlement.js";

function expectCode(fn, code) {
  try {
    fn();
    assert.fail(`expected ${code}`);
  } catch (err) {
    assert.equal(err.code, code);
  }
}

describe("dynoIntel mode gates", () => {
  it("allows single-axis and cross-axis for non-Pro", () => {
    assert.doesNotThrow(() => assertDynoIntelModeAllowed("single-axis", false));
    assert.doesNotThrow(() => assertDynoIntelModeAllowed("cross-axis", false));
  });

  it("requires Pro for weight-simulation", () => {
    expectCode(() => assertDynoIntelModeAllowed("weight-simulation", false), "pro-required");
    assert.doesNotThrow(() => assertDynoIntelModeAllowed("weight-simulation", true));
  });

  it("requires Core for single-axis and cross-axis when not Pro", () => {
    expectCode(
      () => assertDynoIntelTrialCoreOwned("single-axis", false, false),
      "core-required",
    );
    expectCode(
      () => assertDynoIntelTrialCoreOwned("cross-axis", false, false),
      "core-required",
    );
    assert.doesNotThrow(() => assertDynoIntelTrialCoreOwned("cross-axis", false, true));
    assert.doesNotThrow(() => assertDynoIntelTrialCoreOwned("single-axis", false, true));
  });

  it("skips Core check for Pro and defers weight-sim Core to mode gate", () => {
    assert.doesNotThrow(() => assertDynoIntelTrialCoreOwned("cross-axis", true, false));
    assert.doesNotThrow(() => assertDynoIntelTrialCoreOwned("weight-simulation", false, false));
  });
});
