import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertRecentAuthentication } from "../account/deleteAccountCallable.js";

describe("deleteAccount recent-auth guard", () => {
  it("accepts a token reauthenticated within ten minutes", () => {
    assert.doesNotThrow(() =>
      assertRecentAuthentication({ auth: { token: { auth_time: 10_000 } } }, 10_599)
    );
  });

  it("rejects stale or missing auth_time", () => {
    assert.throws(
      () => assertRecentAuthentication({ auth: { token: { auth_time: 10_000 } } }, 10_601),
      (error) => error?.code === "failed-precondition"
    );
    assert.throws(
      () => assertRecentAuthentication({ auth: { token: {} } }, 10_000),
      (error) => error?.code === "failed-precondition"
    );
  });
});
