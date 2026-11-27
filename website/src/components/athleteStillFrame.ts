/**
 * Shared homepage athlete still sizing.
 * WHY: All verified/community battle cards share one frame so peek rails and
 * md+ grids stay equal-height. Default framing keeps head + bottom telemetry
 * (radar / FFMI / score) inside object-cover.
 */

/**
 * Unified battle-card box — 3:4 + 46svh mobile cap.
 * WHY: Shorter frames cropped lower radar/score blocks and split card heights.
 */
export const ATHLETE_STILL_BOX =
  'aspect-[3/4] max-h-[46svh] w-full shrink-0 sm:max-h-none';

/**
 * Unified object fit — slight downward bias so baked-in footer metrics survive.
 */
export const ATHLETE_STILL_OBJECT = 'object-cover object-[center_22%]';

export interface AthleteStillOptions {
  /** Escape-hatch object-* override */
  objectClass?: string;
  /** Escape-hatch box override */
  boxClass?: string;
}

/** Map roster crop fields → still options (single call-site shape). */
export function athleteStillOptionsFromCrop(crop?: {
  stillObjectClass?: string;
  stillBoxClass?: string;
}): AthleteStillOptions {
  return {
    objectClass: crop?.stillObjectClass,
    boxClass: crop?.stillBoxClass,
  };
}

export function athleteStillBoxClass(options?: AthleteStillOptions): string {
  return options?.boxClass?.trim() || ATHLETE_STILL_BOX;
}

export function athleteStillObjectClass(options?: AthleteStillOptions): string {
  return options?.objectClass?.trim() || ATHLETE_STILL_OBJECT;
}

/** Compose still img classes from optional roster overrides. */
export function athleteStillImgClass(options?: AthleteStillOptions): string {
  return `${athleteStillBoxClass(options)} ${athleteStillObjectClass(options)}`;
}
