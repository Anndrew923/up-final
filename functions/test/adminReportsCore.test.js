import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ADMIN_REPORTS_LIMIT,
  MAX_ADMIN_REPORTS_LIMIT,
  buildIdentitySanitizeFields,
  normalizeReportType,
  validateListReportsInput,
  validateProcessReportInput,
} from "../ladder/adminReportsCore.js";
import {
  applyLadderIdentityLockToUpload,
  parseLadderIdentityLock,
} from "../shared/ladderIdentityLock.js";
import { resolveReportWritePlan } from "../ladder/reportUserCore.js";

describe("adminReportsCore validators", () => {
  it("defaults list limit and accepts cursor", () => {
    const empty = validateListReportsInput({});
    assert.equal(empty.ok, true);
    assert.equal(empty.limit, DEFAULT_ADMIN_REPORTS_LIMIT);
    assert.equal(empty.cursor, null);

    const withCursor = validateListReportsInput({
      limit: 99,
      cursor: { createdAt: "2026-01-01T00:00:00.000Z", id: "r1_t1" },
    });
    assert.equal(withCursor.ok, true);
    assert.equal(withCursor.limit, MAX_ADMIN_REPORTS_LIMIT);
    assert.deepEqual(withCursor.cursor, {
      createdAt: "2026-01-01T00:00:00.000Z",
      id: "r1_t1",
    });
  });

  it("rejects invalid list cursor", () => {
    assert.equal(validateListReportsInput({ cursor: { createdAt: "", id: "x" } }).ok, false);
    assert.equal(validateListReportsInput({ cursor: "bad" }).ok, false);
  });

  it("validates process payload", () => {
    assert.deepEqual(validateProcessReportInput({}), {
      ok: false,
      code: "invalid-argument",
      message: "reportId required",
    });
    assert.equal(
      validateProcessReportInput({ reportId: "a/b", action: "APPROVE" }).ok,
      false
    );
    assert.equal(
      validateProcessReportInput({ reportId: "r1", action: "maybe" }).ok,
      false
    );

    const ok = validateProcessReportInput({
      reportId: "reporter_target",
      action: "approve",
      notes: "spam",
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.action, "APPROVE");
    assert.equal(ok.notes, "spam");
  });
});

describe("normalizeReportType / buildIdentitySanitizeFields", () => {
  it("rejects unknown types", () => {
    assert.equal(normalizeReportType("spam"), null);
    assert.equal(buildIdentitySanitizeFields("nope").ok, false);
    assert.equal(buildIdentitySanitizeFields("nope").fields, null);
  });

  it("clears nickname only without forcing anonymous flag", () => {
    const result = buildIdentitySanitizeFields("nickname");
    assert.equal(result.ok, true);
    assert.equal(result.clearNickname, true);
    assert.equal(result.clearAvatar, false);
    assert.equal(result.fields.displayName, "Anonymous");
    assert.equal("isAnonymousInLadder" in result.fields, false);
    assert.equal("avatarUrl" in result.fields, false);
  });

  it("clears avatar only", () => {
    const result = buildIdentitySanitizeFields("avatar");
    assert.equal(result.clearNickname, false);
    assert.equal(result.clearAvatar, true);
    assert.equal("displayName" in result.fields, false);
    assert.ok(result.fields.avatarUrl);
  });

  it("clears both and forces anonymous", () => {
    const result = buildIdentitySanitizeFields("both");
    assert.equal(result.clearNickname, true);
    assert.equal(result.clearAvatar, true);
    assert.equal(result.fields.displayName, "Anonymous");
    assert.equal(result.fields.isAnonymousInLadder, true);
    assert.ok(result.fields.avatarUrl);
  });
});

describe("ladderIdentityLock", () => {
  it("parses lock flags", () => {
    assert.equal(parseLadderIdentityLock(null), null);
    assert.equal(parseLadderIdentityLock({ lockNickname: false, lockAvatar: false }), null);
    assert.deepEqual(parseLadderIdentityLock({ lockNickname: true, lockAvatar: false }), {
      lockNickname: true,
      lockAvatar: false,
    });
  });

  it("forces anonymous only when both nickname and avatar are locked", () => {
    const nickOnly = applyLadderIdentityLockToUpload({
      displayName: "BadName",
      avatarUrl: "https://example.com/a.png",
      profile: { isAnonymousInLadder: false },
      lock: { lockNickname: true, lockAvatar: false },
    });
    assert.equal(nickOnly.displayName, "Anonymous");
    assert.equal(nickOnly.avatarUrl, "https://example.com/a.png");
    assert.equal(nickOnly.profile.isAnonymousInLadder, false);

    const both = applyLadderIdentityLockToUpload({
      displayName: "BadName",
      avatarUrl: "https://example.com/a.png",
      profile: {},
      lock: { lockNickname: true, lockAvatar: true },
    });
    assert.equal(both.displayName, "Anonymous");
    assert.equal(both.avatarUrl, null);
    assert.equal(both.profile.isAnonymousInLadder, true);
  });
});

describe("resolveReportWritePlan closed-report guard", () => {
  const now = Date.parse("2026-07-29T00:00:00.000Z");
  const recent = new Date(now - 60_000).toISOString();
  const stale = new Date(now - 25 * 60 * 60 * 1000).toISOString();

  it("noops closed reports inside dedupe window", () => {
    const plan = resolveReportWritePlan(recent, now, "dismissed");
    assert.equal(plan.mode, "noop");
    assert.equal(plan.consumesQuota, false);
  });

  it("allows a fresh case after window for closed reports", () => {
    const plan = resolveReportWritePlan(stale, now, "resolved");
    assert.equal(plan.mode, "new");
    assert.equal(plan.consumesQuota, true);
  });

  it("still merges pending reports inside the window", () => {
    const plan = resolveReportWritePlan(recent, now, "pending");
    assert.equal(plan.mode, "merge");
    assert.equal(plan.consumesQuota, false);
  });
});
