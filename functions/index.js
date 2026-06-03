/**
 * Ultimate Physique — Cloud Functions entry (feature re-exports only).
 */
import { setGlobalOptions } from "firebase-functions/v2/options";
import { CALLABLE_OPTS } from "./shared/constants.js";

setGlobalOptions({
  region: CALLABLE_OPTS.region,
  memory: CALLABLE_OPTS.memory,
  timeoutSeconds: CALLABLE_OPTS.timeoutSeconds,
});

export { ladderSubmitShard } from "./ladder/submitShard.js";
export { ladderSyncPreview } from "./ladder/syncPreviewCallable.js";
export { ladderSyncBatch } from "./ladder/syncBatchCallable.js";
