import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isRevenueCatWebhookAuthorized } from "../subscription/revenueCatWebhook.js";

describe("RevenueCat webhook authorization", () => {
  it("accepts only the exact configured authorization value", () => {
    assert.equal(
      isRevenueCatWebhookAuthorized("Bearer shared-secret", "Bearer shared-secret"),
      true
    );
    assert.equal(isRevenueCatWebhookAuthorized("Bearer wrong", "Bearer shared-secret"), false);
    assert.equal(isRevenueCatWebhookAuthorized("", "Bearer shared-secret"), false);
    assert.equal(isRevenueCatWebhookAuthorized("Bearer shared-secret", ""), false);
  });
});
