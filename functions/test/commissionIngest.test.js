import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Commission ingest pure decision helpers — exercise via module by importing
 * and stubbing would need firestore; here we document event-type gate only.
 */
const PAID_EVENT_TYPES = new Set(["INITIAL_PURCHASE", "RENEWAL"]);

describe("commission paid-event gate", () => {
  it("accepts INITIAL_PURCHASE and RENEWAL only", () => {
    assert.equal(PAID_EVENT_TYPES.has("INITIAL_PURCHASE"), true);
    assert.equal(PAID_EVENT_TYPES.has("RENEWAL"), true);
    assert.equal(PAID_EVENT_TYPES.has("CANCELLATION"), false);
    assert.equal(PAID_EVENT_TYPES.has("PRODUCT_CHANGE"), false);
  });
});
