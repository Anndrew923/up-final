import { FieldValue } from "../shared/admin.js";
import { db } from "../shared/admin.js";
import {
  ENTRIES_SUBCOLLECTION,
  LEADERBOARDS_COLLECTION,
  LEADERBOARD_PREVIEWS_COLLECTION,
  LEADERBOARD_PREVIEW_SCHEMA_VERSION,
} from "../shared/constants.js";
import { assertLadderUploadAllowed } from "../shared/ladderEntitlement.js";
import {
  checkShardRateLimit,
  loadRateLimitDoc,
  recordShardWrite,
} from "./rateLimits.js";
import {
  buildFullRadarScoresMap,
  ladderPreviewProfileFields,
  resolvePreviewRadarMetric,
} from "./preview.js";
import { scoresEqualForLadderWrite } from "./scoreCompare.js";
import {
  isValidShardId,
  tryNormalizeDisplayName,
  sanitizeAvatarUrl,
  sanitizeProfile,
  validateScore,
} from "./validate.js";

function entryRef(metric, uid) {
  return db
    .collection(LEADERBOARDS_COLLECTION)
    .doc(metric)
    .collection(ENTRIES_SUBCOLLECTION)
    .doc(uid);
}

function previewRef(uid) {
  return db.collection(LEADERBOARD_PREVIEWS_COLLECTION).doc(uid);
}

export function buildEntryPayload({ displayName, score, profile, avatarUrl }) {
  const isAnonymous = profile?.isAnonymousInLadder === true;
  const payload = {
    displayName: isAnonymous ? "Anonymous" : displayName,
    scoreBest: score,
    updatedAt: new Date().toISOString(),
    isPro: true,
    ...ladderPreviewProfileFields(profile),
    isAnonymousInLadder: Boolean(isAnonymous),
  };
  if (isAnonymous) {
    payload.avatarUrl = FieldValue.delete();
  } else if (avatarUrl) {
    payload.avatarUrl = avatarUrl;
  } else {
    payload.avatarUrl = FieldValue.delete();
  }
  payload.displayRaw = FieldValue.delete();
  payload.displayRawUnit = FieldValue.delete();
  return payload;
}

/**
 * Single-shard ladder write with server rate limits (transaction).
 * Returns the same shape as client `SubmitLeaderboardResult`.
 */
export async function runLadderSubmitShard(request) {
  const uid = request.auth.uid;
  if (request.auth.token?.firebase?.sign_in_provider === "anonymous") {
    const err = new Error("anonymous");
    err.code = "anonymous";
    throw err;
  }

  await assertLadderUploadAllowed(uid);

  const data = request.data || {};
  const metric = data.metric;
  const score = Number(data.score);
  const nameResult = tryNormalizeDisplayName(data.displayName);
  if (!nameResult.ok) {
    return {
      ok: false,
      reason: nameResult.reason,
      updated: false,
      previousScore: null,
      submittedScore: null,
    };
  }
  const displayName = nameResult.displayName;
  const avatarUrl = sanitizeAvatarUrl(data.avatarUrl);
  const profile = sanitizeProfile(data.profile);
  const skipPreviewUpdate = data.skipPreviewUpdate === true;

  if (!isValidShardId(metric)) {
    return {
      ok: false,
      reason: "invalid-input",
      updated: false,
      previousScore: null,
      submittedScore: null,
    };
  }
  if (!validateScore(score)) {
    return {
      ok: false,
      reason: "invalid-input",
      updated: false,
      previousScore: null,
      submittedScore: null,
    };
  }

  const rateKey = `leaderboard:${metric}`;
  const now = new Date();
  const nowMs = now.getTime();

  const result = await db.runTransaction(async (tx) => {
    const { ref: rateRef, data: rateDoc } = await loadRateLimitDoc(uid, tx);
    const entrySnap = await tx.get(entryRef(metric, uid));

    const previousScore = entrySnap.exists
      ? Number(entrySnap.data()?.scoreBest)
      : null;

    if (
      previousScore != null &&
      Number.isFinite(previousScore) &&
      scoresEqualForLadderWrite(previousScore, score)
    ) {
      const quota = checkShardRateLimit(rateDoc, rateKey, nowMs);
      const storedAvatar = sanitizeAvatarUrl(entrySnap.data()?.avatarUrl);
      if (avatarUrl && avatarUrl !== storedAvatar && entrySnap.exists) {
        const payload = buildEntryPayload({ displayName, score, profile, avatarUrl });
        tx.set(entryRef(metric, uid), payload, { merge: true });
        return {
          outcome: "avatar-patched",
          previousScore,
          submittedScore: score,
          quota,
        };
      }
      return {
        outcome: "unchanged",
        previousScore,
        submittedScore: score,
        quota,
      };
    }

    const quotaBefore = checkShardRateLimit(rateDoc, rateKey, nowMs);
    if (!quotaBefore.allowed) {
      return {
        outcome: "rate-limited",
        previousScore: Number.isFinite(previousScore) ? previousScore : null,
        submittedScore: null,
        quota: quotaBefore,
      };
    }

    const payload = buildEntryPayload({ displayName, score, profile, avatarUrl });
    tx.set(entryRef(metric, uid), payload, { merge: true });
    const quotaAfter = recordShardWrite(rateDoc, rateKey, nowMs);
    tx.set(rateRef, rateDoc, { merge: true });

    const improved =
      previousScore != null && Number.isFinite(previousScore)
        ? score > previousScore
        : true;

    return {
      outcome: "updated",
      previousScore: Number.isFinite(previousScore) ? previousScore : null,
      submittedScore: score,
      improved,
      quota: quotaAfter,
    };
  });

  if (result.outcome === "unchanged" || result.outcome === "avatar-patched") {
    return {
      ok: true,
      reason: result.outcome === "avatar-patched" ? "avatar-patched" : "unchanged",
      updated: false,
      avatarPatched: result.outcome === "avatar-patched",
      previousScore: result.previousScore,
      submittedScore: result.submittedScore,
      improved: false,
      rateLimitRemaining: result.quota.remaining,
      rateLimitResetAt: result.quota.resetAt,
      limitPerHour: result.quota.limitPerHour,
    };
  }

  if (result.outcome === "rate-limited") {
    return {
      ok: false,
      reason: "rate-limited",
      updated: false,
      previousScore: result.previousScore,
      submittedScore: null,
      rateLimitRemaining: result.quota.remaining,
      rateLimitResetAt: result.quota.resetAt,
      limitPerHour: result.quota.limitPerHour,
    };
  }

  if (!skipPreviewUpdate) {
    await applyShardPreviewUpdate({
      uid,
      metric,
      score,
      displayName,
      avatarUrl,
      profile,
    });
  }

  console.info("[ladderSubmitShard]", {
    uid,
    metric,
    outcome: "updated",
    previousScore: result.previousScore,
    submittedScore: result.submittedScore,
  });

  return {
    ok: true,
    updated: true,
    previousScore: result.previousScore,
    submittedScore: result.submittedScore,
    improved: result.improved,
    rateLimitRemaining: result.quota.remaining,
    rateLimitResetAt: result.quota.resetAt,
    limitPerHour: result.quota.limitPerHour,
  };
}

async function applyShardPreviewUpdate({ uid, metric, score, displayName, avatarUrl, profile }) {
  const isAnonymous = profile?.isAnonymousInLadder === true;
  const previewMetric = resolvePreviewRadarMetric(metric);
  const nowIso = new Date().toISOString();
  const previewPayload = {
    uid,
    schemaVersion: LEADERBOARD_PREVIEW_SCHEMA_VERSION,
    displayName: isAnonymous ? "Anonymous" : displayName,
    updatedAt: nowIso,
    ...ladderPreviewProfileFields(profile),
    isAnonymousInLadder: isAnonymous,
  };

  if (isAnonymous) {
    previewPayload.avatarUrl = FieldValue.delete();
    previewPayload.radarScores = FieldValue.delete();
    previewPayload.radarUpdatedAt = FieldValue.delete();
  } else {
    previewPayload.avatarUrl = avatarUrl ? avatarUrl : FieldValue.delete();
    if (previewMetric) {
      previewPayload.radarScores = { [previewMetric]: score };
      previewPayload.radarUpdatedAt = nowIso;
    }
  }

  await previewRef(uid).set(previewPayload, { merge: true });
}

export async function runLadderSyncPreview(request) {
  const uid = request.auth.uid;
  if (request.auth.token?.firebase?.sign_in_provider === "anonymous") {
    const err = new Error("anonymous");
    err.code = "anonymous";
    throw err;
  }

  await assertLadderUploadAllowed(uid);

  const data = request.data || {};
  const previewNameResult = tryNormalizeDisplayName(data.displayName);
  if (!previewNameResult.ok) {
    return { ok: false, reason: previewNameResult.reason };
  }
  const displayName = previewNameResult.displayName;
  const avatarUrl = sanitizeAvatarUrl(data.avatarUrl);
  const profile = sanitizeProfile(data.profile);
  const mergedScores = data.mergedScores;
  if (!mergedScores || typeof mergedScores !== "object") {
    return { ok: false, reason: "invalid-input" };
  }

  const isAnonymous = profile?.isAnonymousInLadder === true;
  const nowIso = new Date().toISOString();
  const payload = {
    uid,
    schemaVersion: LEADERBOARD_PREVIEW_SCHEMA_VERSION,
    displayName: isAnonymous ? "Anonymous" : displayName,
    updatedAt: nowIso,
    ...ladderPreviewProfileFields(profile),
    isAnonymousInLadder: isAnonymous,
  };

  if (isAnonymous) {
    payload.avatarUrl = FieldValue.delete();
    payload.radarScores = FieldValue.delete();
    payload.radarUpdatedAt = FieldValue.delete();
  } else {
    payload.avatarUrl = avatarUrl ? avatarUrl : FieldValue.delete();
    payload.radarScores = buildFullRadarScoresMap(mergedScores);
    payload.radarUpdatedAt = nowIso;
  }

  await previewRef(uid).set(payload, { merge: true });
  console.info("[ladderSyncPreview]", { uid, outcome: "ok" });
  return { ok: true };
}
