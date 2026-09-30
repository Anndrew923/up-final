import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveDynoDebouncedQuotaAction } from "../dynoIntel/resolveDynoDebouncedQuotaAction.js";

describe("resolveDynoDebouncedQuotaAction", () => {
  it("allows consume when not debounced", () => {
    assert.equal(
      resolveDynoDebouncedQuotaAction({
        debounced: false,
        hasCachedReply: false,
        pendingReservationCount: 1,
      }),
      "allow-consume"
    );
  });

  it("replays cache without a second seat when debounced and warm", () => {
    assert.equal(
      resolveDynoDebouncedQuotaAction({
        debounced: true,
        hasCachedReply: true,
        pendingReservationCount: 1,
      }),
      "replay-cache"
    );
  });

  it("blocks cold-cache re-entry while a reservation is still held", () => {
    assert.equal(
      resolveDynoDebouncedQuotaAction({
        debounced: true,
        hasCachedReply: false,
        pendingReservationCount: 1,
      }),
      "block-in-flight"
    );
  });

  it("allows one retry after the prior attempt released without cache", () => {
    assert.equal(
      resolveDynoDebouncedQuotaAction({
        debounced: true,
        hasCachedReply: false,
        pendingReservationCount: 0,
      }),
      "allow-consume"
    );
  });
});
