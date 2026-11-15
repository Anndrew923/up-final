/**
 * Session-scoped aspect persistence for the aesthetic share modal.
 * WHY: Capacitor Share sheet can remount the WebView subtree; without this the
 * format pill snaps back to 9:16 after the native sheet dismisses.
 */
import type { TelemetryCardAspectRatio } from './telemetryCardTypes';

export const AESTHETIC_TELEMETRY_ASPECT_SESSION_KEY = 'up:aesthetic-telemetry-aspect';

export function readAestheticTelemetryAspectSession(): TelemetryCardAspectRatio {
  if (typeof window === 'undefined' || !window.sessionStorage) return '9:16';
  try {
    const raw = window.sessionStorage.getItem(AESTHETIC_TELEMETRY_ASPECT_SESSION_KEY);
    return raw === '4:5' ? '4:5' : '9:16';
  } catch {
    return '9:16';
  }
}

export function writeAestheticTelemetryAspectSession(
  aspect: TelemetryCardAspectRatio
): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(AESTHETIC_TELEMETRY_ASPECT_SESSION_KEY, aspect);
  } catch {
    /* private mode / quota — aspect still lives in React state for this mount */
  }
}
