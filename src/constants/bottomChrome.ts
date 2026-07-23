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

/** Center hex `-translate-y-4` protrusion above the nav glass. */
export const BOTTOM_HEX_PROTRUSION_PX = 16;

/** Approximate hex top from the physical bottom edge (excludes safe-area). */
export const BOTTOM_HEX_TOP_PX = BOTTOM_NAV_SHELL_PX + BOTTOM_HEX_PROTRUSION_PX; // 94

/**
 * Air gap above the raised DYNO hex for non-ladder floating chrome (Dyno Intel chip).
 * Total stack = shell + air gap (safe-area added at each use site).
 */
export const BOTTOM_CHROME_AIR_GAP_PX = 28;

/** Distance from the physical bottom edge to the *bottom* of floating chrome (excludes safe-area). */
export const BOTTOM_CHROME_STACK_PX = BOTTOM_NAV_SHELL_PX + BOTTOM_CHROME_AIR_GAP_PX; // 106

/** `DynoActiveTrigger` chip height (`h-9`). */
export const DYNO_INTEL_TRIGGER_HEIGHT_PX = 36;

/** Ladder bridge arch cutout width — clears hex `w-16` + side buffer. */
export const LADDER_BRIDGE_ARCH_WIDTH_PX = 84;

/**
 * Reference shell content width for normalizing arch width → objectBoundingBox.
 * Approx. phone width minus horizontal padding (`px-3` × 2 on a ~390px viewport).
 */
export const LADDER_BRIDGE_REF_WIDTH_PX = 366;

/** Ladder bridge arch cutout depth (upward from shell bottom). */
export const LADDER_BRIDGE_ARCH_DEPTH_PX = 18;

/** Air between arch apex and hex top (8–12px target). */
export const LADDER_BRIDGE_AIR_GAP_PX = 10;

/**
 * Bridge shell `bottom` offset: feet sit below hex top; arch rises to hexTop + air.
 * apex = BOTTOM_HEX_TOP_PX + LADDER_BRIDGE_AIR_GAP_PX
 * feet = apex - LADDER_BRIDGE_ARCH_DEPTH_PX
 */
export const LADDER_BRIDGE_BOTTOM_PX =
  BOTTOM_HEX_TOP_PX + LADDER_BRIDGE_AIR_GAP_PX - LADDER_BRIDGE_ARCH_DEPTH_PX; // 86

/** Approximate height of the ladder bridge floating rank shell. */
export const LADDER_FLOATING_RANK_BAR_PX = 56;

/**
 * Ladder list scroll / IO inset so the last rows clear bridge + bottom chrome
 * (excludes safe-area — add at use site when needed).
 */
export const LADDER_SCROLL_BOTTOM_INSET_PX =
  LADDER_BRIDGE_BOTTOM_PX + LADDER_FLOATING_RANK_BAR_PX; // 142

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
