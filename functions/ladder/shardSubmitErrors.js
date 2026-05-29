/**
 * Maps ladder shard submit errors to stable client-facing reasons.
 * WHY: `runLadderSyncBatch` calls `runLadderSubmitShard` directly (not the onCall wrapper),
 * so thrown codes must be normalized here — same semantics as `submitShard.js`.
 */

/**
 * @param {unknown} err
 * @returns {{ reason: string, message?: string }}
 */
export function mapLadderShardSubmitError(err) {
  const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : "";
  const message =
    typeof err === "object" && err !== null && "message" in err && typeof err.message === "string"
      ? err.message
      : undefined;

  if (code === "pro-required") {
    return { reason: "pro-required", message: message ?? "Pro subscription required" };
  }
  if (code === "anonymous") {
    return { reason: "anonymous", message: message ?? "Anonymous users cannot upload" };
  }

  return {
    reason: "internal",
    message: message ?? "Shard submit failed",
  };
}

/**
 * @param {{ metric: string, reason: string, message?: string }[]} failures
 * @param {string} metric
 * @param {string} reason
 * @param {string} [message]
 */
export function recordLadderSyncFailure(failures, metric, reason, message) {
  const row = { metric, reason };
  if (message) row.message = message;
  failures.push(row);
}

/**
 * @param {ReturnType<typeof import('./syncBatch.js').createEmptySummary>} tally
 * @param {string} reason
 */
export function applyFailureReasonToTally(tally, reason) {
  if (reason === "rate-limited") {
    tally.rateLimited += 1;
    return;
  }
  if (reason === "pro-required") {
    tally.proRequired += 1;
    return;
  }
  if (reason === "invalid-input") {
    tally.invalidInput += 1;
    tally.errors += 1;
    return;
  }
  tally.internal += 1;
  tally.errors += 1;
}
