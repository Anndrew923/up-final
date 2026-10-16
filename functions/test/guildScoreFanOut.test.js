/**
 * Guild ladderScore fan-out — pure patch predicates (no Firestore).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyMemberLadderScorePatch,
  readGuildIdFromUserData,
} from "../guild/guildScoreFanOut.js";

describe("readGuildIdFromUserData", () => {
  it("reads camelCase and snake_case", () => {
    assert.equal(readGuildIdFromUserData({ guildId: "g1" }), "g1");
    assert.equal(readGuildIdFromUserData({ guild_id: "g2" }), "g2");
    assert.equal(readGuildIdFromUserData({ guildId: "  " }), null);
    assert.equal(readGuildIdFromUserData(null), null);
  });
});

describe("applyMemberLadderScorePatch", () => {
  const baseGuild = {
    status: "active",
    memberUids: ["coach", "m1", "m2"],
    memberCount: 3,
    members: [
      { uid: "coach", displayName: "Coach", ladderScore: 40, updatedAt: "t0" },
      { uid: "m1", displayName: "Alpha", ladderScore: 10, updatedAt: "t0" },
      { uid: "m2", displayName: "Beta", ladderScore: 20, updatedAt: "t0" },
    ],
  };

  it("updates member score and re-sorts descending", () => {
    const result = applyMemberLadderScorePatch(baseGuild, "m1", {
      ladderScore: 99,
      displayName: "Alpha+",
      avatarUrl: "https://cdn.example/a.png",
      updatedAt: "t1",
    });
    assert.equal(result.ok, true);
    assert.equal(result.members[0].uid, "m1");
    assert.equal(result.members[0].ladderScore, 99);
    assert.equal(result.members[0].displayName, "Alpha+");
    assert.equal(result.members[0].avatarUrl, "https://cdn.example/a.png");
    assert.equal(result.members[0].updatedAt, "t1");
    assert.equal(result.members[1].uid, "coach");
    assert.equal(result.members[2].uid, "m2");
  });

  it("embeds radarScores when provided", () => {
    const result = applyMemberLadderScorePatch(baseGuild, "m1", {
      ladderScore: 55,
      radarScores: {
        strength: 80,
        explosivePower: 70,
        cardio: 60,
        muscleMass: 50,
        bodyFat: 40,
        gripStrength: 30,
      },
      updatedAt: "t2",
    });
    assert.equal(result.ok, true);
    assert.equal(result.members.find((m) => m.uid === "m1").radarScores.strength, 80);
    assert.equal(result.members.find((m) => m.uid === "m1").radarScores.gripStrength, 30);
  });

  it("clears avatar when anonymous", () => {
    const withAvatar = {
      ...baseGuild,
      members: [
        {
          uid: "m1",
          displayName: "Alpha",
          ladderScore: 10,
          avatarUrl: "https://cdn.example/a.png",
          updatedAt: "t0",
        },
      ],
      memberUids: ["m1"],
      memberCount: 1,
    };
    const result = applyMemberLadderScorePatch(withAvatar, "m1", {
      ladderScore: 11,
      clearAvatar: true,
      updatedAt: "t1",
    });
    assert.equal(result.ok, true);
    assert.equal(result.members[0].avatarUrl, undefined);
  });

  it("returns not-member when uid missing from members", () => {
    const result = applyMemberLadderScorePatch(baseGuild, "ghost", {
      ladderScore: 1,
      updatedAt: "t1",
    });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "not-member");
  });

  it("rejects disbanded guilds", () => {
    const result = applyMemberLadderScorePatch(
      { ...baseGuild, status: "disbanded" },
      "m1",
      { ladderScore: 1, updatedAt: "t1" }
    );
    assert.equal(result.ok, false);
    assert.equal(result.reason, "invalid-guild");
  });

  it("clamps non-finite scores to 0", () => {
    const result = applyMemberLadderScorePatch(baseGuild, "m2", {
      ladderScore: Number.NaN,
      updatedAt: "t1",
    });
    assert.equal(result.ok, true);
    const row = result.members.find((m) => m.uid === "m2");
    assert.equal(row.ladderScore, 0);
  });

  it("tie-breaks equal scores by displayName then uid", () => {
    const tied = {
      status: "active",
      members: [
        { uid: "z", displayName: "Zed", ladderScore: 50, updatedAt: "t0" },
        { uid: "a", displayName: "Ann", ladderScore: 50, updatedAt: "t0" },
        { uid: "b", displayName: "Ann", ladderScore: 50, updatedAt: "t0" },
      ],
    };
    const result = applyMemberLadderScorePatch(tied, "z", {
      ladderScore: 50,
      updatedAt: "t1",
    });
    assert.equal(result.ok, true);
    assert.deepEqual(
      result.members.map((m) => m.uid),
      ["a", "b", "z"]
    );
  });

  it("score patch result does not rewrite membership metadata", () => {
    const result = applyMemberLadderScorePatch(baseGuild, "m1", {
      ladderScore: 12,
      updatedAt: "t1",
    });
    assert.equal(result.ok, true);
    assert.equal("memberUids" in result, false);
    assert.equal("memberCount" in result, false);
  });
});
