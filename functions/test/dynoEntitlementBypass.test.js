import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  isDynoIntelEntitlementBypassActive,
  resolveDynoIntelEntitlement,
} from "../shared/dynoEntitlement.js";

describe("dynoIntel entitlement bypass", () => {
  const originalDevBypass = process.env.DYNO_INTEL_DEV_BYPASS;
  const originalBetaFree = process.env.DYNO_INTEL_BETA_FREE;
  const originalEmulator = process.env.FUNCTIONS_EMULATOR;

  afterEach(() => {
    if (originalDevBypass === undefined) {
      delete process.env.DYNO_INTEL_DEV_BYPASS;
    } else {
      process.env.DYNO_INTEL_DEV_BYPASS = originalDevBypass;
    }
    if (originalBetaFree === undefined) {
      delete process.env.DYNO_INTEL_BETA_FREE;
    } else {
      process.env.DYNO_INTEL_BETA_FREE = originalBetaFree;
    }
    if (originalEmulator === undefined) {
      delete process.env.FUNCTIONS_EMULATOR;
    } else {
      process.env.FUNCTIONS_EMULATOR = originalEmulator;
    }
  });

  it("unlocks modes without granting paid quota for dev bypass", async () => {
    process.env.DYNO_INTEL_DEV_BYPASS = "true";
    process.env.FUNCTIONS_EMULATOR = "true";
    delete process.env.DYNO_INTEL_BETA_FREE;
    const ent = await resolveDynoIntelEntitlement("uid-dev");
    assert.deepEqual(ent, { isPro: true, hasCore: true, hasProQuota: false });
  });

  it("rejects dev bypass outside the emulator", () => {
    process.env.DYNO_INTEL_DEV_BYPASS = "true";
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.DYNO_INTEL_BETA_FREE;
    assert.equal(isDynoIntelEntitlementBypassActive(), false);
  });

  it("unlocks modes without granting paid quota for beta bypass", async () => {
    delete process.env.DYNO_INTEL_DEV_BYPASS;
    process.env.DYNO_INTEL_BETA_FREE = "true";
    const ent = await resolveDynoIntelEntitlement("uid-beta");
    assert.deepEqual(ent, { isPro: true, hasCore: true, hasProQuota: false });
  });
});
