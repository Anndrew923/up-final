export const GLOBAL_TAB_ROUTE_DURATION_MS = 150;

export const GLOBAL_TAB_ROUTE_TRANSITION =
  'motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-report-ease motion-reduce:transition-none';

/** Compositor hint — active only for the tab crossfade window. */
export function globalTabRouteWillChange(active: boolean): string {
  return active ? 'will-change-opacity' : '';
}

export function globalTabRouteExitVisible(fadingOut: boolean): string {
  return fadingOut ? 'opacity-0' : 'opacity-100';
}

export function globalTabRouteEnterVisible(entered: boolean): string {
  return entered ? 'opacity-100' : 'opacity-0';
}
