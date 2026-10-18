/**
 * Opt-in PK clash motion timings — CSS/SVG only (no rAF).
 * WHY: Shared ms values keep hook phases, chart unfold, and banner choreography aligned.
 */

/** Visual phase for gold compare layer + VS banner (includes exit hold). */
export type RadarPkCompareMotion = 'enter' | 'exit';

/** Public PK ceremony phase — scanning gates the gold clash unfold. */
export type RadarPkPhase = 'idle' | 'scanning' | 'clashed';

export const RADAR_PK_CLASH_MOTION = {
  /** Diagnostic extract veil before gold unfold. */
  scanMs: 450,
  compareEnterMs: 400,
  compareExitMs: 200,
  winPulseMs: 280,
  winPulseDelayMs: 320,
  bannerSlideMs: 360,
  bannerVsMs: 380,
  bannerBadgeMs: 320,
  bannerBadgeDelayMs: 100,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

/** Exit-hold duration — zero when the user prefers reduced motion (no fade to wait on). */
export function resolveRadarPkCompareExitMs(
  prefersReducedMotion: boolean = false
): number {
  return prefersReducedMotion ? 0 : RADAR_PK_CLASH_MOTION.compareExitMs;
}

/** Scan veil duration — zero under reduced motion so clash starts immediately. */
export function resolveRadarPkScanMs(
  prefersReducedMotion: boolean = false
): number {
  return prefersReducedMotion ? 0 : RADAR_PK_CLASH_MOTION.scanMs;
}
