import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolveDynoIntelEntitlement } from "../shared/dynoEntitlement.js";

describe("dynoIntel entitlement bypass", () => {
  const originalDevBypass = process.env.DYNO_INTEL_DEV_BYPASS;
  const originalBetaFree = process.env.DYNO_INTEL_BETA_FREE;

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
  });

  it("returns pro+core when DYNO_INTEL_DEV_BYPASS is true", async () => {
    process.env.DYNO_INTEL_DEV_BYPASS = "true";
    delete process.env.DYNO_INTEL_BETA_FREE;
    const ent = await resolveDynoIntelEntitlement("uid-dev", null);
    assert.deepEqual(ent, { isPro: true, hasCore: true });
  });

  it("returns pro+core when DYNO_INTEL_BETA_FREE is true", async () => {
    delete process.env.DYNO_INTEL_DEV_BYPASS;
    process.env.DYNO_INTEL_BETA_FREE = "true";
    const ent = await resolveDynoIntelEntitlement("uid-beta", null);
    assert.deepEqual(ent, { isPro: true, hasCore: true });
  });
});
