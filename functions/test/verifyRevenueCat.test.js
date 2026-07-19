import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyRevenueCatProEntitlement } from "../subscription/verifyRevenueCat.js";

const originalFetch = globalThis.fetch;
const originalSecret = process.env.REVENUECAT_SECRET_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalSecret === undefined) {
    delete process.env.REVENUECAT_SECRET_API_KEY;
  } else {
    process.env.REVENUECAT_SECRET_API_KEY = originalSecret;
  }
});

function mockResponse(status, body = {}) {
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("verifyRevenueCatProEntitlement", () => {
  it("does not convert provider outages into inactive entitlement", async () => {
    process.env.REVENUECAT_SECRET_API_KEY = "test-secret";
    mockResponse(503);
    await assert.rejects(() => verifyRevenueCatProEntitlement("uid"), /revenuecat-http-503/);
  });

  it("uses grace expiry as the authoritative access deadline", async () => {
    process.env.REVENUECAT_SECRET_API_KEY = "test-secret";
    mockResponse(200, {
      subscriber: {
        entitlements: {
          pro: {
            product_identifier: "pro_monthly",
            expires_date: "2020-01-01T00:00:00.000Z",
            grace_period_expires_date: "2099-01-01T00:00:00.000Z",
          },
        },
      },
    });

    const result = await verifyRevenueCatProEntitlement("uid");
    assert.equal(result.active, true);
    assert.equal(result.subscriptionStatus, "grace");
    assert.equal(result.expiresDate, "2099-01-01T00:00:00.000Z");
  });

  it("fails closed for a monthly entitlement without an expiry", async () => {
    process.env.REVENUECAT_SECRET_API_KEY = "test-secret";
    mockResponse(200, {
      subscriber: {
        entitlements: {
          pro: {
            product_identifier: "pro_monthly",
            expires_date: null,
          },
        },
      },
    });

    const result = await verifyRevenueCatProEntitlement("uid");
    assert.equal(result.active, false);
    assert.equal(result.subscriptionStatus, "free");
    assert.equal(result.expiresDate, null);
  });
});
