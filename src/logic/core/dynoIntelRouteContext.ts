import { ASSESSMENT_LOBBY_SIX_AXIS_MAP } from '../../config/assessmentLobby';
import { DYNO_INTEL_AXIS_ASSESSMENT_ROUTE } from '../../config/dynoIntelAxisRoutes';
import { ROUTES, type RoutePath } from '../../config/routes';
import type { SixAxisMetric } from '../../types/scoring';
import type { DynoIntelMode } from './dynoIntelTypes';

export type DynoConsoleLabelKey =
  | 'home'
  | 'lobby'
  | 'arena'
  | 'history'
  | 'tools'
  | 'strength'
  | 'grip'
  | 'ffmi'
  | 'explosive'
  | 'cardio'
  | 'muscle'
  | 'armSize'
  | 'generic';

export interface DynoRouteContext {
  consoleLabelKey: DynoConsoleLabelKey;
  focusAxis: SixAxisMetric | null;
  /** Default diagnostic mode for this surface — Pro users may upgrade to cross-axis in UI. */
  suggestedMode: DynoIntelMode;
}

const ASSESSMENT_ROUTE_TO_CONSOLE: Partial<Record<RoutePath, DynoConsoleLabelKey>> = {
  [ROUTES.strength]: 'strength',
  [ROUTES.grip]: 'grip',
  [ROUTES.ffmi]: 'ffmi',
  [ROUTES.explosive]: 'explosive',
  [ROUTES.cardio]: 'cardio',
  [ROUTES.muscle]: 'muscle',
  [ROUTES.armSize]: 'armSize',
};

function routeToFocusAxis(pathname: string): SixAxisMetric | null {
  const entries = Object.entries(DYNO_INTEL_AXIS_ASSESSMENT_ROUTE) as [SixAxisMetric, RoutePath][];
  const match = entries.find(([, route]) => route === pathname);
  return match?.[0] ?? null;
}

function lobbyCardKeyForPath(pathname: string): DynoConsoleLabelKey | null {
  const entries = Object.entries(ASSESSMENT_LOBBY_SIX_AXIS_MAP) as [
    keyof typeof ASSESSMENT_LOBBY_SIX_AXIS_MAP,
    SixAxisMetric,
  ][];
  for (const [cardKey, metric] of entries) {
    if (DYNO_INTEL_AXIS_ASSESSMENT_ROUTE[metric] === pathname) {
      return cardKey;
    }
  }
  return ASSESSMENT_ROUTE_TO_CONSOLE[pathname as RoutePath] ?? null;
}

/**
 * Maps current pathname to DYNO INTEL console label + focus axis.
 * WHY: Pure logic keeps `useDynoRouteContext` presentational and testable.
 */
export function resolveDynoRouteContext(pathname: string): DynoRouteContext {
  if (pathname === ROUTES.assessment) {
    return { consoleLabelKey: 'lobby', focusAxis: null, suggestedMode: 'cross-axis' };
  }
  if (pathname === ROUTES.home) {
    return { consoleLabelKey: 'home', focusAxis: null, suggestedMode: 'cross-axis' };
  }
  if (pathname === ROUTES.ladder || pathname.startsWith(`${ROUTES.ladder}/`)) {
    return { consoleLabelKey: 'arena', focusAxis: null, suggestedMode: 'cross-axis' };
  }
  if (pathname === ROUTES.history) {
    return { consoleLabelKey: 'history', focusAxis: null, suggestedMode: 'cross-axis' };
  }
  if (pathname === ROUTES.tools || pathname.startsWith('/training-tools')) {
    return { consoleLabelKey: 'tools', focusAxis: null, suggestedMode: 'single-axis' };
  }

  const focusAxis = routeToFocusAxis(pathname);
  if (focusAxis) {
    const consoleLabelKey = lobbyCardKeyForPath(pathname) ?? 'generic';
    return { consoleLabelKey, focusAxis, suggestedMode: 'single-axis' };
  }

  return { consoleLabelKey: 'generic', focusAxis: null, suggestedMode: 'single-axis' };
}
