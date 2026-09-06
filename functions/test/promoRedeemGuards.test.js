import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  consumePromoRedeemAttempt,
  isPromoRedemptionCapacityExhausted,
  normalizePromoRedeemRateDoc,
  resolveMaxRedemptions,
  resolveRedeemedCount,
} from "../subscription/promoRedeemGuards.js";
import { PROMO_REDEEM_MAX_ATTEMPTS_PER_HOUR } from "../shared/constants.js";

describe("promoRedeemGuards — rate limit", () => {
  it("resets stale hourly window", () => {
    const nowMs = Date.parse("2026-09-06T12:00:00.000Z");
    const stale = {
      windowStartMs: Date.parse("2026-09-06T10:00:00.000Z"),
      count: 9,
    };
    const bucket = normalizePromoRedeemRateDoc(stale, nowMs);
    assert.equal(bucket.count, 0);
    assert.equal(bucket.windowStartMs, nowMs);
  });

  it("allows attempts up to hourly cap then blocks", () => {
    const nowMs = Date.parse("2026-09-06T12:00:00.000Z");
    let doc = null;
    for (let i = 0; i < PROMO_REDEEM_MAX_ATTEMPTS_PER_HOUR; i++) {
      const result = consumePromoRedeemAttempt(doc, nowMs);
      assert.equal(result.allowed, true, `expected allowed at attempt ${i + 1}`);
      doc = result.next;
    }
    const blocked = consumePromoRedeemAttempt(doc, nowMs);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, "promo-redeem-rate-limited");
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.next.count, PROMO_REDEEM_MAX_ATTEMPTS_PER_HOUR);
  });

  it("failed guesses burn the same quota as successes", () => {
    const nowMs = Date.now();
    const first = consumePromoRedeemAttempt(null, nowMs);
    assert.equal(first.next.count, 1);
    const second = consumePromoRedeemAttempt(first.next, nowMs);
    assert.equal(second.next.count, 2);
  });
});

describe("promoRedeemGuards — maxRedemptions", () => {
  it("treats missing max as uncapped", () => {
    assert.equal(resolveMaxRedemptions({ redeemedCount: 999 }), null);
    assert.equal(isPromoRedemptionCapacityExhausted({ redeemedCount: 999 }), false);
  });

  it("exhausts when redeemedCount >= maxRedemptions", () => {
    const promo = { maxRedemptions: 100, redeemedCount: 100 };
    assert.equal(resolveRedeemedCount(promo), 100);
    assert.equal(isPromoRedemptionCapacityExhausted(promo), true);
  });

  it("allows when under capacity (atomic increment race window)", () => {
    const promo = { maxRedemptions: 100, redeemedCount: 99 };
    assert.equal(isPromoRedemptionCapacityExhausted(promo), false);
  });

  it("accepts snake_case aliases", () => {
    assert.equal(
      isPromoRedemptionCapacityExhausted({
        max_redemptions: 10,
        redeemed_count: 10,
      }),
      true
    );
  });
});
