import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkDynoIntelDailyLimit,
  recordDynoIntelUsage,
} from "../dynoIntel/rateLimits.js";
import { DYNO_INTEL_PRO_PER_DAY, DYNO_INTEL_TRIAL_PER_DAY } from "../shared/constants.js";

describe("dynoIntel rateLimits", () => {
  const now = new Date("2026-06-12T10:00:00.000Z");

  it("allows trial users up to daily cap", () => {
    const bucket = { dayKey: "2026-06-12", countToday: 0, limit: DYNO_INTEL_TRIAL_PER_DAY };
    const check = checkDynoIntelDailyLimit(bucket, false, now);
    assert.equal(check.allowed, true);
    assert.equal(check.limit, DYNO_INTEL_TRIAL_PER_DAY);
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
  });

  it("increments usage count", () => {
    const next = recordDynoIntelUsage(
      { dayKey: "2026-06-12", countToday: 1, limit: DYNO_INTEL_TRIAL_PER_DAY },
      false,
      now
    );
    assert.equal(next.countToday, 2);
    assert.equal(next.remaining, 0);
  });
});
