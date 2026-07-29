import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import {
  runAdminDeleteUser,
  runAdminRemoveFromLadder,
  runLookupAdminLadderUser,
} from "./adminUserOpsCore.js";

function mapAdminError(err, label) {
  if (err?.code === "unauthenticated") {
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  if (err?.code === "permission-denied") {
    throw new HttpsError("permission-denied", err.message || "Admin required");
  }
  if (err?.code === "invalid-argument") {
    throw new HttpsError("invalid-argument", err.message || "Invalid request");
  }
  if (err?.code === "not-found") {
    throw new HttpsError("not-found", err.message || "Not found");
  }
  if (err?.code === "failed-precondition") {
    throw new HttpsError("failed-precondition", err.message || "Precondition failed");
  }
  console.error(`[${label}] unexpected`, err?.message);
  throw new HttpsError("internal", "Admin operation failed");
}

export const lookupAdminLadderUser = onCall(CALLABLE_OPTS, async (request) => {
  try {
    return await runLookupAdminLadderUser(request);
  } catch (err) {
    mapAdminError(err, "lookupAdminLadderUser");
  }
});

export const adminRemoveFromLadder = onCall(CALLABLE_OPTS, async (request) => {
  try {
    return await runAdminRemoveFromLadder(request);
  } catch (err) {
    mapAdminError(err, "adminRemoveFromLadder");
  }
});

export const adminDeleteUser = onCall(CALLABLE_OPTS, async (request) => {
  try {
    return await runAdminDeleteUser(request);
  } catch (err) {
    mapAdminError(err, "adminDeleteUser");
  }
});
