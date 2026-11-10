/**
 * Club Progress Dispatch — pure gate / sanitize / recipient / copy tests.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClubDispatchNotification,
  consumeClubDispatchAttempt,
  evaluateBroadcastDeltaGate,
  filterDispatchRecipients,
  formatDispatchScore,
  normalizeBroadcastMetricType,
  resolveBroadcastIntent,
  resolveBroadcastNewScore,
  resolvePreviousScoreFromMember,
  sanitizeDispatchComment,
} from "../guild/clubProgressDispatch.js";
import { captureGuildBroadcastBaseline } from "../guild/guildScoreFanOut.js";
import {
  normalizeSetClubDispatchMuteRequest,
  normalizeUpsertPushTokenRequest,
} from "../guild/clubDispatchPrefsCallable.js";
import { normalizeSyncGuildScoreRequest } from "../guild/syncGuildScoreCallable.js";
import { CLUB_DISPATCH_MAX_PER_HOUR } from "../shared/constants.js";

describe("sanitizeDispatchComment", () => {
  it("trims, collapses whitespace, strips <> and control chars", () => {
    assert.equal(sanitizeDispatchComment("  hello   world  "), "hello world");
    assert.equal(sanitizeDispatchComment("a<b>c"), "abc");
    assert.equal(sanitizeDispatchComment("x\u0000y"), "xy");
  });

  it("truncates to 25 chars", () => {
    const long = "一二三四五六七八九十一二三四五六七八九十一二三四五";
    const out = sanitizeDispatchComment(long);
    assert.equal(out.length, 25);
  });

  it("returns empty for non-string", () => {
    assert.equal(sanitizeDispatchComment(null), "");
    assert.equal(sanitizeDispatchComment(12), "");
  });
});

describe("resolvePreviousScoreFromMember + capture baseline", () => {
  const member = {
    uid: "m1",
    displayName: "Alpha",
    ladderScore: 80,
    radarScores: { strength: 70, gripStrength: 55 },
  };

  it("reads overall ladderScore and axis radar", () => {
    assert.equal(resolvePreviousScoreFromMember(member, "overall"), 80);
    assert.equal(resolvePreviousScoreFromMember(member, "strength"), 70);
    assert.equal(resolvePreviousScoreFromMember(member, "cardio"), 0);
  });

  it("captures baseline BEFORE overwrite semantics (pure)", () => {
    const baseline = captureGuildBroadcastBaseline(
      {
        name: "Iron Crew",
        memberUids: ["m1", "m2"],
        members: [member],
      },
      "m1",
      "overall"
    );
    assert.equal(baseline.previousScore, 80);
    assert.equal(baseline.senderDisplayName, "Alpha");
    assert.deepEqual(baseline.memberUids, ["m1", "m2"]);
    assert.equal(baseline.clubName, "Iron Crew");
  });
});

describe("evaluateBroadcastDeltaGate / resolveBroadcastIntent", () => {
  it("allows positive delta only", () => {
    assert.equal(evaluateBroadcastDeltaGate(10, 10.2).ok, true);
    assert.equal(evaluateBroadcastDeltaGate(10, 10.2).delta, 0.2);
    assert.equal(evaluateBroadcastDeltaGate(10, 10).ok, false);
    assert.equal(evaluateBroadcastDeltaGate(10, 10).reason, "non-positive-delta");
    assert.equal(evaluateBroadcastDeltaGate(10, 9).ok, false);
  });

  it("skips when broadcast not requested", () => {
    const r = resolveBroadcastIntent({
      broadcast: false,
      previousScore: 1,
      ladderScore: 99,
    });
    assert.equal(r.proceed, false);
    assert.equal(r.broadcastSkipped, "not-requested");
  });

  it("skips non-positive delta while exposing delta", () => {
    const r = resolveBroadcastIntent({
      broadcast: true,
      previousScore: 90,
      ladderScore: 88,
      broadcastMetricType: "overall",
    });
    assert.equal(r.proceed, false);
    assert.equal(r.broadcastSkipped, "non-positive-delta");
    assert.equal(r.delta, -2);
  });

  it("proceeds when overall score rises", () => {
    const r = resolveBroadcastIntent({
      broadcast: true,
      previousScore: 80,
      ladderScore: 85.5,
      broadcastMetricType: "overall",
    });
    assert.equal(r.proceed, true);
    assert.equal(r.delta, 5.5);
    assert.equal(r.newScore, 85.5);
  });

  it("requires axis score in radarScores for non-overall metric", () => {
    const missing = resolveBroadcastIntent({
      broadcast: true,
      previousScore: 10,
      ladderScore: 99,
      broadcastMetricType: "gripStrength",
    });
    assert.equal(missing.proceed, false);
    assert.equal(missing.broadcastSkipped, "invalid-metric-score");

    const ok = resolveBroadcastIntent({
      broadcast: true,
      previousScore: 10,
      ladderScore: 99,
      radarScores: { gripStrength: 40 },
      broadcastMetricType: "gripStrength",
    });
    assert.equal(ok.proceed, true);
    assert.equal(ok.newScore, 40);
    assert.equal(ok.delta, 30);
  });
});

describe("filterDispatchRecipients", () => {
  it("excludes self, mute, and missing tokens", () => {
    const prefs = {
      sender: { fcmToken: "token-sender-xxxxxxxx" },
      mutee: { muteClubDispatches: true, fcmToken: "token-mute-xxxxxxxxxx" },
      notoken: { muteClubDispatches: false },
      mate: { muteClubDispatches: false, fcmToken: "token-mate-xxxxxxxxxxx" },
      mate2: { fcmToken: "token-mate2-xxxxxxxxxx" },
    };
    const { tokens, skippedMute, skippedNoToken } = filterDispatchRecipients(
      ["sender", "mutee", "notoken", "mate", "mate2"],
      "sender",
      prefs
    );
    assert.deepEqual(tokens.sort(), ["token-mate-xxxxxxxxxxx", "token-mate2-xxxxxxxxxx"].sort());
    assert.equal(skippedMute, 1);
    assert.equal(skippedNoToken, 1);
  });
});

describe("buildClubDispatchNotification", () => {
  it("builds zh body with comment and deep link data", () => {
    const n = buildClubDispatchNotification({
      clubName: "ARN",
      userName: "Bruce",
      newScore: 81.2,
      delta: 0.2,
      comment: "破80了",
      senderUid: "u1",
      guildId: "g1",
      dispatchId: "d1",
    });
    assert.equal(n.notification.title, "【戰隊快報 // ARN】");
    assert.match(n.notification.body, /Bruce 戰鬥力推進至 81\.2（\+0\.2）/);
    assert.match(n.notification.body, /「破80了」/);
    assert.equal(n.data.route, "/crew?focusUid=u1");
    assert.equal(n.data.type, "club_progress_dispatch");
    assert.equal(n.data.dispatchId, "d1");
    assert.equal(n.apns.payload.aps.alert.title, "【戰隊快報 // ARN】");
    assert.equal(n.apns.payload.aps.sound, "default");
    assert.equal(n.apns.payload.aps.badge, 1);
  });

  it("omits quote clause when comment empty", () => {
    const n = buildClubDispatchNotification({
      clubName: "ARN",
      userName: "Bruce",
      newScore: 80,
      delta: 1,
      comment: "",
      senderUid: "u1",
      guildId: "g1",
    });
    assert.equal(n.notification.body.includes("「"), false);
    assert.match(n.notification.body, /今天要去改造一下自己嗎？/);
    assert.ok(n.apns.payload.aps.alert.body.includes("Bruce"));
  });
});

describe("consumeClubDispatchAttempt", () => {
  it("allows up to CLUB_DISPATCH_MAX_PER_HOUR then rate-limits", () => {
    let raw = null;
    const now = 1_700_000_000_000;
    for (let i = 0; i < CLUB_DISPATCH_MAX_PER_HOUR; i += 1) {
      const r = consumeClubDispatchAttempt(raw, now);
      assert.equal(r.allowed, true);
      raw = r.next;
    }
    const blocked = consumeClubDispatchAttempt(raw, now);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, "rate-limited");
  });
});

describe("normalizeSyncGuildScoreRequest broadcast fields", () => {
  it("defaults broadcast false and sanitizes comment + metric", () => {
    const r = normalizeSyncGuildScoreRequest(
      {
        ladderScore: 10,
        broadcast: true,
        comment: "  hi <x>  ",
        broadcastMetricType: "explosivePower",
      },
      "u1"
    );
    assert.equal(r.ok, true);
    assert.equal(r.broadcast, true);
    assert.equal(r.comment, "hi x");
    assert.equal(r.broadcastMetricType, "explosivePower");
  });

  it("falls back unknown metric to overall", () => {
    assert.equal(normalizeBroadcastMetricType("explosive"), "overall");
    assert.equal(normalizeBroadcastMetricType("gripStrength"), "gripStrength");
  });
});

describe("resolveBroadcastNewScore", () => {
  it("reads overall vs axis", () => {
    assert.equal(resolveBroadcastNewScore({ ladderScore: 12 }, "overall").newScore, 12);
    assert.equal(
      resolveBroadcastNewScore({ ladderScore: 12, radarScores: { strength: 33 } }, "strength")
        .newScore,
      33
    );
  });
});

describe("formatDispatchScore", () => {
  it("trims trailing zeros", () => {
    assert.equal(formatDispatchScore(80), "80");
    assert.equal(formatDispatchScore(80.2), "80.2");
    assert.equal(formatDispatchScore(80.25), "80.25");
  });
});

describe("prefs callables normalize", () => {
  it("upsertPushToken accepts clear and valid token", () => {
    assert.equal(normalizeUpsertPushTokenRequest({ clear: true }).clear, true);
    const ok = normalizeUpsertPushTokenRequest({
      fcmToken: "abcd1234567890",
      fcmPlatform: "ios",
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.fcmPlatform, "ios");
    assert.equal(normalizeUpsertPushTokenRequest({ fcmToken: "short" }).ok, false);
  });

  it("setClubDispatchMute requires boolean", () => {
    assert.equal(normalizeSetClubDispatchMuteRequest({ muteClubDispatches: true }).ok, true);
    assert.equal(normalizeSetClubDispatchMuteRequest({ mute: false }).muteClubDispatches, false);
    assert.equal(normalizeSetClubDispatchMuteRequest({}).ok, false);
  });
});
