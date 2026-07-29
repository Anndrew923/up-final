import { FieldPath } from "firebase-admin/firestore";
import { FieldValue, db } from "../shared/admin.js";
import { assertAdmin } from "../shared/assertAdmin.js";
import {
  ADMIN_ACTIONS_COLLECTION,
  KNOWN_LEADERBOARD_SHARD_IDS,
  LEADERBOARD_PREVIEWS_COLLECTION,
  LEADERBOARDS_COLLECTION,
  ENTRIES_SUBCOLLECTION,
} from "../shared/constants.js";
import { LADDER_REPORTS_COLLECTION } from "./reportUserCore.js";
export const DEFAULT_ADMIN_REPORTS_LIMIT = 20;
export const MAX_ADMIN_REPORTS_LIMIT = 50;
export const VALID_REPORT_TYPES = new Set(["nickname", "avatar", "both"]);

const VALID_ACTIONS = new Set(["APPROVE", "REJECT"]);

/**
 * @param {unknown} raw
 * @returns {{ ok: true, limit: number, cursor: { createdAt: string, id: string } | null } | { ok: false, code: string, message: string }}
 */
export function validateListReportsInput(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  let limit = DEFAULT_ADMIN_REPORTS_LIMIT;
  if (data.limit != null) {
    const n = Number(data.limit);
    if (!Number.isFinite(n) || n < 1) {
      return { ok: false, code: "invalid-argument", message: "invalid limit" };
    }
    limit = Math.min(MAX_ADMIN_REPORTS_LIMIT, Math.floor(n));
  }

  let cursor = null;
  if (data.cursor != null) {
    if (typeof data.cursor !== "object" || data.cursor === null) {
      return { ok: false, code: "invalid-argument", message: "invalid cursor" };
    }
    const createdAt =
      typeof data.cursor.createdAt === "string" ? data.cursor.createdAt.trim() : "";
    const id = typeof data.cursor.id === "string" ? data.cursor.id.trim() : "";
    if (!createdAt || !id) {
      return { ok: false, code: "invalid-argument", message: "invalid cursor" };
    }
    cursor = { createdAt, id };
  }

  return { ok: true, limit, cursor };
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, reportId: string, action: 'APPROVE' | 'REJECT', notes: string } | { ok: false, code: string, message: string }}
 */
export function validateProcessReportInput(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  const reportId = typeof data.reportId === "string" ? data.reportId.trim() : "";
  const action = typeof data.action === "string" ? data.action.trim().toUpperCase() : "";
  const notes = typeof data.notes === "string" ? data.notes.trim().slice(0, 500) : "";

  if (!reportId || reportId.includes("/")) {
    return { ok: false, code: "invalid-argument", message: "reportId required" };
  }
  if (!VALID_ACTIONS.has(action)) {
    return { ok: false, code: "invalid-argument", message: "invalid action" };
  }
  return { ok: true, reportId, action, notes };
}

/**
 * @param {unknown} type
 * @returns {'nickname' | 'avatar' | 'both' | null}
 */
export function normalizeReportType(type) {
  if (typeof type !== "string") return null;
  const trimmed = type.trim();
  return VALID_REPORT_TYPES.has(trimmed) ? trimmed : null;
}

/**
 * Build public-identity sanitize patch from report type.
 * WHY: Mirror anonymous ladder semantics — nickname → Anonymous + lock flag;
 * avatar → FieldValue.delete(). Also set isAnonymousInLadder when nickname cleared.
 */
export function buildIdentitySanitizeFields(type) {
  const normalized = normalizeReportType(type);
  if (!normalized) {
    return { fields: null, clearNickname: false, clearAvatar: false, ok: false };
  }
  const clearNickname = normalized === "nickname" || normalized === "both";
  const clearAvatar = normalized === "avatar" || normalized === "both";
  const fields = {
    updatedAt: new Date().toISOString(),
  };
  if (clearNickname) {
    fields.displayName = "Anonymous";
    // WHY: Only force anonymous flag when avatar is also sanctioned — otherwise a
    // nickname-only reset would wipe a valid avatar via buildEntryPayload.
    if (clearAvatar) {
      fields.isAnonymousInLadder = true;
    }
  }
  if (clearAvatar) {
    fields.avatarUrl = FieldValue.delete();
  }
  return { fields, clearNickname, clearAvatar, ok: true };
}

async function loadIdentitySnapshot(uid) {
  const previewSnap = await db.collection(LEADERBOARD_PREVIEWS_COLLECTION).doc(uid).get();
  if (!previewSnap.exists) {
    return { displayName: null, avatarUrl: null };
  }
  const data = previewSnap.data() || {};
  return {
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
  };
}

/**
 * Sanitize target identity across preview + shards + user root + Pro baseline.
 */
export async function sanitizeLadderIdentityForReport({ targetUid, type, reportId, adminUid }) {
  const built = buildIdentitySanitizeFields(type);
  if (!built.ok || !built.fields) {
    const err = new Error("invalid report type");
    err.code = "failed-precondition";
    throw err;
  }
  const { fields, clearNickname, clearAvatar } = built;
  const nowIso = fields.updatedAt;
  let shardsTouched = 0;

  const previewRef = db.collection(LEADERBOARD_PREVIEWS_COLLECTION).doc(targetUid);
  const entryRefs = [];
  for (const metric of KNOWN_LEADERBOARD_SHARD_IDS) {
    entryRefs.push(
      db
        .collection(LEADERBOARDS_COLLECTION)
        .doc(metric)
        .collection(ENTRIES_SUBCOLLECTION)
        .doc(targetUid)
    );
  }

  const snaps = await db.getAll(previewRef, ...entryRefs);
  const previewSnap = snaps[0];
  const batch = db.batch();
  let batchOps = 0;

  if (previewSnap.exists) {
    batch.set(previewRef, fields, { merge: true });
    batchOps += 1;
  }

  for (let i = 0; i < entryRefs.length; i += 1) {
    const entrySnap = snaps[i + 1];
    if (!entrySnap?.exists) continue;
    batch.set(entryRefs[i], fields, { merge: true });
    shardsTouched += 1;
    batchOps += 1;
  }

  // WHY: Permanent lock until ops clear it — otherwise next client sync resurrects UGC.
  const userPatch = {
    updatedAt: nowIso,
    moderationStatus: "sanitized",
    moderationReason: `ladder_report:${reportId}`,
    moderationAt: nowIso,
    moderationBy: adminUid,
    ladderIdentityLock: {
      lockNickname: clearNickname,
      lockAvatar: clearAvatar,
      reportId,
      lockedAt: nowIso,
      lockedBy: adminUid,
    },
  };
  if (clearNickname) {
    userPatch.displayName = FieldValue.delete();
    userPatch.nickname = FieldValue.delete();
  }
  if (clearAvatar) {
    userPatch.avatarUrl = FieldValue.delete();
  }
  batch.set(db.collection("users").doc(targetUid), userPatch, { merge: true });
  batchOps += 1;

  const baselineRef = db
    .collection("users")
    .doc(targetUid)
    .collection("profile")
    .doc("baseline");
  const baselineSnap = await baselineRef.get();
  if (baselineSnap.exists) {
    const baselinePatch = { updatedAt: nowIso };
    if (clearNickname) {
      baselinePatch["ladderProfile.displayName"] = FieldValue.delete();
    }
    if (clearAvatar) {
      baselinePatch["ladderProfile.avatarUrl"] = FieldValue.delete();
    }
    batch.set(baselineRef, baselinePatch, { merge: true });
    batchOps += 1;
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  return { sanitized: true, shardsTouched, clearNickname, clearAvatar };
}

/**
 * Atomically claim a pending report so concurrent admins cannot double-process.
 * @returns {Promise<{ claimed: true, reportData: object } | { claimed: false, reason: string }>}
 */
export async function claimPendingReport({ reportRef, adminUid, action, notes, nowIso }) {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(reportRef);
    if (!snap.exists) {
      return { claimed: false, reason: "not-found" };
    }
    const reportData = snap.data() || {};
    if (reportData.status !== "pending") {
      return { claimed: false, reason: "already-processed" };
    }

    const nextStatus = action === "REJECT" ? "dismissed" : "processing";
    tx.set(
      reportRef,
      {
        status: nextStatus,
        reviewedAt: nowIso,
        reviewedBy: adminUid,
        notes,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    return { claimed: true, reportData };
  });
}

export async function runGetAdminLadderReports(request) {
  await assertAdmin(request.auth?.uid, request.auth);

  const validated = validateListReportsInput(request.data);
  if (!validated.ok) {
    const err = new Error(validated.message);
    err.code = validated.code;
    throw err;
  }

  let query = db
    .collection(LADDER_REPORTS_COLLECTION)
    .where("status", "==", "pending")
    .orderBy("createdAt", "asc")
    .orderBy(FieldPath.documentId(), "asc")
    .limit(validated.limit);

  if (validated.cursor) {
    query = query.startAfter(validated.cursor.createdAt, validated.cursor.id);
  }

  const snapshot = await query.get();
  const reports = [];

  const identityUids = new Set();
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() || {};
    if (typeof data.targetUid === "string" && data.targetUid) identityUids.add(data.targetUid);
    if (typeof data.reporterUid === "string" && data.reporterUid) {
      identityUids.add(data.reporterUid);
    }
  }

  const identityMap = new Map();
  await Promise.all(
    [...identityUids].map(async (uid) => {
      identityMap.set(uid, await loadIdentitySnapshot(uid));
    })
  );

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() || {};
    const targetUid = typeof data.targetUid === "string" ? data.targetUid : "";
    const reporterUid = typeof data.reporterUid === "string" ? data.reporterUid : "";
    const target = targetUid ? identityMap.get(targetUid) ?? null : null;
    const reporter = reporterUid ? identityMap.get(reporterUid) ?? null : null;
    const type = normalizeReportType(data.type) ?? "both";

    reports.push({
      id: docSnap.id,
      reporterUid,
      targetUid,
      type,
      status: data.status ?? "pending",
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
      target,
      reporter: reporter
        ? { displayName: reporter.displayName }
        : { displayName: null },
    });
  }

  const last = snapshot.docs[snapshot.docs.length - 1];
  const nextCursor =
    snapshot.size >= validated.limit && last
      ? {
          createdAt: last.data()?.createdAt ?? "",
          id: last.id,
        }
      : null;

  return { ok: true, reports, nextCursor };
}

export async function runProcessLadderReport(request) {
  const adminUid = request.auth?.uid;
  await assertAdmin(adminUid, request.auth);

  const validated = validateProcessReportInput(request.data);
  if (!validated.ok) {
    const err = new Error(validated.message);
    err.code = validated.code;
    throw err;
  }

  const { reportId, action, notes } = validated;
  const reportRef = db.collection(LADDER_REPORTS_COLLECTION).doc(reportId);
  const nowIso = new Date().toISOString();

  const claim = await claimPendingReport({
    reportRef,
    adminUid,
    action,
    notes,
    nowIso,
  });

  if (!claim.claimed) {
    const err = new Error(
      claim.reason === "not-found" ? "report not found" : "report already processed"
    );
    err.code = claim.reason === "not-found" ? "not-found" : "failed-precondition";
    throw err;
  }

  const reportData = claim.reportData;
  const targetUid = typeof reportData.targetUid === "string" ? reportData.targetUid : "";
  const reportType = normalizeReportType(reportData.type);

  if (action === "REJECT") {
    await db.collection(ADMIN_ACTIONS_COLLECTION).add({
      adminId: adminUid,
      action: "reject_report",
      targetUserId: targetUid || null,
      details: { reportId, reportType: reportData.type ?? null, notes },
      timestamp: nowIso,
    });
    return { ok: true, status: "dismissed", sanitized: false };
  }

  if (!reportType) {
    await reportRef.set(
      {
        status: "pending",
        updatedAt: new Date().toISOString(),
        processError: "invalid-report-type",
      },
      { merge: true }
    );
    const err = new Error("invalid report type");
    err.code = "failed-precondition";
    throw err;
  }

  if (!targetUid) {
    await reportRef.set(
      {
        status: "pending",
        updatedAt: new Date().toISOString(),
        processError: "missing-target",
      },
      { merge: true }
    );
    const err = new Error("report missing targetUid");
    err.code = "failed-precondition";
    throw err;
  }

  let sanitizeResult;
  try {
    sanitizeResult = await sanitizeLadderIdentityForReport({
      targetUid,
      type: reportType,
      reportId,
      adminUid,
    });
  } catch (sanitizeErr) {
    await reportRef.set(
      {
        status: "pending",
        updatedAt: new Date().toISOString(),
        processError: sanitizeErr?.message || "sanitize-failed",
      },
      { merge: true }
    );
    throw sanitizeErr;
  }

  const resolvedAt = new Date().toISOString();
  await reportRef.set(
    {
      status: "resolved",
      reviewedAt: resolvedAt,
      reviewedBy: adminUid,
      notes,
      updatedAt: resolvedAt,
      sanitized: true,
      processError: FieldValue.delete(),
    },
    { merge: true }
  );

  await db.collection(ADMIN_ACTIONS_COLLECTION).add({
    adminId: adminUid,
    action: "approve_report",
    targetUserId: targetUid,
    details: {
      reportId,
      reportType,
      notes,
      shardsTouched: sanitizeResult.shardsTouched ?? 0,
      clearNickname: Boolean(sanitizeResult.clearNickname),
      clearAvatar: Boolean(sanitizeResult.clearAvatar),
    },
    timestamp: resolvedAt,
  });

  return {
    ok: true,
    status: "resolved",
    sanitized: true,
    shardsTouched: sanitizeResult.shardsTouched ?? 0,
  };
}
