import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isDevProSyncAllowed } from "../subscription/verifyRevenueCat.js";

describe("pro entitlement sync guards", () => {
  it("allows dev simulation only in emulator", () => {
    const prev = process.env.FUNCTIONS_EMULATOR;
    process.env.FUNCTIONS_EMULATOR = "true";
    assert.equal(isDevProSyncAllowed(), true);
    delete process.env.FUNCTIONS_EMULATOR;
    assert.equal(isDevProSyncAllowed(), false);
    if (prev) process.env.FUNCTIONS_EMULATOR = prev;
  });
});
