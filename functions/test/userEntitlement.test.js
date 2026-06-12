import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hasCoreFromUserDoc, hasProFromUserDoc } from "../shared/userEntitlement.js";

describe("userEntitlement", () => {
  it("requires owned core before pro", () => {
    assert.equal(hasCoreFromUserDoc({ purchaseStatus: "owned" }), true);
    assert.equal(hasCoreFromUserDoc({ purchase_status: "owned" }), true);
    assert.equal(hasCoreFromUserDoc({ purchaseStatus: "none" }), false);
  });

  it("mirrors client pro grace rules", () => {
    const now = new Date("2026-06-12T10:00:00.000Z");
    assert.equal(
      hasProFromUserDoc(
        {
          purchaseStatus: "owned",
          subscriptionStatus: "grace",
          proExpiresAt: "2026-06-12T12:00:00.000Z",
        },
        now
      ),
      true
    );
    assert.equal(
      hasProFromUserDoc(
        {
          purchaseStatus: "owned",
          subscriptionStatus: "free",
        },
        now
      ),
      false
    );
  });
});
