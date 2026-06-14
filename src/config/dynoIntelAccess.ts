/**
 * DYNO INTEL dev/beta Pro-gate bypass flags.
 *
 * Design intent (WHY): Local dev and staged beta builds must exercise full cross-axis
 * Callable paths without RevenueCat / Firestore Pro docs. Production builds keep
 * bypass off unless `VITE_DYNO_INTEL_BETA_FREE` is explicitly injected at build time.
 *
 * Server parity: set `DYNO_INTEL_DEV_BYPASS=true` (local Functions) or
 * `DYNO_INTEL_BETA_FREE=true` (staging) on Cloud Functions — client bypass alone
 * cannot satisfy Callable entitlement checks.
 */
export function isDynoIntelProBypassActive(): boolean {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_DYNO_INTEL_BETA_FREE === 'true';
  }
  return import.meta.env.DEV || import.meta.env.VITE_DYNO_INTEL_BETA_FREE === 'true';
}
