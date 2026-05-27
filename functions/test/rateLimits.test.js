import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkFullSyncRateLimit,
  checkShardRateLimit,
  recordFullSyncSuccess,
} from "../ladder/rateLimits.js";
import { FULL_SYNC_MAX_PER_DAY } from "../shared/constants.js";

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
});
