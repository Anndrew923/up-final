import { db } from "../shared/admin.js";
import { assertLadderUploadAllowed } from "../shared/ladderEntitlement.js";
import {
  checkFullSyncRateLimit,
  loadRateLimitDoc,
  recordFullSyncSuccess,
} from "./rateLimits.js";
import { runLadderSubmitShard, runLadderSyncPreview } from "./submitShardCore.js";
import { isValidShardId, validateScore } from "./validate.js";

function createEmptySummary() {
  return {
    attempted: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    rateLimited: 0,
    proRequired: 0,
  };
}

function applyResult(tally, result) {
  if (!result?.ok) {
    if (result?.reason === "rate-limited") tally.rateLimited += 1;
    else if (result?.reason === "pro-required") tally.proRequired += 1;
    else tally.errors += 1;
    return;
  }
  if (result.reason === "unchanged") tally.unchanged += 1;
  else if (result.updated) tally.updated += 1;
}

/**
 * Sequential multi-shard upload in one Callable (server-enforced full-sync cap when requested).
 */
export async function runLadderSyncBatch(request) {
  const uid = request.auth.uid;
  if (request.auth.token?.firebase?.sign_in_provider === "anonymous") {
    const err = new Error("anonymous");
    err.code = "anonymous";
    throw err;
  }

  await assertLadderUploadAllowed(uid, request.auth.token);

  const data = request.data || {};
  const targets = Array.isArray(data.targets) ? data.targets : [];
  const fullSync = data.fullSync === true;
  const preview = data.preview;

  if (targets.length === 0) {
    return { ok: true, summary: createEmptySummary() };
  }

  const now = new Date();

  if (fullSync) {
    const { data: rateDoc } = await loadRateLimitDoc(uid);
    const gate = checkFullSyncRateLimit(rateDoc, now);
    if (!gate.allowed) {
      return {
        ok: false,
        reason: gate.reason,
        nextAllowedAt: gate.nextAllowedAt,
        summary: createEmptySummary(),
      };
    }
  }

  const tally = createEmptySummary();

  for (const target of targets) {
    const metric = target?.metric;
    const score = Number(target?.score);
    if (!isValidShardId(metric) || !validateScore(score)) {
      tally.attempted += 1;
      tally.errors += 1;
      continue;
    }

    tally.attempted += 1;
    const shardRequest = {
      auth: request.auth,
      data: {
        metric,
        score,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        profile: data.profile,
        skipPreviewUpdate: true,
      },
    };

    try {
      const result = await runLadderSubmitShard(shardRequest);
      applyResult(tally, result);
    } catch (err) {
      console.error("[ladderSyncBatch] shard error", { uid, metric, message: err?.message });
      tally.errors += 1;
    }
  }

  if (preview?.mergedScores && tally.updated > 0) {
    try {
      await runLadderSyncPreview({
        auth: request.auth,
        data: {
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          profile: data.profile,
          mergedScores: preview.mergedScores,
        },
      });
    } catch (err) {
      console.error("[ladderSyncBatch] preview error", { uid, message: err?.message });
    }
  }

  if (fullSync && tally.updated > 0) {
    await db.runTransaction(async (tx) => {
      const { ref: rateRef, data: rateDoc } = await loadRateLimitDoc(uid, tx);
      recordFullSyncSuccess(rateDoc, now);
      tx.set(rateRef, rateDoc, { merge: true });
    });
  }

  console.info("[ladderSyncBatch]", { uid, fullSync, tally });

  return { ok: true, summary: tally };
}
