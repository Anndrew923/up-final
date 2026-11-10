/**
 * Club Progress Dispatch — pure gate / sanitize / recipient / copy tests.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClubDispatchAndroidPayload,
  buildClubDispatchBody,
  buildClubDispatchNotification,
  CLUB_DISPATCH_METRIC_LABELS_ZH,
  consumeClubDispatchAttempt,
  evaluateBroadcastDeltaGate,
  filterDispatchRecipients,
  formatDispatchScore,
  formatOverallDeltaSuffix,
  isStaleFcmRegistrationErrorCode,
  normalizeBroadcastMetricType,
  resolveBroadcastIntent,
  resolveBroadcastNewScore,
  resolveClubDispatchMetricLabelZh,
  resolveClubDispatchNotificationScores,
  resolvePreviousScoreFromMember,
  sanitizeDispatchComment,
  selectStaleFcmClearTargets,
  shouldClearStoredFcmToken,
} from "../guild/clubProgressDispatch.js";
import { captureGuildBroadcastBaseline } from "../guild/guildScoreFanOut.js";
import {
  normalizeSetClubDispatchMuteRequest,
  normalizeUpsertPushTokenRequest,
} from "../guild/clubDispatchPrefsCallable.js";
import { normalizeSyncGuildScoreRequest } from "../guild/syncGuildScoreCallable.js";
import {
  CLUB_DISPATCH_ANDROID_CHANNEL_ID,
  CLUB_DISPATCH_MAX_PER_HOUR,
  SIX_AXIS_METRICS,
} from "../shared/constants.js";

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
    assert.equal(baseline.previousLadderScore, 80);
    assert.equal(baseline.senderDisplayName, "Alpha");
    assert.deepEqual(baseline.memberUids, ["m1", "m2"]);
    assert.equal(baseline.clubName, "Iron Crew");
  });

  it("captures previousLadderScore separately from axis previousScore", () => {
    const baseline = captureGuildBroadcastBaseline(
      {
        name: "Iron Crew",
        memberUids: ["m1"],
        members: [member],
      },
      "m1",
      "strength"
    );
    assert.equal(baseline.previousScore, 70);
    assert.equal(baseline.previousLadderScore, 80);
    assert.equal(baseline.metricType, "strength");
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
  it("excludes self, mute, and missing tokens while keeping uid↔token map", () => {
    const prefs = {
      sender: { fcmToken: "token-sender-xxxxxxxx" },
      mutee: { muteClubDispatches: true, fcmToken: "token-mute-xxxxxxxxxx" },
      notoken: { muteClubDispatches: false },
      mate: { muteClubDispatches: false, fcmToken: "token-mate-xxxxxxxxxxx" },
      mate2: { fcmToken: "token-mate2-xxxxxxxxxx" },
    };
    const { recipients, tokens, skippedMute, skippedNoToken } = filterDispatchRecipients(
      ["sender", "mutee", "notoken", "mate", "mate2"],
      "sender",
      prefs
    );
    assert.deepEqual(tokens.sort(), ["token-mate-xxxxxxxxxxx", "token-mate2-xxxxxxxxxx"].sort());
    assert.deepEqual(
      recipients.sort((a, b) => a.uid.localeCompare(b.uid)),
      [
        { uid: "mate", token: "token-mate-xxxxxxxxxxx" },
        { uid: "mate2", token: "token-mate2-xxxxxxxxxx" },
      ]
    );
    assert.equal(skippedMute, 1);
    assert.equal(skippedNoToken, 1);
  });

  it("dedupes identical tokens across members (first uid wins)", () => {
    const prefs = {
      a: { fcmToken: "shared-token-xxxxxxxxxx" },
      b: { fcmToken: "shared-token-xxxxxxxxxx" },
    };
    const { recipients, tokens } = filterDispatchRecipients(["a", "b"], "sender", prefs);
    assert.deepEqual(tokens, ["shared-token-xxxxxxxxxx"]);
    assert.deepEqual(recipients, [{ uid: "a", token: "shared-token-xxxxxxxxxx" }]);
  });
});

describe("isStaleFcmRegistrationErrorCode", () => {
  it("matches NotRegistered / InvalidRegistration Admin codes only", () => {
    assert.equal(
      isStaleFcmRegistrationErrorCode("messaging/registration-token-not-registered"),
      true
    );
    assert.equal(
      isStaleFcmRegistrationErrorCode("messaging/invalid-registration-token"),
      true
    );
    assert.equal(isStaleFcmRegistrationErrorCode("messaging/internal-error"), false);
    assert.equal(isStaleFcmRegistrationErrorCode(null), false);
  });
});

describe("shouldClearStoredFcmToken / selectStaleFcmClearTargets", () => {
  it("compare-and-clear only when stored token still matches failed token", () => {
    assert.equal(shouldClearStoredFcmToken("abc", "abc"), true);
    assert.equal(shouldClearStoredFcmToken("  abc  ", "abc"), true);
    assert.equal(shouldClearStoredFcmToken("new-token", "abc"), false);
    assert.equal(shouldClearStoredFcmToken(null, "abc"), false);
    assert.equal(shouldClearStoredFcmToken("", "abc"), false);
  });

  it("selects index-aligned stale failures and respects clearMax", () => {
    const chunk = [
      { uid: "u1", token: "token-one-xxxxxxxxxx" },
      { uid: "u2", token: "token-two-xxxxxxxxxx" },
      { uid: "u3", token: "token-three-xxxxxxxx" },
    ];
    const responses = [
      { success: false, error: { code: "messaging/registration-token-not-registered" } },
      { success: false, error: { code: "messaging/internal-error" } },
      { success: false, error: { code: "messaging/invalid-registration-token" } },
    ];
    const selected = selectStaleFcmClearTargets(chunk, responses, { clearMax: 10 });
    assert.deepEqual(selected.targets, [
      { uid: "u1", token: "token-one-xxxxxxxxxx", code: "messaging/registration-token-not-registered" },
      { uid: "u3", token: "token-three-xxxxxxxx", code: "messaging/invalid-registration-token" },
    ]);
    assert.equal(selected.truncated, false);

    const capped = selectStaleFcmClearTargets(chunk, responses, {
      alreadyCleared: 49,
      clearMax: 50,
    });
    assert.equal(capped.targets.length, 1);
    assert.equal(capped.targets[0].uid, "u1");
    assert.equal(capped.truncated, true);
  });
});

describe("club dispatch metric labels + body", () => {
  it("locks physiology labels for every SIX_AXIS_METRICS key", () => {
    assert.equal(CLUB_DISPATCH_METRIC_LABELS_ZH.muscleMass, "骨骼肌量");
    assert.equal(resolveClubDispatchMetricLabelZh("gripStrength"), "握力");
    assert.equal(resolveClubDispatchMetricLabelZh("overall"), null);
    for (const metric of SIX_AXIS_METRICS) {
      assert.notEqual(
        resolveClubDispatchMetricLabelZh(metric),
        null,
        `missing label for ${metric}`
      );
    }
    assert.equal(formatOverallDeltaSuffix(0.19), " (+0.19)");
    assert.equal(formatOverallDeltaSuffix(0), "");
    assert.equal(formatOverallDeltaSuffix(-0.2), "");
  });

  it("builds axis breakthrough dual-line body with comment", () => {
    const body = buildClubDispatchBody({
      userName: "TfldVIDz",
      metricType: "muscleMass",
      axisScore: 84.7,
      overallScore: 90.28,
      overallDelta: 0.19,
      comment: "細狗們膜拜吧",
    });
    assert.equal(
      body,
      "TfldVIDz 突破【骨骼肌量】84.7！總戰力升至 90.28 (+0.19)\n💬「細狗們膜拜吧」"
    );
  });

  it("omits comment line and overall delta suffix when absent / non-positive", () => {
    const flat = buildClubDispatchBody({
      userName: "Bruce",
      metricType: "strength",
      axisScore: 81.2,
      overallScore: 88,
      overallDelta: 0,
      comment: "",
    });
    assert.equal(flat, "Bruce 突破【最大肌力】81.2！總戰力升至 88");
    assert.equal(flat.includes("\n"), false);
    assert.equal(flat.includes("💬"), false);

    const declined = buildClubDispatchBody({
      userName: "Bruce",
      metricType: "gripStrength",
      axisScore: 70,
      overallScore: 85,
      overallDelta: -0.4,
      comment: "",
    });
    assert.equal(declined, "Bruce 突破【握力】70！總戰力升至 85");
  });

  it("degrades unknown / overall metric and negative axis scores", () => {
    assert.equal(
      buildClubDispatchBody({
        userName: "Bruce",
        metricType: "overall",
        axisScore: 99,
        overallScore: 90.28,
        overallDelta: 1.5,
        comment: null,
      }),
      "Bruce 總戰力升至 90.28 (+1.5)"
    );
    assert.equal(
      buildClubDispatchBody({
        userName: "Bruce",
        metricType: "explosive",
        axisScore: 40,
        overallScore: 80,
        overallDelta: 1,
        comment: "",
      }),
      "Bruce 總戰力升至 80 (+1)"
    );
    assert.equal(
      buildClubDispatchBody({
        userName: "Bruce",
        metricType: "strength",
        axisScore: Number.NaN,
        overallScore: 80,
        overallDelta: 1,
        comment: "",
      }),
      "Bruce 總戰力升至 80 (+1)"
    );
  });

  it("keeps legacy newScore/delta as overall-only (never mislabels axis)", () => {
    assert.deepEqual(
      resolveClubDispatchNotificationScores({
        metricType: "overall",
        newScore: 81.2,
        delta: 0.2,
      }),
      { metricType: "overall", axisScore: null, overallScore: 81.2, overallDelta: 0.2 }
    );
    assert.deepEqual(
      resolveClubDispatchNotificationScores({
        metricType: "strength",
        newScore: 81.2,
        delta: 5,
      }),
      { metricType: "strength", axisScore: 81.2, overallScore: 0, overallDelta: 0 }
    );
    const body = buildClubDispatchNotification({
      clubName: "ARN",
      userName: "Bruce",
      metricType: "strength",
      newScore: 81.2,
      delta: 5,
      comment: "",
      senderUid: "u1",
      guildId: "g1",
    }).notification.body;
    assert.equal(body, "Bruce 突破【最大肌力】81.2！總戰力升至 0");
    assert.equal(body.includes("(+5)"), false);
  });
});

describe("buildClubDispatchNotification", () => {
  it("builds zh dual-line body with comment and deep link data", () => {
    const n = buildClubDispatchNotification({
      clubName: "ARN",
      userName: "Bruce",
      metricType: "muscleMass",
      axisScore: 84.7,
      overallScore: 90.28,
      overallDelta: 0.19,
      comment: "破80了",
      senderUid: "u1",
      guildId: "g1",
      dispatchId: "d1",
    });
    assert.equal(n.notification.title, "【戰隊快報 // ARN】");
    assert.equal(
      n.notification.body,
      "Bruce 突破【骨骼肌量】84.7！總戰力升至 90.28 (+0.19)\n💬「破80了」"
    );
    assert.equal(n.data.route, "/crew?focusUid=u1");
    assert.equal(n.data.type, "club_progress_dispatch");
    assert.equal(n.data.dispatchId, "d1");
    assert.equal(n.apns.payload.aps.alert.title, "【戰隊快報 // ARN】");
    assert.equal(n.apns.payload.aps.alert.body, n.notification.body);
    assert.equal(n.apns.payload.aps.sound, "default");
    assert.equal(n.apns.payload.aps.badge, 1);
    assert.equal(n.android.priority, "high");
    assert.equal(n.android.notification.channelId, CLUB_DISPATCH_ANDROID_CHANNEL_ID);
    assert.equal(n.android.notification.priority, "high");
    assert.equal(n.android.notification.defaultSound, true);
    assert.equal(n.android.notification.defaultVibrateTimings, true);
  });

  it("exposes a reusable Android channel payload builder", () => {
    const android = buildClubDispatchAndroidPayload();
    assert.equal(android.notification.channelId, "club_dispatches");
    assert.equal(android.priority, "high");
  });

  it("omits comment line when comment empty (single data line)", () => {
    const n = buildClubDispatchNotification({
      clubName: "ARN",
      userName: "Bruce",
      metricType: "strength",
      axisScore: 80,
      overallScore: 85,
      overallDelta: 1,
      comment: "",
      senderUid: "u1",
      guildId: "g1",
    });
    assert.equal(n.notification.body, "Bruce 突破【最大肌力】80！總戰力升至 85 (+1)");
    assert.equal(n.notification.body.includes("「"), false);
    assert.equal(n.notification.body.includes("今天要去改造"), false);
    assert.equal(n.notification.body.includes("\n"), false);
  });

  it("degrades overall metric notifications without axis clause", () => {
    const n = buildClubDispatchNotification({
      clubName: "ARN",
      userName: "Bruce",
      metricType: "overall",
      overallScore: 90,
      overallDelta: 2,
      comment: "",
      senderUid: "u1",
      guildId: "g1",
    });
    assert.equal(n.notification.body, "Bruce 總戰力升至 90 (+2)");
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
