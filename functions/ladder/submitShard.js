import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { runLadderSubmitShard } from "./submitShardCore.js";

export const ladderSubmitShard = onCall(CALLABLE_OPTS, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  try {
    return await runLadderSubmitShard(request);
  } catch (err) {
    if (err?.code === "pro-required") {
      return {
        ok: false,
        reason: "pro-required",
        updated: false,
        previousScore: null,
        submittedScore: null,
      };
    }
    if (err?.code === "anonymous") {
      throw new HttpsError("permission-denied", "Anonymous users cannot upload");
    }
    console.error("[ladderSubmitShard] unexpected", err?.message);
    throw new HttpsError("internal", "Ladder submit failed");
  }
});
