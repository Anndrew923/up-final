import { db } from "../shared/admin.js";
import { assertLadderUploadAllowed } from "../shared/ladderEntitlement.js";
import {
  checkFullSyncRateLimit,
  loadRateLimitDoc,
  recordFullSyncSuccess,
} from "./rateLimits.js";
import { runLadderSubmitShard, runLadderSyncPreview } from "./submitShardCore.js";
import {
  isValidShardId,
  tryNormalizeDisplayName,
  validateScore,
} from "./validate.js";
import { KNOWN_LEADERBOARD_SHARD_IDS } from "../shared/constants.js";
import {
  applyFailureReasonToTally,
  mapLadderShardSubmitError,
  recordLadderSyncFailure,
} from "./shardSubmitErrors.js";
import { coupleBatchTargetsWithOverall } from "./overallScore.js";

/** @typedef {{ metric: string, reason: string, message?: string }} LadderSyncShardFailure */

export function createEmptySummary() {
  return {
    attempted: 0,
    updated: 0,
    unchanged: 0,
    avatarPatched: 0,
    errors: 0,
    invalidInput: 0,
    internal: 0,
    rateLimited: 0,
    proRequired: 0,
  };
}

/**
 * @param {ReturnType<typeof createEmptySummary>} tally
 * @param {LadderSyncShardFailure[]} failures
 * @param {string} metric
 * @param {{ ok?: boolean, updated?: boolean, reason?: string }} result
 */
function shouldRecordSyncFailure(reason) {
  return (
    reason === "invalid-input" ||
    reason === "internal" ||
    reason === "unknown" ||
    reason === "anonymous"
  );
}

function applyShardResult(tally, failures, metric, result) {
  if (!result?.ok) {
    const reason = result?.reason ?? "internal";
    if (shouldRecordSyncFailure(reason)) {
      recordLadderSyncFailure(
        failures,
        metric,
        reason,
        reason === "invalid-input" ? "Shard rejected by server validation" : undefined
      );
    }
    applyFailureReasonToTally(tally, reason);
    return;
  }
  if (result.reason === "unchanged" || result.reason === "avatar-patched") {
    tally.unchanged += 1;
    if (result.avatarPatched || result.reason === "avatar-patched") {
      tally.avatarPatched += 1;
    }
    return;
  }
  if (result.updated) {
    tally.updated += 1;
  }
}

/**
 * WHY: Preview must stay in sync with batch profile/radar even without HTTPS avatar or unchanged scores.
 * Avatar is optional on `leaderboard_previews/{uid}`.
 * Keep in parity with client `batchSummaryWarrantsPreviewSync` in ladderBatchPostUploadPolicy.ts.
 */
export function shouldSyncBatchPreview(preview, tally) {
  if (!preview?.mergedScores || typeof preview.mergedScores !== "object") {
    return false;
  }
  if (tally.attempted <= 0) return false;
  return tally.updated > 0 || tally.avatarPatched > 0 || tally.unchanged > 0;
}

export function normalizeBatchTargets(targets) {
  if (!Array.isArray(targets) || targets.length > KNOWN_LEADERBOARD_SHARD_IDS.size) return null;
  const deduped = new Map();
  const malformed = [];
  for (const target of targets) {
    if (typeof target?.metric !== "string") {
      malformed.push(target);
      continue;
    }
    deduped.set(target.metric, target);
  }
  return [...malformed, ...deduped.values()];
}

async function reserveFullSyncQuota(uid, now) {
  return db.runTransaction(async (tx) => {
    const { ref, data } = await loadRateLimitDoc(uid, tx);
    const gate = checkFullSyncRateLimit(data, now);
    if (!gate.allowed) return gate;
    // Reserve before shard writes so concurrent requests cannot all pass the same quota snapshot.
    recordFullSyncSuccess(data, now);
    tx.set(ref, data, { merge: true });
    return gate;
  });
}

/**
 * Sequential multi-shard upload in one Callable (server-enforced full-sync cap when requested).
 * Returns per-shard `failures` so clients never collapse unknown errors into one bucket.
 */
export async function runLadderSyncBatch(request) {
  const uid = request.auth.uid;
  if (request.auth.token?.firebase?.sign_in_provider === "anonymous") {
    const err = new Error("anonymous");
    err.code = "anonymous";
    throw err;
  }

  await assertLadderUploadAllowed(uid);

  const data = request.data || {};
  const nameResult = tryNormalizeDisplayName(data.displayName);
  if (!nameResult.ok) {
    return {
      ok: false,
      reason: nameResult.reason,
      summary: createEmptySummary(),
      failures: [{ metric: "displayName", reason: nameResult.reason }],
    };
  }
  const batchDisplayName = nameResult.displayName;
  const preview = data.preview;
  let targets = Array.isArray(data.targets) ? data.targets : [];
  if (preview?.mergedScores) {
    targets = coupleBatchTargetsWithOverall(targets, preview.mergedScores);
  }
  targets = normalizeBatchTargets(targets);
  if (!targets) {
    return {
      ok: false,
      reason: "invalid-input",
      summary: createEmptySummary(),
      failures: [{ metric: "batch", reason: "invalid-input", message: "Too many targets" }],
    };
  }
  const fullSync = data.fullSync === true;
  const failures = /** @type {LadderSyncShardFailure[]} */ ([]);

  if (targets.length === 0) {
    return { ok: true, summary: createEmptySummary(), failures };
  }

  const now = new Date();

  if (fullSync) {
    const gate = await reserveFullSyncQuota(uid, now);
    if (!gate.allowed) {
      return {
        ok: false,
        reason: gate.reason,
        nextAllowedAt: gate.nextAllowedAt,
        summary: createEmptySummary(),
        failures,
      };
    }
  }

  const tally = createEmptySummary();

  for (const target of targets) {
    const metric = target?.metric;
    const score = Number(target?.score);
    const metricLabel = typeof metric === "string" ? metric : "unknown";

    if (!isValidShardId(metric)) {
      tally.attempted += 1;
      recordLadderSyncFailure(
        failures,
        metricLabel,
        "invalid-input",
        "Shard id is not in server KNOWN_LEADERBOARD_SHARD_IDS — redeploy functions"
      );
      applyFailureReasonToTally(tally, "invalid-input");
      continue;
    }

    if (!validateScore(metric, score)) {
      tally.attempted += 1;
      recordLadderSyncFailure(
        failures,
        metric,
        "invalid-input",
        "Score is outside the server-approved shard range"
      );
      applyFailureReasonToTally(tally, "invalid-input");
      continue;
    }

    tally.attempted += 1;
    const shardRequest = {
      auth: request.auth,
      data: {
        metric,
        score,
        displayName: batchDisplayName,
        avatarUrl: data.avatarUrl,
        profile: data.profile,
        skipPreviewUpdate: true,
      },
    };

    try {
      const result = await runLadderSubmitShard(shardRequest);
      applyShardResult(tally, failures, metric, result);
    } catch (err) {
      const mapped = mapLadderShardSubmitError(err);
      console.error("[ladderSyncBatch] shard error", {
        uid,
        metric,
        reason: mapped.reason,
        message: mapped.message,
      });
      if (shouldRecordSyncFailure(mapped.reason)) {
        recordLadderSyncFailure(failures, metric, mapped.reason, mapped.message);
      }
      applyFailureReasonToTally(tally, mapped.reason);
    }
  }

  if (shouldSyncBatchPreview(preview, tally)) {
    try {
      await runLadderSyncPreview({
        auth: request.auth,
        data: {
          displayName: batchDisplayName,
          avatarUrl: data.avatarUrl,
          profile: data.profile,
          mergedScores: preview.mergedScores,
        },
      });
    } catch (err) {
      console.error("[ladderSyncBatch] preview error", { uid, message: err?.message });
      recordLadderSyncFailure(
        failures,
        "preview",
        "internal",
        err?.message ?? "Full radar preview sync failed"
      );
    }
  }

  console.info("[ladderSyncBatch]", { uid, fullSync, tally, failureCount: failures.length });

  return { ok: true, summary: tally, failures };
}
