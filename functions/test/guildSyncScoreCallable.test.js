/**
 * syncGuildLadderScore — request normalize + fan-out mapping (no Firestore).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapFanOutToSyncGuildScoreResponse,
  normalizeSyncGuildScoreRequest,
} from "../guild/syncGuildScoreCallable.js";

describe("mapFanOutToSyncGuildScoreResponse", () => {
  it("keeps hard fan-out failures as ok:false (not soft-skip)", () => {
    const mapped = mapFanOutToSyncGuildScoreResponse(
      { ok: false, reason: "fan-out-error" },
      90
    );
    assert.equal(mapped.ok, false);
    assert.equal(mapped.skipped, false);
    assert.equal(mapped.reason, "fan-out-error");
  });

  it("maps soft-skip reasons to ok:true skipped", () => {
    const mapped = mapFanOutToSyncGuildScoreResponse(
      { ok: true, reason: "no-guild" },
      90
    );
    assert.equal(mapped.ok, true);
    assert.equal(mapped.skipped, true);
    assert.equal(mapped.reason, "no-guild");
  });

  it("maps successful patch without reason", () => {
    const mapped = mapFanOutToSyncGuildScoreResponse({ ok: true, guildId: "g1" }, 88);
    assert.equal(mapped.ok, true);
    assert.equal(mapped.skipped, false);
    assert.equal(mapped.guildId, "g1");
    assert.equal(mapped.ladderScore, 88);
  });
});

describe("normalizeSyncGuildScoreRequest", () => {
  it("accepts ladderScore and score aliases", () => {
    const a = normalizeSyncGuildScoreRequest({ ladderScore: 88.5, displayName: "Ace" }, "u1");
    assert.equal(a.ok, true);
    assert.equal(a.ladderScore, 88.5);
    assert.equal(a.displayName, "Ace");

    const b = normalizeSyncGuildScoreRequest({ score: 10 }, "u1");
    assert.equal(b.ok, true);
    assert.equal(b.ladderScore, 10);
  });

  it("rejects missing or negative scores", () => {
    assert.equal(normalizeSyncGuildScoreRequest({}, "u1").ok, false);
    assert.equal(normalizeSyncGuildScoreRequest({ ladderScore: -1 }, "u1").ok, false);
    assert.equal(normalizeSyncGuildScoreRequest({ ladderScore: Number.NaN }, "u1").ok, false);
  });

  it("clamps identity anonymity flag", () => {
    const result = normalizeSyncGuildScoreRequest(
      {
        ladderScore: 1,
        displayName: "Ghost",
        avatarUrl: "https://cdn.example/a.png",
        isAnonymousInLadder: true,
      },
      "u1"
    );
    assert.equal(result.ok, true);
    assert.equal(result.isAnonymous, true);
    assert.equal(result.avatarUrl, "https://cdn.example/a.png");
  });

  it("allows missing displayName (server fallback)", () => {
    const result = normalizeSyncGuildScoreRequest({ ladderScore: 42 }, "abcdef12xyz");
    assert.equal(result.ok, true);
    assert.equal(result.displayName, "abcdef12");
  });

  it("sanitizes optional radarScores map", () => {
    const result = normalizeSyncGuildScoreRequest(
      {
        ladderScore: 70,
        radarScores: {
          strength: 91.111,
          explosivePower: 20,
          cardio: 30,
          muscleMass: 40,
          bodyFat: 50,
          gripStrength: 60,
        },
      },
      "u1"
    );
    assert.equal(result.ok, true);
    assert.equal(result.radarScores.strength, 91.11);
    assert.equal(result.radarScores.cardio, 30);
  });
});
