/**
 * Spectrum → Dyno auto-flush re-entry guards.
 * WHY: Flush effect deps (and StrictMode) can re-run while sendQuestion is still
 * awaiting; locking only after await double-bills daily quota.
 */

export interface DynoIntelLaunchFlushLock {
  /** Last launchRequestId that successfully accepted sendQuestion. */
  flushedLaunchRequestId: number;
  /** launchRequestId currently inside sendQuestion (0 = idle). */
  inFlightLaunchRequestId: number;
}

/** Server requestId must match `/^[A-Za-z0-9_-]{8,64}$/` in chatCallable. */
export function buildDynoIntelLaunchRequestId(launchRequestId: number): string {
  const n = Math.max(0, Math.floor(Number(launchRequestId) || 0));
  return `spectrum-launch-${n}`;
}

/**
 * Synchronously claim a flush slot before any await.
 * WHY: Any in-flight claim blocks — not only the same id — so a rapid second
 * `requestLaunch` cannot open a parallel Callable while the first is still billing.
 * @returns false when this launch is already flushed or any flush is in flight.
 */
export function claimDynoIntelLaunchFlush(
  lock: DynoIntelLaunchFlushLock,
  launchRequestId: number
): boolean {
  if (launchRequestId <= 0) return false;
  if (lock.flushedLaunchRequestId === launchRequestId) return false;
  if (lock.inFlightLaunchRequestId !== 0) return false;
  lock.inFlightLaunchRequestId = launchRequestId;
  return true;
}

/** Release in-flight so paywall / auth early returns can re-flush the same launch. */
export function releaseDynoIntelLaunchFlushInFlight(
  lock: DynoIntelLaunchFlushLock,
  launchRequestId: number
): void {
  if (lock.inFlightLaunchRequestId === launchRequestId) {
    lock.inFlightLaunchRequestId = 0;
  }
}

/** Mark accepted flush; keeps in-flight cleared so close/reopen stays clean. */
export function markDynoIntelLaunchFlushAccepted(
  lock: DynoIntelLaunchFlushLock,
  launchRequestId: number
): void {
  lock.flushedLaunchRequestId = launchRequestId;
  if (lock.inFlightLaunchRequestId === launchRequestId) {
    lock.inFlightLaunchRequestId = 0;
  }
}

/** Soft-reset in-flight on sheet dismiss so a later launch is not blocked by a zombie claim. */
export function resetDynoIntelLaunchFlushInFlight(lock: DynoIntelLaunchFlushLock): void {
  lock.inFlightLaunchRequestId = 0;
}

/**
 * WHY: Re-running openSheetWithGate (auth settle) must not clearChat mid-flush —
 * that resets status to idle and defeats the loading guard against a second send.
 */
export function shouldClearChatForSpectrumOpen(
  inFlightLaunchRequestId: number,
  currentLaunchRequestId: number,
  hasPendingPrompt: boolean
): boolean {
  if (!hasPendingPrompt) return false;
  if (inFlightLaunchRequestId > 0 && inFlightLaunchRequestId === currentLaunchRequestId) {
    return false;
  }
  return true;
}

/**
 * After an older in-flight flush finishes, a newer pending launch may still need a send.
 * WHY: claim blocks all in-flight, so the newer effect run may have no-op'd; caller must retry.
 */
export function shouldRetryLaunchFlushAfterRelease(input: {
  completedLaunchRequestId: number;
  currentLaunchRequestId: number;
  hasPendingPrompt: boolean;
}): boolean {
  if (!input.hasPendingPrompt) return false;
  return input.currentLaunchRequestId !== input.completedLaunchRequestId;
}
