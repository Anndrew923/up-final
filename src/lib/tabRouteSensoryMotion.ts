import { GLOBAL_TAB_ROUTE_DURATION_MS } from './globalRouteMotion';

/**
 * WHY: Progress strip previously outlived the page enter (felt like lag).
 * Default off — re-enable only with a timeline ≤ enter window.
 */
export const TAB_ROUTE_SHOW_PROGRESS_BAR = false;

/** Progress bar scale at sprint phase (spec: snap to 85%). */
export const TAB_ROUTE_PROGRESS_SPRINT_SCALE = 0.85;

/** Kept ≤ enter window so re-enabling cannot recreate follow-lag. */
export const TAB_ROUTE_PROGRESS_SPRINT_MS = 70;
export const TAB_ROUTE_PROGRESS_SETTLE_MS = 30;
export const TAB_ROUTE_PROGRESS_FADE_MS = 20;

/** Enter window — must mirror ShellAnimatedOutlet timer (single clock). */
export const TAB_ROUTE_ENTER_MS = GLOBAL_TAB_ROUTE_DURATION_MS;

export const TAB_ROUTE_PROGRESS_TRANSITION =
  'motion-safe:transition-[transform,opacity] motion-safe:ease-report-ease motion-reduce:transition-none';

export const TAB_ROUTE_PROGRESS_TOP =
  'top-[calc(env(safe-area-inset-top,0px)+3.5rem)]';
