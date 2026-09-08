/**
 * Credit-based linear stacking + commission math (unit-tested).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MS_PER_DAY,
  applyPromoGrant,
  applyStoreCleared,
  applyStoreEntitlement,
  remainingPromoCreditMs,
  resolveEffectiveProExpiryMs,
  isPromoExpiryActive,
} from "../shared/proExpiry.js";
import { hasProFromUserDoc } from "../shared/userEntitlement.js";
import { COMMISSION_PLATFORM_CUT } from "../shared/constants.js";

const T0 = Date.parse("2026-06-01T00:00:00.000Z");
const GRANT_60D = 60 * MS_PER_DAY;
const MONTHLY_MS = 30 * MS_PER_DAY;
const ANNUAL_MS = 365 * MS_PER_DAY;

describe("proExpiry legacy dual-read", () => {
  it("falls back to max(store, promo) when credit fields are absent", () => {
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

  it("keeps Pro when RC expired but promo active (legacy docs)", () => {
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

  it("prefers persisted effectiveUntil over max()", () => {
    const stacked = Date.parse("2026-09-01T00:00:00.000Z");
    const ms = resolveEffectiveProExpiryMs({
      proExpiresAt: "2026-07-01T00:00:00.000Z",
      promoExpiresAt: "2026-07-10T00:00:00.000Z",
      effectiveUntilMs: stacked,
    });
    assert.equal(ms, stacked);
  });
});

describe("proExpiry credit stacking", () => {
  it("case 1: pure redeem grants 60 days from now", () => {
    const snap = applyPromoGrant({}, GRANT_60D, T0);
    assert.equal(snap.promoCreditMs, GRANT_60D);
    assert.equal(snap.promoPaused, false);
    assert.equal(snap.effectiveUntilMs, T0 + GRANT_60D);
    assert.equal(snap.proExpiresAt, null);
    assert.equal(resolveEffectiveProExpiryMs(snap, T0), T0 + GRANT_60D);
  });

  it("case 2: day-10 monthly/annual purchase stacks remaining 50d onto store expiry", () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    assert.equal(remainingPromoCreditMs(redeemed, t10), 50 * MS_PER_DAY);

    const monthlyStore = t10 + MONTHLY_MS;
    const monthly = applyStoreEntitlement(redeemed, monthlyStore, t10);
    assert.equal(monthly.promoCreditMs, 50 * MS_PER_DAY);
    assert.equal(monthly.promoPaused, true);
    assert.equal(monthly.effectiveUntilMs, monthlyStore + 50 * MS_PER_DAY);

    const annualStore = t10 + ANNUAL_MS;
    const annual = applyStoreEntitlement(redeemed, annualStore, t10);
    assert.equal(annual.promoCreditMs, 50 * MS_PER_DAY);
    assert.equal(annual.effectiveUntilMs, annualStore + 50 * MS_PER_DAY);
  });

  it("case 3: renewals advance store only and do not re-add credit", () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    const firstStore = t10 + MONTHLY_MS;
    const purchased = applyStoreEntitlement(redeemed, firstStore, t10);
    const frozen = purchased.promoCreditMs;
    assert.equal(frozen, 50 * MS_PER_DAY);

    const t40 = t10 + MONTHLY_MS;
    const renewedStore = t40 + MONTHLY_MS;
    const renewed = applyStoreEntitlement(purchased, renewedStore, t40);
    assert.equal(renewed.promoCreditMs, frozen);
    assert.equal(renewed.effectiveUntilMs, renewedStore + frozen);

    const t70 = t40 + MONTHLY_MS;
    const secondRenewStore = t70 + MONTHLY_MS;
    const again = applyStoreEntitlement(renewed, secondRenewStore, t70);
    assert.equal(again.promoCreditMs, frozen);
    assert.equal(again.effectiveUntilMs, secondRenewStore + frozen);
  });

  it("case 4: after store lapses, remaining credit continues from now", () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    const storeEnd = t10 + MONTHLY_MS;
    const purchased = applyStoreEntitlement(redeemed, storeEnd, t10);

    const lapsed = applyStoreCleared(purchased, storeEnd);
    assert.equal(lapsed.proExpiresAt, null);
    assert.equal(lapsed.promoPaused, false);
    assert.equal(lapsed.promoCreditMs, 50 * MS_PER_DAY);
    assert.equal(lapsed.effectiveUntilMs, storeEnd + 50 * MS_PER_DAY);

    const t10AfterLapse = storeEnd + 10 * MS_PER_DAY;
    assert.equal(remainingPromoCreditMs(lapsed, t10AfterLapse), 40 * MS_PER_DAY);
    assert.equal(
      resolveEffectiveProExpiryMs(lapsed, t10AfterLapse),
      storeEnd + 50 * MS_PER_DAY
    );
  });

  it("mid-window cancel unpauses frozen credit from now without re-adding store days", () => {
    const redeemed = applyPromoGrant({}, GRANT_60D, T0);
    const t10 = T0 + 10 * MS_PER_DAY;
    const storeEnd = t10 + MONTHLY_MS;
    const purchased = applyStoreEntitlement(redeemed, storeEnd, t10);
    const t20 = T0 + 20 * MS_PER_DAY;
    const cancelled = applyStoreCleared(purchased, t20);
    assert.equal(cancelled.promoCreditMs, 50 * MS_PER_DAY);
    assert.equal(cancelled.effectiveUntilMs, t20 + 50 * MS_PER_DAY);
    assert.equal(cancelled.proExpiresAt, null);
  });

  it("redeem while subscribed adds 60d onto max(now, store) + existing credit", () => {
    const storeEnd = T0 + MONTHLY_MS;
    const subscribed = applyStoreEntitlement({}, storeEnd, T0);
    const granted = applyPromoGrant(subscribed, GRANT_60D, T0);
    assert.equal(granted.promoCreditMs, GRANT_60D);
    assert.equal(granted.promoPaused, true);
    assert.equal(granted.effectiveUntilMs, storeEnd + GRANT_60D);
  });
});

describe("commission formula", () => {
  it("applies 15% platform cut then 50% coach share", () => {
    const price = 14.99;
    const coach = Math.round(price * (1 - COMMISSION_PLATFORM_CUT) * 0.5 * 100) / 100;
    assert.equal(coach, 6.37);
  });
});
