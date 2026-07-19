import { createHash } from "node:crypto";
import { DYNO_INTEL_GEMINI_MODEL_METHODOLOGY } from "../shared/constants.js";

/** @type {Record<string, unknown> | null} */
export let lastDynoIntelGeminiTelemetry = null;

function privacySafeTelemetry(record) {
  const payload = { ...record };
  const uid = typeof payload.uid === "string" ? payload.uid : "";
  const question = typeof payload.userQuestion === "string" ? payload.userQuestion : "";
  delete payload.uid;
  delete payload.userQuestion;

  if (question) {
    payload.questionLength = question.length;
    payload.requestHash = createHash("sha256")
      .update(`${uid}:${question}`)
      .digest("hex")
      .slice(0, 24);
  }
  return payload;
}

/** Maps resolved model id to stable telemetry route labels. */
export function resolveGeminiTelemetryRoute(model) {
  const normalized = String(model ?? "").replace(/^models\//, "");
  if (normalized === DYNO_INTEL_GEMINI_MODEL_METHODOLOGY) {
    return "gemini-flash";
  }
  return "gemini-lite";
}

/**
 * WHY: Per-request structured telemetry — replaces module-level usageMetadata singleton
 * so concurrent Callable invocations do not clobber each other's cost audit trail.
 */
export function recordDynoIntelGeminiTelemetry(record) {
  const payload = {
    recordedAt: new Date().toISOString(),
    ...privacySafeTelemetry(record),
  };
  lastDynoIntelGeminiTelemetry = payload;
  console.info("[dynoIntel:gemini-telemetry]", JSON.stringify(payload));
  return payload;
}

export function recordDynoIntelRouteTelemetry(record) {
  const payload = {
    recordedAt: new Date().toISOString(),
    ...privacySafeTelemetry(record),
  };
  console.info("[dynoIntel:route-telemetry]", JSON.stringify(payload));
  return payload;
}

/** Back-compat for golden audit scripts — maps from latest telemetry snapshot. */
export function readLastGeminiUsageMetadata() {
  const usage = lastDynoIntelGeminiTelemetry?.usageMetadata;
  return usage && typeof usage === "object" ? usage : null;
}

/** Test-only reset — clears in-process telemetry between node:test cases. */
export function resetDynoIntelGeminiTelemetryForTests() {
  lastDynoIntelGeminiTelemetry = null;
}
