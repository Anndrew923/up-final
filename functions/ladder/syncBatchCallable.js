import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { runLadderSyncBatch } from "./syncBatch.js";

export const ladderSyncBatch = onCall(CALLABLE_OPTS, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  try {
    return await runLadderSyncBatch(request);
  } catch (err) {
    if (err?.code === "pro-required") {
      return {
        ok: false,
        reason: "pro-required",
        summary: {
          attempted: 0,
          updated: 0,
          unchanged: 0,
          errors: 0,
          invalidInput: 0,
          internal: 0,
          rateLimited: 0,
          proRequired: 0,
        },
        failures: [],
      };
    }
    if (err?.code === "anonymous") {
      throw new HttpsError("permission-denied", "Anonymous users cannot upload");
    }
    console.error("[ladderSyncBatch] unexpected", err?.message);
    throw new HttpsError("internal", "Ladder batch sync failed");
  }
});
