import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkDynoIntelDailyLimit,
  finalizeDynoIntelUsage,
  releasePendingDynoIntelUsage,
  reserveDynoIntelUsage,
} from "../dynoIntel/rateLimits.js";
import { DYNO_INTEL_PRO_PER_DAY, DYNO_INTEL_TRIAL_PER_DAY } from "../shared/constants.js";

describe("dynoIntel rateLimits", () => {
  const now = new Date("2026-06-12T10:00:00.000Z");

  it("allows trial users up to daily cap", () => {
    const bucket = { dayKey: "2026-06-12", countToday: 0, limit: DYNO_INTEL_TRIAL_PER_DAY };
    const check = checkDynoIntelDailyLimit(bucket, false, now);
    assert.equal(check.allowed, true);
    assert.equal(check.limit, DYNO_INTEL_TRIAL_PER_DAY);
    assert.equal(check.quotaTier, "trial");
    assert.equal(check.resetAt, "2026-06-12T16:00:00.000Z");
  });

  it("blocks when trial daily cap reached", () => {
    const bucket = {
      dayKey: "2026-06-12",
      countToday: DYNO_INTEL_TRIAL_PER_DAY,
      limit: DYNO_INTEL_TRIAL_PER_DAY,
    };
    const check = checkDynoIntelDailyLimit(bucket, false, now);
    assert.equal(check.allowed, false);
    assert.equal(check.remaining, 0);
  });

  it("uses pro daily cap for subscribers", () => {
    const bucket = { dayKey: "2026-06-12", countToday: 0, limit: DYNO_INTEL_PRO_PER_DAY };
    const check = checkDynoIntelDailyLimit(bucket, true, now);
    assert.equal(check.limit, DYNO_INTEL_PRO_PER_DAY);
    assert.equal(check.quotaTier, "pro");
  });

  it("uses the Asia/Taipei calendar across the UTC date boundary", () => {
    const beforeTaipeiMidnight = new Date("2026-06-12T15:59:59.000Z");
    const afterTaipeiMidnight = new Date("2026-06-12T16:00:00.000Z");
    const stale = { dayKey: "2026-06-12", countToday: 2, limit: DYNO_INTEL_TRIAL_PER_DAY };

    assert.equal(checkDynoIntelDailyLimit(stale, false, beforeTaipeiMidnight).allowed, false);
    const reset = checkDynoIntelDailyLimit(stale, false, afterTaipeiMidnight);
    assert.equal(reset.allowed, true);
    assert.equal(reset.remaining, DYNO_INTEL_TRIAL_PER_DAY);
    assert.equal(reset.resetAt, "2026-06-13T16:00:00.000Z");
  });

  it("reserves without charging and commits only after success", () => {
    const bucket = {
      dayKey: "2026-06-12",
      countToday: 0,
      limit: DYNO_INTEL_TRIAL_PER_DAY,
    };
    const reserved = reserveDynoIntelUsage(bucket, false, "request_1", now);
    assert.equal(reserved.allowed, true);
    assert.equal(reserved.bucket.countToday, 0);
    assert.equal(reserved.remaining, 1);

    const duplicate = reserveDynoIntelUsage(reserved.bucket, false, "request_1", now);
    assert.equal(duplicate.allowed, false);
    assert.equal(duplicate.reason, "in-progress");

    const committed = finalizeDynoIntelUsage(reserved.bucket, false, "request_1", now);
    assert.equal(committed.countToday, 1);
    assert.equal(committed.remaining, 1);
    assert.deepEqual(committed.pendingReservations, {});
  });

  it("reclaims crashed reservations after their lease expires", () => {
    const bucket = {
      dayKey: "2026-06-12",
      countToday: 1,
      limit: DYNO_INTEL_TRIAL_PER_DAY,
    };
    const reserved = reserveDynoIntelUsage(bucket, false, "request_1", now, 1000);
    assert.equal(reserved.remaining, 0);

    const afterLease = new Date(now.getTime() + 1001);
    const check = checkDynoIntelDailyLimit(reserved.bucket, false, afterLease);
    assert.equal(check.allowed, true);
    assert.equal(check.remaining, 1);
  });

  it("removes a failed pending reservation without decrementing completed usage", () => {
    const reserved = reserveDynoIntelUsage(
      {
        dayKey: "2026-06-12",
        countToday: 1,
        limit: DYNO_INTEL_TRIAL_PER_DAY,
      },
      false,
      "request_1",
      now
    );
    const released = releasePendingDynoIntelUsage(reserved.bucket, false, "request_1", now);
    assert.equal(released.countToday, 1);
    assert.deepEqual(released.pendingReservations, {});
  });
});
