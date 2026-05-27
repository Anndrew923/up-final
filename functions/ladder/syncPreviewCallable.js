import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { runLadderSyncPreview } from "./submitShardCore.js";

export const ladderSyncPreview = onCall(CALLABLE_OPTS, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  try {
    return await runLadderSyncPreview(request);
  } catch (err) {
    if (err?.code === "pro-required") {
      return { ok: false, reason: "pro-required" };
    }
    if (err?.code === "anonymous") {
      throw new HttpsError("permission-denied", "Anonymous users cannot upload");
    }
    console.error("[ladderSyncPreview] unexpected", err?.message);
    throw new HttpsError("internal", "Ladder preview sync failed");
  }
});
