import { db } from "../shared/admin.js";
import {
  LADDER_REPORT_ROLLING_MS,
  LEADERBOARD_PREVIEWS_COLLECTION,
} from "../shared/constants.js";
import { assertLadderReportAllowed } from "../shared/ladderEntitlement.js";
import {
  checkReporterReportsRollingCap,
  loadRateLimitDoc,
  recordReporterReportRoll,
} from "./rateLimits.js";

export const LADDER_REPORTS_COLLECTION = "ladder_reports";
export const REPORT_DEDUPE_MS = LADDER_REPORT_ROLLING_MS;

const VALID_REPORT_TYPES = new Set(["nickname", "avatar", "both"]);
export const LADDER_REPORT_TARGET_UID_MAX = 128;

export function buildReportDocId(reporterUid, targetUid) {
  return `${reporterUid}_${targetUid}`;
}

export function isValidReportTargetUid(targetUid) {
  if (!targetUid || typeof targetUid !== "string") return false;
  if (targetUid.length > LADDER_REPORT_TARGET_UID_MAX) return false;
  if (targetUid.includes("/")) return false;
  return true;
}

export function validateReportPayload(data) {
  const targetUid = typeof data?.targetUid === "string" ? data.targetUid.trim() : "";
  const type = typeof data?.type === "string" ? data.type.trim() : "";
  if (!targetUid) {
    return { ok: false, code: "invalid-argument", message: "targetUid required" };
  }
  if (!isValidReportTargetUid(targetUid)) {
    return { ok: false, code: "invalid-argument", message: "invalid targetUid" };
  }
  if (!VALID_REPORT_TYPES.has(type)) {
    return { ok: false, code: "invalid-argument", message: "invalid report type" };
  }
  return { ok: true, targetUid, type };
}

/**
 * True when `createdAt` is older than the rolling dedupe window (new report slot allowed).
 */
export function isReportAllowedWithinWindow(existingCreatedAtIso, nowMs = Date.now()) {
  if (!existingCreatedAtIso) return true;
  const createdMs = new Date(existingCreatedAtIso).getTime();
  if (!Number.isFinite(createdMs)) return true;
  return nowMs - createdMs >= REPORT_DEDUPE_MS;
}

/**
 * @returns {{ mode: 'merge' | 'new', consumesQuota: boolean, preserveCreatedAt: string | null }}
 */
export function resolveReportWritePlan(existingCreatedAtIso, nowMs = Date.now()) {
  if (!existingCreatedAtIso) {
    return { mode: "new", consumesQuota: true, preserveCreatedAt: null };
  }
  if (!isReportAllowedWithinWindow(existingCreatedAtIso, nowMs)) {
    return {
      mode: "merge",
      consumesQuota: false,
      preserveCreatedAt: existingCreatedAtIso,
    };
  }
  return { mode: "new", consumesQuota: true, preserveCreatedAt: null };
}

export function buildReportPayload({
  reporterUid,
  targetUid,
  type,
  plan,
  nowIso,
  preserveCreatedAt,
}) {
  const createdAt =
    plan.mode === "merge" && preserveCreatedAt ? preserveCreatedAt : nowIso;
  return {
    reporterUid,
    targetUid,
    type,
    status: "pending",
    createdAt,
    updatedAt: nowIso,
  };
}

/**
 * Callable core — `ladder_reports` + `ladder_rate_limits.reportsRolling` via transaction.
 */
export async function runLadderReportUser(request) {
  if (!request.auth?.uid) {
    const err = new Error("unauthenticated");
    err.code = "unauthenticated";
    throw err;
  }

  if (request.auth.token?.firebase?.sign_in_provider === "anonymous") {
    const err = new Error("anonymous");
    err.code = "permission-denied";
    throw err;
  }

  const reporterUid = request.auth.uid;
  await assertLadderReportAllowed(reporterUid);

  const validated = validateReportPayload(request.data || {});
  if (!validated.ok) {
    const err = new Error(validated.message);
    err.code = validated.code;
    throw err;
  }

  const { targetUid, type } = validated;

  if (targetUid === reporterUid) {
    const err = new Error("cannot report self");
    err.code = "invalid-argument";
    throw err;
  }

  const previewSnap = await db
    .collection(LEADERBOARD_PREVIEWS_COLLECTION)
    .doc(targetUid)
    .get();
  if (!previewSnap.exists) {
    const err = new Error("target not on ladder");
    err.code = "not-found";
    throw err;
  }

  const docId = buildReportDocId(reporterUid, targetUid);
  const reportRef = db.collection(LADDER_REPORTS_COLLECTION).doc(docId);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  return db.runTransaction(async (tx) => {
    const { ref: rateRef, data: rateDoc } = await loadRateLimitDoc(reporterUid, tx);
    const reportSnap = await tx.get(reportRef);
    const existingCreatedAt = reportSnap.exists ? reportSnap.data()?.createdAt : null;
    const plan = resolveReportWritePlan(existingCreatedAt, nowMs);

    if (plan.consumesQuota) {
      const cap = checkReporterReportsRollingCap(rateDoc, nowMs);
      if (!cap.allowed) {
        const err = new Error("report rolling cap exceeded");
        err.code = "resource-exhausted";
        throw err;
      }
      recordReporterReportRoll(rateDoc, nowMs);
    }

    const payload = buildReportPayload({
      reporterUid,
      targetUid,
      type,
      plan,
      nowIso,
      preserveCreatedAt: plan.preserveCreatedAt,
    });

    tx.set(reportRef, payload);
    tx.set(rateRef, rateDoc, { merge: true });

    return {
      ok: true,
      reportId: docId,
      merged: plan.mode === "merge",
    };
  });
}
