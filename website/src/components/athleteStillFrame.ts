/**
 * Shared homepage athlete still sizing.
 * WHY: Verified + community snap cards must share one mobile height budget
 * (`max-h-[40svh]`) so the rail stays one-screen under sticky download chrome.
 * Box vs img split keeps placeholders free of `object-*` noise.
 */
export const ATHLETE_STILL_BOX =
  'aspect-[1/1.05] max-h-[40svh] w-full shrink-0 sm:aspect-[3/4] sm:max-h-none';

export const ATHLETE_STILL_IMG = `${ATHLETE_STILL_BOX} object-cover object-top`;
