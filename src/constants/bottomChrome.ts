/**
 * Shared bottom-chrome geometry for floating UI that must clear BottomNav.
 *
 * WHY: BottomNav inner row is 64px (`h-16`) + safe-area padding on the shell, but the
 * center DYNO hex uses `-translate-y-4` (~16px). Floating chrome that only clears the
 * 64px row will collide with the hex. Keep stack math in one place so Ladder floating
 * rank, filter pill, Dyno Intel trigger, Join Arena CTA, and scroll insets stay aligned.
 */

/**
 * Matches `BottomNav` inner row `h-16` (safe-area is padding on the outer shell, not height).
 * Tailwind overlay token `pb-shell-bottom-nav` must stay `4rem` + inset.
 */
export const BOTTOM_NAV_SHELL_PX = 64;

/** Center hex `-translate-y-4` protrusion above the nav glass. */
export const BOTTOM_HEX_PROTRUSION_PX = 16;

/** Approximate hex top from the physical bottom edge (excludes safe-area). */
export const BOTTOM_HEX_TOP_PX = BOTTOM_NAV_SHELL_PX + BOTTOM_HEX_PROTRUSION_PX; // 80

/**
 * Air gap above the raised DYNO hex for non-ladder floating chrome (Dyno Intel chip).
 * Total stack = shell + air gap (safe-area added at each use site).
 */
export const BOTTOM_CHROME_AIR_GAP_PX = 28;

/** Distance from the physical bottom edge to the *bottom* of floating chrome (excludes safe-area). */
export const BOTTOM_CHROME_STACK_PX = BOTTOM_NAV_SHELL_PX + BOTTOM_CHROME_AIR_GAP_PX; // 92

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
  BOTTOM_HEX_TOP_PX + LADDER_BRIDGE_AIR_GAP_PX - LADDER_BRIDGE_ARCH_DEPTH_PX; // 72

/** Approximate height of the ladder bridge floating rank shell. */
export const LADDER_FLOATING_RANK_BAR_PX = 56;

/**
 * Ladder list scroll / IO inset so the last rows clear bridge + bottom chrome
 * (excludes safe-area — add at use site when needed).
 */
export const LADDER_SCROLL_BOTTOM_INSET_PX = LADDER_BRIDGE_BOTTOM_PX + LADDER_FLOATING_RANK_BAR_PX; // 128

/**
 * Ladder floating filter pill bottom offset (excludes safe-area).
 * WHY: Magic `bottom-24` ignored safe-area and collided with Dyno Intel (right) + bridge bar.
 * Same stack as scroll inset + air — clears hex, Dyno chip, and bridge when present.
 */
export const LADDER_FILTER_PILL_AIR_GAP_PX = 12;

export const LADDER_FILTER_PILL_BOTTOM_PX =
  LADDER_SCROLL_BOTTOM_INSET_PX + LADDER_FILTER_PILL_AIR_GAP_PX; // 140

/**
 * Default AppShell scroll bottom inset when Dyno Intel trigger is visible.
 * WHY: Trigger bottom sits at `BOTTOM_CHROME_STACK_PX`; its top is stack + chip height.
 */
export const APP_SHELL_SCROLL_BOTTOM_PX = BOTTOM_CHROME_STACK_PX + DYNO_INTEL_TRIGGER_HEIGHT_PX; // 128

/**
 * Floating CTA dock geometry when Dyno Intel chip is hidden (Join Arena).
 * WHY: Single stack clears BottomNav + center hex only; safe-area via `bottomChromeCalc`.
 * Semantic aliases below keep call-site intent readable without drifting numbers.
 */
export const DYNO_HIDDEN_FLOATING_CTA_BAR_PX = 72;
export const DYNO_HIDDEN_FLOATING_CTA_BOTTOM_PX = BOTTOM_CHROME_STACK_PX; // 92
export const DYNO_HIDDEN_FLOATING_CTA_SCROLL_BOTTOM_PX =
  DYNO_HIDDEN_FLOATING_CTA_BOTTOM_PX + DYNO_HIDDEN_FLOATING_CTA_BAR_PX; // 164

/** Join Arena floating CTA — aliases shared Dyno-hidden dock stack. */
export const JOIN_ARENA_CTA_BAR_PX = DYNO_HIDDEN_FLOATING_CTA_BAR_PX;
export const JOIN_ARENA_CTA_BOTTOM_PX = DYNO_HIDDEN_FLOATING_CTA_BOTTOM_PX;
/**
 * Extra scroll air below identity / manage-link so the CTA gradient does not visually clip cards.
 * WHY: Dock bar math clears the button; gradient fade still eats ~20px of perceived clearance.
 */
export const JOIN_ARENA_SCROLL_AIR_GAP_PX = 24;
export const JOIN_ARENA_SCROLL_BOTTOM_PX =
  DYNO_HIDDEN_FLOATING_CTA_SCROLL_BOTTOM_PX + JOIN_ARENA_SCROLL_AIR_GAP_PX; // 188

/** Air between the tab row and the boot overlay card (profile step). */
export const BOOT_OVERLAY_NAV_AIR_GAP_PX = 10;

/** Boot overlay clearance above the tab row (excludes safe-area). */
export const BOOT_OVERLAY_PROFILE_BOTTOM_PX = BOTTOM_NAV_SHELL_PX + BOOT_OVERLAY_NAV_AIR_GAP_PX; // 74

/** Boot overlay clearance above the raised DYNO hex (excludes safe-area). */
export const BOOT_OVERLAY_NARRATIVE_BOTTOM_PX = BOTTOM_HEX_TOP_PX + BOTTOM_CHROME_AIR_GAP_PX; // 108

/**
 * Shared `env()` fallback used by BottomNav padding and `bottomChromeCalc`.
 * WHY: One fallback (`0px`) so WebView inset=0 cannot drift between the bar and scroll clearance.
 */
export const SAFE_AREA_INSET_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

/** CSS `calc` bottom / padding-bottom that clears chrome + device safe-area. */
export function bottomChromeCalc(offsetPx: number): string {
  return `calc(${offsetPx}px + ${SAFE_AREA_INSET_BOTTOM})`;
}
