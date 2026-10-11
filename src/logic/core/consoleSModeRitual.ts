/**
 * Console S-Mode ritual timings (WHY): Single source for hook settle window vs CSS beats.
 * Keep CSS keyframe durations in sync with these numbers (see `styles.css` ui-console-*).
 */
export const CONSOLE_S_MODE_RADAR_PULSE_MS = 250;
export const CONSOLE_S_MODE_SHEEN_MS = 250;
export const CONSOLE_S_MODE_REV_UP_MS = 200;
export const CONSOLE_S_MODE_BORDER_SURGE_MS = 200;
export const CONSOLE_S_MODE_LEXICON_FADE_MS = 150;
/** Soft charge pulse before Heavy bite when entering telemetry (assessment-parity). */
export const CONSOLE_S_MODE_CHARGE_SOFT_MS = 200;

/** Longest visual beat + small buffer so class teardown never clips the last keyframe. */
export const CONSOLE_S_MODE_RITUAL_MS =
  Math.max(CONSOLE_S_MODE_RADAR_PULSE_MS, CONSOLE_S_MODE_SHEEN_MS) + 10;
