const PENDING_RADAR_RESONANCE_KEY = 'up:pending-radar-resonance';

/** One-shot UI flag: assessment wrote to radar and user is returning to Home for resonance ritual. */
export function markPendingRadarResonance(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PENDING_RADAR_RESONANCE_KEY, '1');
}

/** Non-destructive check — use before starting the ritual; consume after success. */
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

export function clearPendingRadarResonance(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PENDING_RADAR_RESONANCE_KEY);
}
