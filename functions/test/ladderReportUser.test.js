import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LADDER_REPORTS_ROLLING_MAX,
  LADDER_REPORT_ROLLING_MS,
} from "../shared/constants.js";
import {
  checkReporterReportsRollingCap,
  recordReporterReportRoll,
} from "../ladder/rateLimits.js";
import {
  LADDER_REPORT_TARGET_UID_MAX,
  REPORT_DEDUPE_MS,
  buildReportDocId,
  buildReportPayload,
  isReportAllowedWithinWindow,
  isValidReportTargetUid,
  resolveReportWritePlan,
  validateReportPayload,
} from "../ladder/reportUserCore.js";

describe("ladderReportUser core", () => {
  it("rejects invalid payload", () => {
    assert.deepEqual(validateReportPayload({}), {
      ok: false,
      code: "invalid-argument",
      message: "targetUid required",
    });
    assert.deepEqual(validateReportPayload({ targetUid: "b", type: "invalid" }), {
      ok: false,
      code: "invalid-argument",
      message: "invalid report type",
    });
  });

  it("accepts valid payload", () => {
    const result = validateReportPayload({ targetUid: "target", type: "both" });
    assert.equal(result.ok, true);
    assert.equal(result.targetUid, "target");
    assert.equal(result.type, "both");
  });

  it("rejects invalid targetUid shape", () => {
    assert.equal(isValidReportTargetUid("a/b"), false);
    assert.equal(isValidReportTargetUid("x".repeat(LADDER_REPORT_TARGET_UID_MAX + 1)), false);
    assert.deepEqual(validateReportPayload({ targetUid: "bad/uid", type: "nickname" }), {
      ok: false,
      code: "invalid-argument",
      message: "invalid targetUid",
    });
  });

  it("builds report doc id without type", () => {
    assert.equal(buildReportDocId("r1", "t1"), "r1_t1");
  });

  it("enforces 24h dedupe window for new vs merge", () => {
    const nowMs = Date.parse("2026-06-04T12:00:00.000Z");
    const recent = "2026-06-04T11:00:00.000Z";
    const old = "2026-06-03T11:00:00.000Z";
    assert.equal(isReportAllowedWithinWindow(recent, nowMs), false);
    assert.equal(isReportAllowedWithinWindow(old, nowMs), true);
    assert.equal(isReportAllowedWithinWindow(null, nowMs), true);
    assert.equal(REPORT_DEDUPE_MS, LADDER_REPORT_ROLLING_MS);
  });

  it("merge within 24h does not consume rolling quota", () => {
    const nowMs = Date.parse("2026-06-04T12:00:00.000Z");
    const createdAt = "2026-06-04T10:00:00.000Z";
    const plan = resolveReportWritePlan(createdAt, nowMs);
    assert.equal(plan.mode, "merge");
    assert.equal(plan.consumesQuota, false);

    const rateDoc = { reportsRolling: { windowStartMs: nowMs, count: 5 } };
    const capBefore = checkReporterReportsRollingCap(rateDoc, nowMs);
    assert.equal(capBefore.allowed, true);

    const payload = buildReportPayload({
      reporterUid: "r1",
      targetUid: "t1",
      type: "avatar",
      plan,
      nowIso: "2026-06-04T12:00:00.000Z",
      preserveCreatedAt: createdAt,
    });
    assert.equal(payload.createdAt, createdAt);
    assert.equal(payload.type, "avatar");
    assert.equal(payload.updatedAt, "2026-06-04T12:00:00.000Z");

    assert.equal(rateDoc.reportsRolling.count, 5);
  });

  it("new target after window consumes quota", () => {
    const nowMs = Date.parse("2026-06-04T12:00:00.000Z");
    const old = "2026-06-02T12:00:00.000Z";
    const plan = resolveReportWritePlan(old, nowMs);
    assert.equal(plan.mode, "new");
    assert.equal(plan.consumesQuota, true);
  });

  it("blocks 11th distinct report in rolling window", () => {
    const nowMs = Date.parse("2026-06-04T12:00:00.000Z");
    const rateDoc = {
      reportsRolling: { windowStartMs: nowMs, count: LADDER_REPORTS_ROLLING_MAX },
    };
    const cap = checkReporterReportsRollingCap(rateDoc, nowMs);
    assert.equal(cap.allowed, false);
    assert.equal(cap.remaining, 0);
  });

  it("increments rolling count only when recording a new report", () => {
    const nowMs = Date.parse("2026-06-04T12:00:00.000Z");
    const rateDoc = { reportsRolling: { windowStartMs: nowMs, count: 3 } };
    const recorded = recordReporterReportRoll(rateDoc, nowMs);
    assert.equal(recorded.count, 4);
    assert.equal(rateDoc.reportsRolling.count, 4);
  });
});
