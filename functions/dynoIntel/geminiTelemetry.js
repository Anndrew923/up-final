/** @type {Record<string, unknown> | null} */
export let lastDynoIntelGeminiTelemetry = null;

/**
 * WHY: Per-request structured telemetry — replaces module-level usageMetadata singleton
 * so concurrent Callable invocations do not clobber each other's cost audit trail.
 */
export function recordDynoIntelGeminiTelemetry(record) {
  const payload = {
    recordedAt: new Date().toISOString(),
    ...record,
  };
  lastDynoIntelGeminiTelemetry = payload;
  console.info("[dynoIntel:gemini-telemetry]", JSON.stringify(payload));
  return payload;
}

export function recordDynoIntelRouteTelemetry(record) {
  const payload = {
    recordedAt: new Date().toISOString(),
    ...record,
  };
  console.info("[dynoIntel:route-telemetry]", JSON.stringify(payload));
  return payload;
}

/** Back-compat for golden audit scripts — maps from latest telemetry snapshot. */
export function readLastGeminiUsageMetadata() {
  const usage = lastDynoIntelGeminiTelemetry?.usageMetadata;
  return usage && typeof usage === "object" ? usage : null;
}
