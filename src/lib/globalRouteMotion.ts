import type { TabSlideDirection } from '../logic/core/routeTransitionKind';

export const GLOBAL_TAB_ROUTE_DURATION_MS = 300;
export const GLOBAL_TAB_ROUTE_REDUCED_DURATION_MS = 150;

/** Midpoint of spec range 8%–12% exit drift. */
export const GLOBAL_TAB_EXIT_TRANSLATE_PERCENT = 10;

export const GLOBAL_TAB_ENTER_TRANSLATE_PERCENT = 12;

export const GLOBAL_TAB_EXIT_OPACITY = 0.3;

export const GLOBAL_TAB_ROUTE_TRANSITION =
  'motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-report-ease motion-reduce:transition-none';

export const GLOBAL_TAB_ROUTE_REDUCED_TRANSITION =
  'motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-report-ease motion-reduce:transition-none';

/** Compositor hint — active only for the tab transition window. */
export function globalTabRouteWillChange(active: boolean): string {
  return active ? 'will-change-[transform,opacity]' : '';
}

export function globalTabRouteExitVisible(
  animatingOut: boolean,
  direction: TabSlideDirection,
): string {
  if (!animatingOut) return 'translate-x-0 opacity-100';
  return direction === 'forward'
    ? '-translate-x-[10%] opacity-30'
    : 'translate-x-[10%] opacity-30';
}

export function globalTabRouteEnterVisible(
  entered: boolean,
  direction: TabSlideDirection,
): string {
  if (entered) return 'translate-x-0 opacity-100';
  return direction === 'forward'
    ? 'translate-x-[12%] opacity-0'
    : '-translate-x-[12%] opacity-0';
}

export function globalTabRouteReducedVisible(entered: boolean): string {
  return entered ? 'opacity-100' : 'opacity-0';
}
