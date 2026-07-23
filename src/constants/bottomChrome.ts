/**
 * Shared bottom-chrome geometry for floating UI that must clear BottomNav.
 *
 * WHY: BottomNav shell is 78px + safe-area, but the center DYNO hex uses
 * `-translate-y-4` (~16px). Floating chrome that only clears 72–78px will
 * collide with the hex. Keep stack math in one place so Ladder floating rank,
 * Dyno Intel trigger, and scroll insets stay aligned.
 */

/** Matches `BottomNav` `h-[calc(78px+env(safe-area-inset-bottom))]`. */
export const BOTTOM_NAV_SHELL_PX = 78;

/**
 * Hex protrusion (~16px) + visual air gap above the raised DYNO button.
 * Total stack = shell + air gap (safe-area added at each use site).
 */
export const BOTTOM_CHROME_AIR_GAP_PX = 28;

/** Distance from the physical bottom edge to the *bottom* of floating chrome (excludes safe-area). */
export const BOTTOM_CHROME_STACK_PX = BOTTOM_NAV_SHELL_PX + BOTTOM_CHROME_AIR_GAP_PX; // 106

/** `DynoActiveTrigger` chip height (`h-9`). */
export const DYNO_INTEL_TRIGGER_HEIGHT_PX = 36;

/** Approximate height of the ladder dual-pill floating rank row. */
export const LADDER_FLOATING_RANK_BAR_PX = 56;

/**
 * Ladder list scroll / IO inset so the last rows clear floating rank + bottom chrome
 * (excludes safe-area — add at use site when needed).
 */
export const LADDER_SCROLL_BOTTOM_INSET_PX =
  BOTTOM_CHROME_STACK_PX + LADDER_FLOATING_RANK_BAR_PX; // 162

/**
 * Default AppShell scroll bottom inset when Dyno Intel trigger is visible.
 * WHY: Trigger bottom sits at `BOTTOM_CHROME_STACK_PX`; its top is stack + chip height.
 */
export const APP_SHELL_SCROLL_BOTTOM_PX =
  BOTTOM_CHROME_STACK_PX + DYNO_INTEL_TRIGGER_HEIGHT_PX; // 142

/** CSS `calc` bottom / padding-bottom that clears chrome + device safe-area. */
export function bottomChromeCalc(offsetPx: number): string {
  return `calc(${offsetPx}px + env(safe-area-inset-bottom, 0px))`;
}
