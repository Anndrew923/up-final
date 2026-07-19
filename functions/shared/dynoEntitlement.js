import { db } from "./admin.js";
import { hasCoreFromUserDoc, hasProFromUserDoc } from "./userEntitlement.js";

export function isDynoIntelEntitlementBypassActive() {
  return (
    (process.env.FUNCTIONS_EMULATOR === "true" && process.env.DYNO_INTEL_DEV_BYPASS === "true") ||
    process.env.DYNO_INTEL_BETA_FREE === "true"
  );
}

/**
 * Resolves Core / Pro for Callable gates.
 * WHY: Client bypass flags must mirror these env vars or cross-axis calls still return pro-required.
 */
export async function resolveDynoIntelEntitlement(uid, now = new Date()) {
  if (isDynoIntelEntitlementBypassActive()) {
    // Bypass unlocks diagnostic modes for testing, not the paid quota bucket.
    return { isPro: true, hasCore: true, hasProQuota: false };
  }

  // Firestore is authoritative. ID tokens can outlive an early refund or
  // revocation, so a cached Pro claim must never bypass this document check.
  const snap = await db.collection("users").doc(uid).get();
  const data = snap.data();
  const isPro = hasProFromUserDoc(data, now);
  return {
    isPro,
    hasCore: hasCoreFromUserDoc(data),
    hasProQuota: isPro,
  };
}

export function assertDynoIntelModeAllowed(mode, isPro) {
  if (mode === "single-axis" || mode === "cross-axis") return;
  if (mode === "weight-simulation" && !isPro) {
    const err = new Error("pro-required");
    err.code = "pro-required";
    throw err;
  }
}

export function assertDynoIntelTrialCoreOwned(mode, isPro, hasCore) {
  if (isPro) return;
  if (mode === "weight-simulation") return;
  if (!hasCore) {
    const err = new Error("core-required");
    err.code = "core-required";
    throw err;
  }
}
