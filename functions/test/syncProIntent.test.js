import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeSyncProIntent,
  shouldClearProWhenRevenueCatInactive,
} from "../subscription/syncProIntent.js";

describe("syncProSubscription intent gates", () => {
  it("defaults unknown intent to reconcile (safe revoke path)", () => {
    assert.equal(normalizeSyncProIntent(undefined), "reconcile");
    assert.equal(normalizeSyncProIntent("bogus"), "reconcile");
    assert.equal(normalizeSyncProIntent("activate"), "activate");
  });

  it("never clears Pro on activate soft-miss (purchase lag)", () => {
    assert.equal(shouldClearProWhenRevenueCatInactive("activate"), false);
  });

  it("clears Pro on reconcile when RC reports inactive", () => {
    assert.equal(shouldClearProWhenRevenueCatInactive("reconcile"), true);
  });
});
