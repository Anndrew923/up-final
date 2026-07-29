import { getAuth } from "firebase-admin/auth";
import { FieldValue, db } from "../shared/admin.js";
import { assertAdmin } from "../shared/assertAdmin.js";
import {
  ADMIN_ACTIONS_COLLECTION,
  LEADERBOARD_PREVIEWS_COLLECTION,
} from "../shared/constants.js";
import { calculateSixAxisOverallFromMerged } from "./overallScore.js";
import {
  deleteAuthAndCloudUser,
  deleteLadderPublicData,
  deleteUserCloudData,
} from "../account/userCloudDeletion.js";

export { ADMIN_ACTIONS_COLLECTION };
export const CONFIRM_REMOVE_FROM_LADDER = "REMOVE";
export const CONFIRM_DELETE_ACCOUNT = "DELETE";

/**
 * @param {unknown} raw
 * @returns {{ ok: true, query: string } | { ok: false, code: string, message: string }}
 */
export function validateLookupInput(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  const query = typeof data.query === "string" ? data.query.trim() : "";
  if (!query || query.length > 320) {
    return { ok: false, code: "invalid-argument", message: "query required" };
  }
  return { ok: true, query };
}

/**
 * @param {unknown} raw
 * @param {string} expectedPhrase
 */
export function validateTargetConfirmInput(raw, expectedPhrase) {
  const data = raw && typeof raw === "object" ? raw : {};
  const targetUid = typeof data.targetUid === "string" ? data.targetUid.trim() : "";
  const confirmPhrase =
    typeof data.confirmPhrase === "string" ? data.confirmPhrase.trim() : "";
  if (!targetUid || targetUid.includes("/")) {
    return { ok: false, code: "invalid-argument", message: "targetUid required" };
  }
  if (confirmPhrase !== expectedPhrase) {
    return {
      ok: false,
      code: "invalid-argument",
      message: `confirmPhrase must be ${expectedPhrase}`,
    };
  }
  return { ok: true, targetUid, confirmPhrase };
}

function looksLikeEmail(value) {
  return value.includes("@") && !value.includes("/");
}

async function resolveUidFromQuery(query) {
  if (looksLikeEmail(query)) {
    try {
      const user = await getAuth().getUserByEmail(query.toLowerCase());
      return { uid: user.uid, email: user.email || query.toLowerCase(), authExists: true };
    } catch (err) {
      if (err?.code === "auth/user-not-found") {
        const e = new Error("user not found");
        e.code = "not-found";
        throw e;
      }
      throw err;
    }
  }

  try {
    const user = await getAuth().getUser(query);
    return {
      uid: user.uid,
      email: user.email || null,
      authExists: true,
    };
  } catch (err) {
    if (err?.code === "auth/user-not-found") {
      // Orphan ladder row may still exist without Auth.
      return { uid: query, email: null, authExists: false };
    }
    throw err;
  }
}

export function buildLookupOverallScore(radarScores) {
  if (!radarScores || typeof radarScores !== "object") return null;
  const overall = calculateSixAxisOverallFromMerged(radarScores);
  return overall > 0 ? overall : null;
}

async function loadLadderSnapshot(uid) {
  const previewSnap = await db.collection(LEADERBOARD_PREVIEWS_COLLECTION).doc(uid).get();
  if (!previewSnap.exists) {
    return { onLadder: false, displayName: null, avatarUrl: null, overallScore: null };
  }
  const data = previewSnap.data() || {};
  return {
    onLadder: true,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
    overallScore: buildLookupOverallScore(data.radarScores),
  };
}

async function loadUserAdminFlag(uid) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return { userDocExists: false, isAdmin: false };
  return { userDocExists: true, isAdmin: snap.data()?.isAdmin === true };
}

export async function runLookupAdminLadderUser(request) {
  await assertAdmin(request.auth?.uid, request.auth);
  const validated = validateLookupInput(request.data);
  if (!validated.ok) {
    const err = new Error(validated.message);
    err.code = validated.code;
    throw err;
  }

  const resolved = await resolveUidFromQuery(validated.query);
  const [ladder, flags] = await Promise.all([
    loadLadderSnapshot(resolved.uid),
    loadUserAdminFlag(resolved.uid),
  ]);

  return {
    ok: true,
    user: {
      uid: resolved.uid,
      email: resolved.email,
      authExists: resolved.authExists,
      userDocExists: flags.userDocExists,
      isAdmin: flags.isAdmin,
      onLadder: ladder.onLadder,
      displayName: ladder.displayName,
      avatarUrl: ladder.avatarUrl,
      overallScore: ladder.overallScore,
    },
  };
}

export async function assertSafeAdminTarget({ adminUid, targetUid }) {
  if (targetUid === adminUid) {
    const err = new Error("cannot target self");
    err.code = "failed-precondition";
    throw err;
  }
  const flags = await loadUserAdminFlag(targetUid);
  if (flags.isAdmin) {
    const err = new Error("cannot target admin");
    err.code = "failed-precondition";
    throw err;
  }
  return flags;
}

async function assertTargetHasDeletableSurface(targetUid) {
  const [authExists, ladder, flags] = await Promise.all([
    getAuth()
      .getUser(targetUid)
      .then(() => true)
      .catch((err) => {
        if (err?.code === "auth/user-not-found") return false;
        throw err;
      }),
    loadLadderSnapshot(targetUid),
    loadUserAdminFlag(targetUid),
  ]);
  if (!authExists && !ladder.onLadder && !flags.userDocExists) {
    const err = new Error("nothing to delete");
    err.code = "not-found";
    throw err;
  }
  return { authExists, onLadder: ladder.onLadder, userDocExists: flags.userDocExists };
}

export async function runAdminRemoveFromLadder(request) {
  const adminUid = request.auth?.uid;
  await assertAdmin(adminUid, request.auth);

  const validated = validateTargetConfirmInput(request.data, CONFIRM_REMOVE_FROM_LADDER);
  if (!validated.ok) {
    const err = new Error(validated.message);
    err.code = validated.code;
    throw err;
  }

  await assertSafeAdminTarget({ adminUid, targetUid: validated.targetUid });

  // Keep upload quotas; clear public presence + avatar objects only.
  const result = await deleteLadderPublicData(validated.targetUid, {
    clearRateLimits: false,
    clearAvatarStorage: true,
  });
  const nowIso = new Date().toISOString();

  // Clear identity lock so a future re-upload is not stuck anonymous after wipe.
  await db.collection("users").doc(validated.targetUid).set(
    {
      ladderIdentityLock: FieldValue.delete(),
      moderationStatus: "ladder_removed",
      moderationAt: nowIso,
      moderationBy: adminUid,
      moderationReason: "admin_remove_from_ladder",
      updatedAt: nowIso,
    },
    { merge: true }
  );

  await db.collection(ADMIN_ACTIONS_COLLECTION).add({
    adminId: adminUid,
    action: "remove_from_ladder",
    targetUserId: validated.targetUid,
    details: result,
    timestamp: nowIso,
  });

  return { ok: true, mode: "remove_from_ladder", ...result };
}

export async function runAdminDeleteUser(request) {
  const adminUid = request.auth?.uid;
  await assertAdmin(adminUid, request.auth);

  const validated = validateTargetConfirmInput(request.data, CONFIRM_DELETE_ACCOUNT);
  if (!validated.ok) {
    const err = new Error(validated.message);
    err.code = validated.code;
    throw err;
  }

  await assertSafeAdminTarget({ adminUid, targetUid: validated.targetUid });
  const surface = await assertTargetHasDeletableSurface(validated.targetUid);

  let authDeleted = false;
  let cloudDeleted = false;
  try {
    await deleteAuthAndCloudUser(validated.targetUid);
    authDeleted = true;
    cloudDeleted = true;
  } catch (err) {
    if (err?.code === "auth/user-not-found") {
      await deleteUserCloudData(validated.targetUid);
      authDeleted = false;
      cloudDeleted = true;
    } else {
      throw err;
    }
  }

  const nowIso = new Date().toISOString();
  await db.collection(ADMIN_ACTIONS_COLLECTION).add({
    adminId: adminUid,
    action: "delete_user",
    targetUserId: validated.targetUid,
    details: {
      mode: "full",
      authDeleted,
      cloudDeleted,
      hadAuth: surface.authExists,
      hadLadder: surface.onLadder,
      hadUserDoc: surface.userDocExists,
    },
    timestamp: nowIso,
  });

  return { ok: true, mode: "delete_user", authDeleted, cloudDeleted };
}
