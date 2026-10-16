/**
 * Withdraw public presence — pure plan predicates (no Firestore).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { erasureLeaderboardShardIds } from "../shared/constants.js";
import { buildWithdrawPublicPresencePlan } from "../ladder/withdrawPublicPresenceCallable.js";

describe("buildWithdrawPublicPresencePlan", () => {
  it("covers known + orphan shards and preview, never guilds", () => {
    const plan = buildWithdrawPublicPresencePlan();
    assert.equal(plan.previewCollection, "leaderboard_previews");
    assert.equal(plan.clearsGuildMembers, false);
    assert.equal(plan.clearRateLimits, false);
    assert.equal(plan.clearAvatarStorage, true);
    assert.ok(plan.shardIds.includes("ladderScore"));
    assert.ok(plan.shardIds.includes("armSize"));
    assert.ok(plan.shardIds.includes("totalLoginDays"));
    assert.deepEqual(plan.shardIds, erasureLeaderboardShardIds());
  });

  it("does not list guild collections", () => {
    const plan = buildWithdrawPublicPresencePlan();
    const joined = plan.shardIds.join("|") + plan.previewCollection;
    assert.equal(joined.includes("guild"), false);
  });
});
