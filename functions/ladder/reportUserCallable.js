import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { runLadderReportUser } from "./reportUserCore.js";

export const ladderReportUser = onCall(CALLABLE_OPTS, async (request) => {
  try {
    return await runLadderReportUser(request);
  } catch (err) {
    if (err?.code === "unauthenticated") {
      throw new HttpsError("unauthenticated", "Sign in required");
    }
    if (err?.code === "permission-denied") {
      throw new HttpsError("permission-denied", err.message || "Not allowed");
    }
    if (err?.code === "invalid-argument") {
      throw new HttpsError("invalid-argument", err.message || "Invalid report");
    }
    if (err?.code === "resource-exhausted") {
      throw new HttpsError("resource-exhausted", err.message || "Report limit reached");
    }
    if (err?.code === "not-found") {
      throw new HttpsError("not-found", err.message || "Target not found");
    }
    console.error("[ladderReportUser] unexpected", err?.message);
    throw new HttpsError("internal", "Report failed");
  }
});
