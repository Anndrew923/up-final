import {
  ROUTES,
  isJoinArenaRoutePath,
  isOneRmCalculatorRoutePath,
  isPlateCalculatorRoutePath,
  type RoutePath,
} from '../config/routes';
import { parseJoinArenaFrom, resolveJoinArenaReturnTo } from './joinArenaNavigation';

const ASSESSMENT_SUBPAGE_PATHS: ReadonlySet<string> = new Set([
  ROUTES.cardio,
  ROUTES.muscle,
  ROUTES.explosive,
  ROUTES.strength,
  ROUTES.grip,
  ROUTES.armSize,
  ROUTES.ffmi,
]);

const SETTINGS_STACK_PATHS: ReadonlySet<string> = new Set([
  ROUTES.about,
  ROUTES.contact,
  ROUTES.privacyPolicy,
]);

/**
 * True when React Router has a prior entry we can pop (`history.state.idx > 0`).
 * WHY: Cold opens / deep links have idx 0 — `navigate(-1)` would leave the WebView.
 */
export function canNavigateHistoryBack(historyState: unknown): boolean {
  const idx = (historyState as { idx?: number } | null)?.idx;
  return typeof idx === 'number' && idx > 0;
}

/**
 * Fallback destination when there is no in-app history to pop.
 * WHY: Keeps HUD back / Android back aligned with each surface's parent tab or funnel returnTo.
 */
export function resolveHudBackFallback(pathname: string, search = ''): RoutePath {
  if (isJoinArenaRoutePath(pathname)) {
    return resolveJoinArenaReturnTo(parseJoinArenaFrom(search), search);
  }
  if (
    isOneRmCalculatorRoutePath(pathname) ||
    isPlateCalculatorRoutePath(pathname) ||
    pathname === ROUTES.somatotypeLab ||
    pathname.startsWith(`${ROUTES.somatotypeLab}/`)
  ) {
    return ROUTES.tools;
  }
  if (ASSESSMENT_SUBPAGE_PATHS.has(pathname)) {
    return ROUTES.assessment;
  }
  if (SETTINGS_STACK_PATHS.has(pathname)) {
    return ROUTES.settings;
  }
  return ROUTES.home;
}
