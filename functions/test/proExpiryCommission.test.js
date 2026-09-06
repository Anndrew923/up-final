/**
 * Pure helpers for dual-track Pro expiry + commission math (unit-tested).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveEffectiveProExpiryMs,
  isPromoExpiryActive,
} from "../shared/proExpiry.js";
import { hasProFromUserDoc } from "../shared/userEntitlement.js";
import { COMMISSION_PLATFORM_CUT } from "../shared/constants.js";

describe("proExpiry dual-track", () => {
  it("takes max of rc and promo", () => {
    const ms = resolveEffectiveProExpiryMs({
      proExpiresAt: "2026-06-01T00:00:00.000Z",
      promoExpiresAt: "2026-07-01T00:00:00.000Z",
    });
    assert.equal(ms, Date.parse("2026-07-01T00:00:00.000Z"));
  });

  it("falls back to *Ms fields when ISO missing", () => {
    const ms = resolveEffectiveProExpiryMs({
      proExpiresAtMs: Date.parse("2026-06-01T00:00:00.000Z"),
      promoExpiresAtMs: Date.parse("2026-08-01T00:00:00.000Z"),
    });
    assert.equal(ms, Date.parse("2026-08-01T00:00:00.000Z"));
  });

  it("keeps Pro when RC expired but promo active", () => {
    const now = new Date("2026-06-12T10:00:00.000Z");
    assert.equal(
      hasProFromUserDoc(
        {
          purchaseStatus: "owned",
          subscriptionStatus: "pro",
          proExpiresAt: "2026-06-01T00:00:00.000Z",
          promoExpiresAt: "2026-07-01T00:00:00.000Z",
        },
        now
      ),
      true
    );
  });

  it("detects active promo window", () => {
    const now = new Date("2026-06-12T10:00:00.000Z");
    assert.equal(
      isPromoExpiryActive({ promoExpiresAt: "2026-06-12T12:00:00.000Z" }, now),
      true
    );
    assert.equal(
      isPromoExpiryActive({ promoExpiresAt: "2026-06-12T09:00:00.000Z" }, now),
      false
    );
  });
});

describe("commission formula", () => {
  it("applies 15% platform cut then 50% coach share", () => {
    const price = 14.99;
    const coach = Math.round(price * (1 - COMMISSION_PLATFORM_CUT) * 0.5 * 100) / 100;
    assert.equal(coach, 6.37);
  });
});
