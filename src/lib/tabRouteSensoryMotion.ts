import { GLOBAL_TAB_ROUTE_DURATION_MS } from './globalRouteMotion';

/** Progress bar scale at sprint phase (spec: snap to 85%). */
export const TAB_ROUTE_PROGRESS_SPRINT_SCALE = 0.85;

export const TAB_ROUTE_PROGRESS_SPRINT_MS = 90;
export const TAB_ROUTE_PROGRESS_SETTLE_MS = 120;
export const TAB_ROUTE_PROGRESS_FADE_MS = 100;

/** Crossfade window — must mirror ShellAnimatedOutlet timer (single clock). */
export const TAB_ROUTE_CROSSFADE_MS = GLOBAL_TAB_ROUTE_DURATION_MS;

export const TAB_ROUTE_PROGRESS_TRANSITION =
  'motion-safe:transition-[transform,opacity] motion-safe:ease-report-ease motion-reduce:transition-none';

export const TAB_ROUTE_PROGRESS_TOP =
  'top-[calc(env(safe-area-inset-top,0px)+3.5rem)]';
