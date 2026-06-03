import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkFullSyncRateLimit,
  checkReporterReportsRollingCap,
  checkShardRateLimit,
  recordFullSyncSuccess,
  recordReporterReportRoll,
} from "../ladder/rateLimits.js";
import {
  FULL_SYNC_MAX_PER_DAY,
  LADDER_REPORTS_ROLLING_MAX,
} from "../shared/constants.js";

describe("server rate limits", () => {
  it("blocks shard after hourly cap", () => {
    const nowMs = Date.now();
    const doc = { shards: { "leaderboard:armSize": { used: 3, windowStartMs: nowMs } } };
    const status = checkShardRateLimit(doc, "leaderboard:armSize", nowMs);
    assert.equal(status.allowed, false);
  });

  it("blocks full sync at daily cap", () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    const doc = {
      fullSync: { dayKey: "2026-05-27", countToday: FULL_SYNC_MAX_PER_DAY, lastCompletedAt: null },
    };
    const gate = checkFullSyncRateLimit(doc, now);
    assert.equal(gate.allowed, false);
    assert.equal(gate.reason, "full-sync-daily-cap");
  });

  it("records full sync success", () => {
    const now = new Date("2026-05-27T12:00:00.000Z");
    const doc = { fullSync: { dayKey: "2026-05-27", countToday: 0, lastCompletedAt: null } };
    recordFullSyncSuccess(doc, now);
    assert.equal(doc.fullSync.countToday, 1);
  });

  it("resets reports rolling bucket after 24h window", () => {
    const nowMs = Date.parse("2026-06-05T12:00:00.000Z");
    const staleStart = Date.parse("2026-06-03T12:00:00.000Z");
    const doc = { reportsRolling: { windowStartMs: staleStart, count: 9 } };
    const cap = checkReporterReportsRollingCap(doc, nowMs);
    assert.equal(cap.allowed, true);
    assert.equal(doc.reportsRolling.count, 0);
  });

  it("allows up to rolling max reports per window", () => {
    const nowMs = Date.now();
    const doc = { reportsRolling: { windowStartMs: nowMs, count: 0 } };
    for (let i = 0; i < LADDER_REPORTS_ROLLING_MAX; i++) {
      const cap = checkReporterReportsRollingCap(doc, nowMs);
      assert.equal(cap.allowed, true, `expected allowed at ${i}`);
      recordReporterReportRoll(doc, nowMs);
    }
    const blocked = checkReporterReportsRollingCap(doc, nowMs);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
  });
});
