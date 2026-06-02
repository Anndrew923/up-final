import { db } from "../shared/admin.js";
import { assertLadderUploadAllowed } from "../shared/ladderEntitlement.js";
import {
  checkFullSyncRateLimit,
  loadRateLimitDoc,
  recordFullSyncSuccess,
} from "./rateLimits.js";
import {
  buildEntryPayload,
  runLadderSubmitShard,
  runLadderSyncPreview,
} from "./submitShardCore.js";
import {
  isValidShardId,
  normalizeDisplayName,
  sanitizeAvatarUrl,
  sanitizeProfile,
  validateScore,
} from "./validate.js";
import {
  ENTRIES_SUBCOLLECTION,
  LEADERBOARDS_COLLECTION,
} from "../shared/constants.js";
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
 * Patches portrait on shards the user can see but did not upload this batch (e.g. `ladderScore`).
 * WHY: Assessment page sync may only target `bodyFat_ffmi` while the ladder UI shows the overall board.
 */
async function propagateAvatarToExtraShards(uid, data, targets, tally, failures) {
  const avatarUrl = sanitizeAvatarUrl(data.avatarUrl);
  if (!avatarUrl) return;

  const extra =
    Array.isArray(data.propagateAvatarShards) && data.propagateAvatarShards.length > 0
      ? data.propagateAvatarShards
      : ["ladderScore"];

  const batchMetrics = new Set(
    targets
      .map((t) => t?.metric)
      .filter((m) => typeof m === "string" && isValidShardId(m))
  );

  const seen = new Set();
  for (const metric of extra) {
    if (!metric || seen.has(metric) || !isValidShardId(metric)) continue;
    if (batchMetrics.has(metric)) continue;
    seen.add(metric);

    const ref = db
      .collection(LEADERBOARDS_COLLECTION)
      .doc(metric)
      .collection(ENTRIES_SUBCOLLECTION)
      .doc(uid);
    let snap;
    try {
      snap = await ref.get();
    } catch (err) {
      recordLadderSyncFailure(
        failures,
        metric,
        "internal",
        err?.message ?? "Avatar propagate read failed"
      );
      continue;
    }
    if (!snap.exists) continue;

    const score = Number(snap.data()?.scoreBest);
    if (!validateScore(score)) continue;

    const storedAvatar = sanitizeAvatarUrl(snap.data()?.avatarUrl);
    if (storedAvatar === avatarUrl) continue;

    try {
      const payload = buildEntryPayload({
        displayName: normalizeDisplayName(data.displayName),
        score,
        profile: sanitizeProfile(data.profile),
        avatarUrl,
      });
      await ref.set(payload, { merge: true });
      tally.avatarPatched += 1;
    } catch (err) {
      recordLadderSyncFailure(
        failures,
        metric,
        "internal",
        err?.message ?? "Avatar propagate write failed"
      );
    }
  }
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

  await assertLadderUploadAllowed(uid, request.auth.token);

  const data = request.data || {};
  const preview = data.preview;
  let targets = Array.isArray(data.targets) ? data.targets : [];
  if (preview?.mergedScores) {
    targets = coupleBatchTargetsWithOverall(targets, preview.mergedScores);
  }
  const fullSync = data.fullSync === true;
  const failures = /** @type {LadderSyncShardFailure[]} */ ([]);

  if (targets.length === 0) {
    return { ok: true, summary: createEmptySummary(), failures };
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

    if (!validateScore(score)) {
      tally.attempted += 1;
      recordLadderSyncFailure(failures, metric, "invalid-input", "Score must be a finite number >= 0");
      applyFailureReasonToTally(tally, "invalid-input");
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

  await propagateAvatarToExtraShards(uid, data, targets, tally, failures);

  const shouldSyncPreview =
    preview?.mergedScores &&
    sanitizeAvatarUrl(data.avatarUrl) &&
    (tally.updated > 0 || tally.avatarPatched > 0);

  if (shouldSyncPreview) {
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
      recordLadderSyncFailure(
        failures,
        "preview",
        "internal",
        err?.message ?? "Full radar preview sync failed"
      );
    }
  }

  if (fullSync && tally.updated > 0) {
    await db.runTransaction(async (tx) => {
      const { ref: rateRef, data: rateDoc } = await loadRateLimitDoc(uid, tx);
      recordFullSyncSuccess(rateDoc, now);
      tx.set(rateRef, rateDoc, { merge: true });
    });
  }

  console.info("[ladderSyncBatch]", { uid, fullSync, tally, failureCount: failures.length });

  return { ok: true, summary: tally, failures };
}
