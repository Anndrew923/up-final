import { ASSESSMENT_LOBBY_SIX_AXIS_MAP } from '../../config/assessmentLobby';
import { DYNO_INTEL_AXIS_ASSESSMENT_ROUTE } from '../../config/dynoIntelAxisRoutes';
import { ROUTES, type RoutePath } from '../../config/routes';
import type { CardioAssessmentTab } from './cardioScoring';
import type { DynoSupplementalMetricId } from './dynoIntelTypes';
import type { SixAxisMetric } from '../../types/scoring';
import type { DynoIntelMode } from './dynoIntelTypes';

export interface ResolveDynoRouteContextOptions {
  /** Persisted Cooper / 5km tab when pathname is cardio assessment. */
  cardioActiveTab?: CardioAssessmentTab;
}

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
  /** UI / placeholder hint only — inference always uses cross-axis (v2.4.2). */
  focusAxis: SixAxisMetric | null;
  /** UI hint for supplemental copy — not sent to Callable inference context. */
  focusSupplemental: DynoSupplementalMetricId | null;
  /** Legacy route metadata — DynoIntelConsole no longer binds chat mode to this field. */
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
export function resolveDynoRouteContext(
  pathname: string,
  options?: ResolveDynoRouteContextOptions
): DynoRouteContext {
  if (pathname === ROUTES.assessment) {
    return {
      consoleLabelKey: 'lobby',
      focusAxis: null,
      focusSupplemental: null,
      suggestedMode: 'cross-axis',
    };
  }
  if (pathname === ROUTES.home) {
    return {
      consoleLabelKey: 'home',
      focusAxis: null,
      focusSupplemental: null,
      suggestedMode: 'cross-axis',
    };
  }
  if (pathname === ROUTES.ladder || pathname.startsWith(`${ROUTES.ladder}/`)) {
    return {
      consoleLabelKey: 'arena',
      focusAxis: null,
      focusSupplemental: null,
      suggestedMode: 'cross-axis',
    };
  }
  if (pathname === ROUTES.history) {
    return {
      consoleLabelKey: 'history',
      focusAxis: null,
      focusSupplemental: null,
      suggestedMode: 'cross-axis',
    };
  }
  if (pathname === ROUTES.tools || pathname.startsWith('/training-tools')) {
    return {
      consoleLabelKey: 'tools',
      focusAxis: null,
      focusSupplemental: null,
      suggestedMode: 'single-axis',
    };
  }
  if (pathname === ROUTES.armSize) {
    return {
      consoleLabelKey: 'armSize',
      focusAxis: null,
      focusSupplemental: 'armSize',
      suggestedMode: 'single-axis',
    };
  }
  if (pathname === ROUTES.cardio) {
    const tab = options?.cardioActiveTab ?? 'cooper';
    return {
      consoleLabelKey: 'cardio',
      focusAxis: 'cardio',
      focusSupplemental: tab,
      suggestedMode: 'single-axis',
    };
  }

  const focusAxis = routeToFocusAxis(pathname);
  if (focusAxis) {
    const consoleLabelKey = lobbyCardKeyForPath(pathname) ?? 'generic';
    return {
      consoleLabelKey,
      focusAxis,
      focusSupplemental: null,
      suggestedMode: 'single-axis',
    };
  }

  return {
    consoleLabelKey: 'generic',
    focusAxis: null,
    focusSupplemental: null,
    suggestedMode: 'single-axis',
  };
}
