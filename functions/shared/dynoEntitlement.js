import { db } from "./admin.js";
import { hasCoreFromUserDoc, hasProFromUserDoc } from "./userEntitlement.js";

function isDynoIntelEntitlementBypassActive() {
  return (
    process.env.DYNO_INTEL_DEV_BYPASS === "true" ||
    process.env.DYNO_INTEL_BETA_FREE === "true"
  );
}

/**
 * Resolves Core / Pro for Callable gates.
 * WHY: Client bypass flags must mirror these env vars or cross-axis calls still return pro-required.
 */
export async function resolveDynoIntelEntitlement(uid, authToken, now = new Date()) {
  if (isDynoIntelEntitlementBypassActive()) {
    return { isPro: true, hasCore: true };
  }

  if (authToken?.pro === true) {
    return { isPro: true, hasCore: true };
  }

  const snap = await db.collection("users").doc(uid).get();
  const data = snap.data();
  return {
    isPro: hasProFromUserDoc(data, now),
    hasCore: hasCoreFromUserDoc(data),
  };
}

export function assertDynoIntelModeAllowed(mode, isPro) {
  if (mode === "single-axis") return;
  if (!isPro) {
    const err = new Error("pro-required");
    err.code = "pro-required";
    throw err;
  }
}

export function assertDynoIntelTrialCoreOwned(mode, isPro, hasCore) {
  if (mode !== "single-axis" || isPro) return;
  if (!hasCore) {
    const err = new Error("core-required");
    err.code = "core-required";
    throw err;
  }
}
