import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEntryPayload } from "../ladder/submitShardCore.js";

describe("buildEntryPayload isPro denormalization", () => {
  it("writes isPro false for genesis free uploaders", () => {
    const payload = buildEntryPayload({
      displayName: "Pilot",
      score: 88,
      profile: { gender: "male" },
      avatarUrl: null,
      isPro: false,
    });
    assert.equal(payload.isPro, false);
    assert.equal(payload.displayName, "Pilot");
  });

  it("writes isPro true only when gate reports active Pro", () => {
    const payload = buildEntryPayload({
      displayName: "ProPilot",
      score: 99,
      profile: null,
      avatarUrl: "https://example.com/a.jpg",
      isPro: true,
    });
    assert.equal(payload.isPro, true);
    assert.equal(payload.avatarUrl, "https://example.com/a.jpg");
  });

  it("never coerces missing isPro to true", () => {
    const payload = buildEntryPayload({
      displayName: "X",
      score: 1,
      profile: null,
      avatarUrl: null,
    });
    assert.equal(payload.isPro, false);
  });

  it("keeps gate isPro when profile accidentally includes isPro", () => {
    const payload = buildEntryPayload({
      displayName: "X",
      score: 1,
      profile: { isPro: true },
      avatarUrl: null,
      isPro: false,
    });
    assert.equal(payload.isPro, false);
  });
});
