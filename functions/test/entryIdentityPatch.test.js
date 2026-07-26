import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveScoreEqualEntryPatch } from "../ladder/entryIdentityPatch.js";

describe("resolveScoreEqualEntryPatch", () => {
  it("detects displayName drift on score-equal shards", () => {
    const patch = resolveScoreEqualEntryPatch(
      { displayName: "OldPilot", isAnonymousInLadder: false, avatarUrl: null },
      { displayName: "NewPilot", profile: { isAnonymousInLadder: false }, avatarUrl: null }
    );
    assert.equal(patch.needsPatch, true);
    assert.equal(patch.identityChanged, true);
    assert.equal(patch.avatarChanged, false);
  });

  it("detects anonymous flag drift", () => {
    const patch = resolveScoreEqualEntryPatch(
      { displayName: "Pilot", isAnonymousInLadder: false },
      { displayName: "Pilot", profile: { isAnonymousInLadder: true }, avatarUrl: "https://x/a.jpg" }
    );
    assert.equal(patch.needsPatch, true);
    assert.equal(patch.identityChanged, true);
    assert.equal(patch.avatarChanged, true);
  });

  it("detects avatar URL drift", () => {
    const patch = resolveScoreEqualEntryPatch(
      {
        displayName: "Pilot",
        isAnonymousInLadder: false,
        avatarUrl: "https://old/a.jpg",
      },
      {
        displayName: "Pilot",
        profile: { isAnonymousInLadder: false },
        avatarUrl: "https://new/a.jpg",
      }
    );
    assert.equal(patch.needsPatch, true);
    assert.equal(patch.identityChanged, false);
    assert.equal(patch.avatarChanged, true);
  });

  it("returns no patch when identity and avatar match", () => {
    const patch = resolveScoreEqualEntryPatch(
      {
        displayName: "Pilot",
        isAnonymousInLadder: false,
        avatarUrl: "https://cdn/a.jpg",
      },
      {
        displayName: "Pilot",
        profile: { isAnonymousInLadder: false },
        avatarUrl: "https://cdn/a.jpg",
      }
    );
    assert.equal(patch.needsPatch, false);
  });
});
