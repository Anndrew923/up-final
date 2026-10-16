/**
 * Guild / Crew Sprint A — pure TX predicates (create / join / capacity / guards).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GUILD_JOIN_MAX_ATTEMPTS_PER_HOUR,
  GUILD_MAX_MEMBERS,
} from "../shared/constants.js";
import {
  appendGuildMember,
  assertCanCreateGuild,
  assertCanJoinGuild,
  assertCanKickMember,
  assertCanLeaveGuild,
  assertIsGuildCoach,
  buildMemberSnapshot,
  buildNewGuildDoc,
  consumeGuildJoinAttempt,
  normalizeGuildJoinRateDoc,
  normalizeGuildName,
  normalizeGuildTag,
  removeGuildMember,
} from "../guild/guildCore.js";
import {
  generateInviteCode,
  isValidInviteCodeShape,
  normalizeInviteCode,
} from "../guild/guildInviteCode.js";

describe("guildInviteCode", () => {
  it("normalizes and validates 6-char alphabet codes", () => {
    assert.equal(normalizeInviteCode(" ab-cd_ef "), "ABCDEF");
    assert.equal(isValidInviteCodeShape("ABCDEF"), true);
    assert.equal(isValidInviteCodeShape("ABCDE0"), false);
    assert.equal(isValidInviteCodeShape("ABCDE"), false);
  });

  it("generateInviteCode stays within alphabet", () => {
    const code = generateInviteCode(() => 0.1);
    assert.equal(code.length, 6);
    assert.equal(isValidInviteCodeShape(code), true);
  });
});

describe("assertCanCreateGuild", () => {
  it("requires Pro and empty guild binding", () => {
    assert.equal(assertCanCreateGuild({}, false).reason, "pro-required");
    assert.equal(
      assertCanCreateGuild({ guildId: "g1" }, true).reason,
      "already-in-guild"
    );
    assert.equal(assertCanCreateGuild({}, true).ok, true);
  });
});

describe("assertCanJoinGuild — Single Guild Guard", () => {
  it("rejects users who already have guildId", () => {
    assert.equal(
      assertCanJoinGuild({ guildId: "existing" }).reason,
      "already-in-guild"
    );
    assert.equal(assertCanJoinGuild({}).ok, true);
    assert.equal(assertCanJoinGuild({ guildId: "" }).ok, true);
  });
});

describe("appendGuildMember — 30-cap", () => {
  it("appends until full then blocks", () => {
    let guild = {
      memberUids: [],
      members: [],
      memberCount: 0,
      maxMembers: GUILD_MAX_MEMBERS,
    };
    for (let i = 0; i < GUILD_MAX_MEMBERS; i += 1) {
      const snap = buildMemberSnapshot({
        uid: `u${i}`,
        displayName: `User ${i}`,
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
      const result = appendGuildMember(guild, snap);
      assert.equal(result.ok, true, `expected append ok at ${i}`);
      guild = { ...guild, ...result.next };
    }
    assert.equal(guild.memberCount, GUILD_MAX_MEMBERS);

    const blocked = appendGuildMember(
      guild,
      buildMemberSnapshot({
        uid: "overflow",
        displayName: "Overflow",
        updatedAt: "2026-01-01T00:00:00.000Z",
      })
    );
    assert.equal(blocked.ok, false);
    assert.equal(blocked.reason, "guild-full");
  });

  it("rejects duplicate uid", () => {
    const snap = buildMemberSnapshot({
      uid: "u1",
      displayName: "One",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const first = appendGuildMember(
      { memberUids: [], members: [], memberCount: 0, maxMembers: 30 },
      snap
    );
    const second = appendGuildMember(first.next, snap);
    assert.equal(second.ok, false);
    assert.equal(second.reason, "already-in-guild");
  });
});

describe("buildNewGuildDoc", () => {
  it("seeds coach as sole member with count 1", () => {
    const coach = buildMemberSnapshot({
      uid: "coach1",
      displayName: "Coach",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const doc = buildNewGuildDoc({
      guildId: "g1",
      name: "Iron Crew",
      tag: "IRN",
      coachUid: "coach1",
      inviteCode: "ABCDEF",
      coachSnapshot: coach,
      nowIso: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(doc.memberCount, 1);
    assert.deepEqual(doc.memberUids, ["coach1"]);
    assert.equal(doc.members.length, 1);
    assert.equal(doc.maxMembers, GUILD_MAX_MEMBERS);
    assert.equal(doc.status, "active");
  });
});

describe("removeGuildMember / leave / kick guards", () => {
  it("removes member from arrays and decrements count", () => {
    const guild = {
      memberUids: ["coach", "m1", "m2"],
      members: [
        { uid: "coach", displayName: "C", ladderScore: 0, updatedAt: "t" },
        { uid: "m1", displayName: "M1", ladderScore: 10, updatedAt: "t" },
        { uid: "m2", displayName: "M2", ladderScore: 20, updatedAt: "t" },
      ],
      memberCount: 3,
      maxMembers: 30,
    };
    const removed = removeGuildMember(guild, "m1");
    assert.equal(removed.ok, true);
    assert.deepEqual(removed.next.memberUids, ["coach", "m2"]);
    assert.equal(removed.next.memberCount, 2);
    assert.equal(removed.next.members.some((m) => m.uid === "m1"), false);
  });

  it("blocks coach leave; allows member leave", () => {
    assert.equal(
      assertCanLeaveGuild({ guildId: "g1", guildRole: "coach" }).reason,
      "coach-cannot-leave"
    );
    const member = assertCanLeaveGuild({ guildId: "g1", guildRole: "member" });
    assert.equal(member.ok, true);
    assert.equal(member.guildId, "g1");
  });

  it("blocks self-kick and non-coach", () => {
    assert.equal(assertCanKickMember("coach", "coach").reason, "cannot-kick-self");
    assert.equal(assertCanKickMember("coach", "m1").ok, true);
    assert.equal(assertIsGuildCoach({ coachUid: "coach" }, "m1").reason, "not-coach");
    assert.equal(assertIsGuildCoach({ coachUid: "coach" }, "coach").ok, true);
  });
});

describe("normalizeGuildName / tag", () => {
  it("accepts valid name and tag shapes", () => {
    assert.equal(normalizeGuildName("  Iron  Crew ").name, "Iron Crew");
    assert.equal(normalizeGuildName("x").reason, "invalid-name");
    assert.equal(normalizeGuildName("a".repeat(25)).reason, "invalid-name");
    assert.equal(normalizeGuildName("bad<name>").reason, "invalid-name");
    // Alphabet excludes I/L/O/0/1 — tags share invite charset.
    assert.equal(normalizeGuildTag("arn").tag, "ARN");
    assert.equal(normalizeGuildTag("I").reason, "invalid-tag");
    assert.equal(normalizeGuildTag("IRONX").reason, "invalid-tag");
    assert.equal(normalizeGuildTag("AR0").reason, "invalid-tag");
    assert.equal(normalizeGuildTag("IRN").reason, "invalid-tag");
  });
});

describe("guild join rate limit", () => {
  it("burns attempts and blocks at hourly cap", () => {
    const nowMs = Date.parse("2026-10-16T12:00:00.000Z");
    let doc = null;
    for (let i = 0; i < GUILD_JOIN_MAX_ATTEMPTS_PER_HOUR; i += 1) {
      const result = consumeGuildJoinAttempt(doc, nowMs);
      assert.equal(result.allowed, true);
      doc = result.next;
    }
    const blocked = consumeGuildJoinAttempt(doc, nowMs);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, "guild-join-rate-limited");
  });

  it("resets stale hourly window", () => {
    const nowMs = Date.parse("2026-10-16T12:00:00.000Z");
    const stale = {
      windowStartMs: Date.parse("2026-10-16T10:00:00.000Z"),
      count: 9,
    };
    const bucket = normalizeGuildJoinRateDoc(stale, nowMs);
    assert.equal(bucket.count, 0);
    assert.equal(bucket.windowStartMs, nowMs);
  });
});
