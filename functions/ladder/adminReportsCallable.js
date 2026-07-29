import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { runGetAdminLadderReports, runProcessLadderReport } from "./adminReportsCore.js";

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

export const getAdminLadderReports = onCall(CALLABLE_OPTS, async (request) => {
  try {
    return await runGetAdminLadderReports(request);
  } catch (err) {
    mapAdminError(err, "getAdminLadderReports");
  }
});

export const processLadderReport = onCall(CALLABLE_OPTS, async (request) => {
  try {
    return await runProcessLadderReport(request);
  } catch (err) {
    mapAdminError(err, "processLadderReport");
  }
});
