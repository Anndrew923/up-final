import { HttpsError, onCall } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import {
  assertRecentAuthentication,
  deleteAuthAndCloudUser,
  deleteUserCloudData,
} from "./userCloudDeletion.js";

/**
 * Server-owned account erasure keeps denied leaderboard writes from leaving
 * orphaned public rows after Firebase Auth deletion.
 */
export const deleteAccount = onCall(CALLABLE_OPTS, async (request) => {
  const uid = request.auth?.uid;
  if (!uid || request.auth?.token?.firebase?.sign_in_provider === "anonymous") {
    throw new HttpsError("unauthenticated", "google-sign-in-required");
  }
  try {
    assertRecentAuthentication(request);
  } catch {
    throw new HttpsError("failed-precondition", "recent-login-required");
  }

  try {
    await deleteAuthAndCloudUser(uid);
    return { ok: true };
  } catch (error) {
    console.error("[deleteAccount] failed", {
      code: error?.code ?? "unknown",
    });
    throw new HttpsError("internal", "account-delete-failed");
  }
});

export { assertRecentAuthentication, deleteUserCloudData, deleteAuthAndCloudUser };
