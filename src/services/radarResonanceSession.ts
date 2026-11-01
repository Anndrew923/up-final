const PENDING_RADAR_RESONANCE_KEY = 'up:pending-radar-resonance';

/**
 * Survives React StrictMode remount after the session flag is consumed.
 * WHY: Consuming in the first effect would drop the arrival pulse on the
 * simulated unmount; a live delivery token lets Home replay once until settle.
 */
let arrivalDeliveryLive = false;

/** One-shot UI flag: assessment wrote to radar and user is returning to Home for a lightweight arrival pulse. */
export function markPendingRadarResonance(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PENDING_RADAR_RESONANCE_KEY, '1');
}

/** Non-destructive peek — consume only after boot is complete and Home is mounted. */
export function hasPendingRadarResonance(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(PENDING_RADAR_RESONANCE_KEY) === '1';
}

/** Returns true once per pending session, then clears the flag. */
export function consumePendingRadarResonance(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.sessionStorage.getItem(PENDING_RADAR_RESONANCE_KEY) !== '1') return false;
  window.sessionStorage.removeItem(PENDING_RADAR_RESONANCE_KEY);
  return true;
}

/**
 * Claim a console arrival: consume a pending flag, or continue an in-flight delivery
 * after StrictMode remount. False means there is nothing to play.
 */
export function claimRadarArrivalDelivery(): boolean {
  if (consumePendingRadarResonance()) {
    arrivalDeliveryLive = true;
    return true;
  }
  return arrivalDeliveryLive;
}

/** Marks the current arrival as finished so a later Home visit does not replay. */
export function settleRadarArrivalDelivery(): void {
  arrivalDeliveryLive = false;
}

export function clearPendingRadarResonance(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PENDING_RADAR_RESONANCE_KEY);
  arrivalDeliveryLive = false;
}
