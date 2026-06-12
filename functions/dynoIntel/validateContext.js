import {
  DYNO_INTEL_CONTEXT_SCHEMA_VERSION,
  SIX_AXIS_METRICS,
} from "../shared/constants.js";

const VALID_MODES = new Set(["single-axis", "cross-axis", "weight-simulation"]);

const FORBIDDEN_CONTEXT_KEYS = new Set([
  "displayName",
  "avatarUrl",
  "city",
  "district",
  "region",
  "countryCode",
  "jobCategory",
  "age",
  "uid",
  "email",
]);

function assertNoForbiddenKeys(value, path = "") {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_CONTEXT_KEYS.has(key)) {
      const err = new Error(`forbidden-pii:${key}`);
      err.code = "invalid-argument";
      throw err;
    }
    assertNoForbiddenKeys(nested, path ? `${path}.${key}` : key);
  }
}

export function validateDynoIntelContext(context) {
  if (!context || typeof context !== "object") {
    const err = new Error("invalid-context");
    err.code = "invalid-argument";
    throw err;
  }
  if (context.schemaVersion !== DYNO_INTEL_CONTEXT_SCHEMA_VERSION) {
    const err = new Error("unsupported-schema");
    err.code = "invalid-argument";
    throw err;
  }
  if (!context.mode || typeof context.mode !== "string" || !VALID_MODES.has(context.mode)) {
    const err = new Error("invalid-mode");
    err.code = "invalid-argument";
    throw err;
  }
  if (!Array.isArray(context.axes)) {
    const err = new Error("invalid-axes");
    err.code = "invalid-argument";
    throw err;
  }
  assertNoForbiddenKeys(context);

  if (context.profile && typeof context.profile.age === "number") {
    const err = new Error("exact-age-forbidden");
    err.code = "invalid-argument";
    throw err;
  }

  if (
    context.mode === "weight-simulation" &&
    (!context.weightSimulation || !context.weightSimulation.enabled)
  ) {
    const err = new Error("weight-simulation-context-missing");
    err.code = "invalid-argument";
    throw err;
  }

  return true;
}

export function isValidSixAxisMetric(value) {
  return typeof value === "string" && SIX_AXIS_METRICS.includes(value);
}
