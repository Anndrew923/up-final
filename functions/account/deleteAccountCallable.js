import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { KNOWN_LEADERBOARD_SHARD_IDS, CALLABLE_OPTS } from "../shared/constants.js";
import { db } from "../shared/admin.js";

const RECENT_AUTH_MAX_AGE_SECONDS = 10 * 60;

function assertRecentAuthentication(request, nowSeconds = Math.floor(Date.now() / 1000)) {
  const authTime = Number(request.auth?.token?.auth_time);
  if (!Number.isFinite(authTime) || nowSeconds - authTime > RECENT_AUTH_MAX_AGE_SECONDS) {
    throw new HttpsError("failed-precondition", "recent-login-required");
  }
}

async function recursiveDeleteQuery(collectionName, field, uid) {
  const query = db.collection(collectionName).where(field, "==", uid);
  await db.recursiveDelete(query);
}

async function deleteUserCloudData(uid) {
  const directRefs = [
    db.collection("leaderboard_previews").doc(uid),
    db.collection("ladder_rate_limits").doc(uid),
    db.collection("dyno_intel_rate_limits").doc(uid),
    db.collection("userSettings").doc(uid),
  ];
  for (const metric of KNOWN_LEADERBOARD_SHARD_IDS) {
    directRefs.push(db.collection("leaderboards").doc(metric).collection("entries").doc(uid));
  }

  const scopedQueries = [
    ["friendInvitations", "fromUserId"],
    ["friendInvitations", "toUserId"],
    ["communityPosts", "userId"],
    ["assessments", "userId"],
    ["ladderRankings", "userId"],
    ["history", "userId"],
    ["verificationRequests", "userId"],
    ["reports", "reporterId"],
    ["reports", "reportedUserId"],
    ["notifications", "userId"],
    ["ladder_reports", "reporterUid"],
    ["ladder_reports", "targetUid"],
  ];

  for (const ref of directRefs) {
    await ref.delete();
  }
  for (const [collectionName, field] of scopedQueries) {
    await recursiveDeleteQuery(collectionName, field, uid);
  }
  await db.recursiveDelete(db.collection("users").doc(uid));
}

/**
 * Server-owned account erasure keeps denied leaderboard writes from leaving
 * orphaned public rows after Firebase Auth deletion.
 */
export const deleteAccount = onCall(CALLABLE_OPTS, async (request) => {
  const uid = request.auth?.uid;
  if (!uid || request.auth?.token?.firebase?.sign_in_provider === "anonymous") {
    throw new HttpsError("unauthenticated", "google-sign-in-required");
  }
  assertRecentAuthentication(request);

  try {
    await deleteUserCloudData(uid);
    await getAuth().deleteUser(uid);
    return { ok: true };
  } catch (error) {
    console.error("[deleteAccount] failed", {
      code: error?.code ?? "unknown",
    });
    throw new HttpsError("internal", "account-delete-failed");
  }
});

export { assertRecentAuthentication, deleteUserCloudData };
