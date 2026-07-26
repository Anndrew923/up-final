/**
 * Tab route enter motion tokens.
 * WHY: Single clock for ShellAnimatedOutlet + sensory settle — keep ≤120ms for snappy tab UX.
 */

/** Set true for 0ms tab content swap (no opacity enter). */
export const TAB_ROUTE_INSTANT = false;

/** Opacity enter window (100–120ms band). Ignored when `TAB_ROUTE_INSTANT`. */
export const GLOBAL_TAB_ROUTE_DURATION_MS = 120;

export const GLOBAL_TAB_ROUTE_TRANSITION =
  'motion-safe:transition-opacity motion-safe:duration-[120ms] motion-safe:ease-report-ease motion-reduce:transition-none';

/** Compositor hint — active only for the tab enter window. */
export function globalTabRouteWillChange(active: boolean): string {
  return active ? 'will-change-opacity' : '';
}

export function globalTabRouteEnterVisible(entered: boolean): string {
  return entered ? 'opacity-100' : 'opacity-0';
}
