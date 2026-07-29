/**
 * Application routes — derived from `NAV_ITEMS` paths plus non-tab routes.
 */
import type { NavItemKey } from './nav.config';
import { NAV_ITEMS } from './nav.config';

const NAV_ROUTE_MAP = Object.fromEntries(NAV_ITEMS.map((item) => [item.key, item.path])) as Record<
  NavItemKey,
  string
>;

export const ROUTES = {
  root: '/' as const,
  authChoice: '/auth-choice' as const,
  settings: '/settings' as const,
  about: '/about' as const,
  contact: '/contact' as const,
  privacyPolicy: '/privacy-policy' as const,
  joinArena: '/join-arena' as const,
  admin: '/admin' as const,
  leaderboardDebug: '/debug/leaderboard' as const,
  ffmi: '/ffmi' as const,
  cardio: '/cardio' as const,
  muscle: '/muscle' as const,
  explosive: '/explosive' as const,
  strength: '/strength' as const,
  grip: '/grip' as const,
  armSize: '/arm-size' as const,
  oneRmCalculator: '/tools/one-rm' as const,
  plateCalculator: '/tools/plates' as const,
  somatotypeLab: '/tools/somatotype-lab' as const,
  ...NAV_ROUTE_MAP,
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Nested training-tool calculator routes (`/tools/one-rm`, …) — distinct from tab `ROUTES.tools`
 * (`/training-tools`). Used by Dyno Intel / deck context (`isToolsDeckRoutePath`); not by compact shell.
 */
export const TOOLS_CALCULATOR_PATH_PREFIX = '/tools' as const;

/** True for `/ladder` and nested ladder paths. */
export function isLadderRoutePath(pathname: string): boolean {
  return pathname === ROUTES.ladder || pathname.startsWith(`${ROUTES.ladder}/`);
}

/** True for `/join-arena` and nested join-arena paths. */
export function isJoinArenaRoutePath(pathname: string): boolean {
  return pathname === ROUTES.joinArena || pathname.startsWith(`${ROUTES.joinArena}/`);
}

/** Routes that use `spacing.shell-top-compact` on `#layer-shell-scroll` (home / arena / tools tab). */
export function isCompactShellRoutePath(pathname: string): boolean {
  return (
    isHomeRoutePath(pathname) ||
    isLadderRoutePath(pathname) ||
    isJoinArenaRoutePath(pathname) ||
    isToolsTabRoutePath(pathname)
  );
}

/** True for home tab (`/user-info`) and nested home paths. */
export function isHomeRoutePath(pathname: string): boolean {
  return pathname === ROUTES.home || pathname.startsWith(`${ROUTES.home}/`);
}

/**
 * Tools deck **tab only** (`/training-tools`).
 * WHY: Compact HUD clearance for the deck list. Calculator subpages keep full `shell-top`
 * so page titles clear the fixed HUD row (avatar + optional back).
 */
export function isToolsTabRoutePath(pathname: string): boolean {
  return pathname === ROUTES.tools || pathname.startsWith(`${ROUTES.tools}/`);
}

/** True for the assessment lobby tab (`/skill-tree`) and nested lobby paths. */
export function isAssessmentTabRoutePath(pathname: string): boolean {
  return pathname === ROUTES.assessment || pathname.startsWith(`${ROUTES.assessment}/`);
}

/** True for the history tab (`/history`) and nested history paths. */
export function isHistoryTabRoutePath(pathname: string): boolean {
  return pathname === ROUTES.history || pathname.startsWith(`${ROUTES.history}/`);
}

/**
 * Sub-pages that show the fixed HUD back control (left of avatar).
 * WHY: iOS has no system back affordance — primary bottom tabs must not show a redundant back,
 * while assessment/tools/settings stacks need a persistent top-left exit that survives scroll.
 */
export function isHudBackRoutePath(pathname: string): boolean {
  if (isHomeRoutePath(pathname)) return false;
  if (isLadderRoutePath(pathname)) return false;
  if (isAssessmentTabRoutePath(pathname)) return false;
  if (isHistoryTabRoutePath(pathname)) return false;
  if (isToolsTabRoutePath(pathname)) return false;
  if (pathname === ROUTES.root || pathname === ROUTES.authChoice) return false;
  return true;
}

/**
 * Tools deck tab + nested calculator routes under `/tools/…` (Dyno Intel / tooling context).
 * Not the same as compact-shell eligibility — see `isToolsTabRoutePath`.
 */
export function isToolsDeckRoutePath(pathname: string): boolean {
  return (
    isToolsTabRoutePath(pathname) ||
    pathname === TOOLS_CALCULATOR_PATH_PREFIX ||
    pathname.startsWith(`${TOOLS_CALCULATOR_PATH_PREFIX}/`)
  );
}

/** True for `/tools/plates` plate calculator. */
export function isPlateCalculatorRoutePath(pathname: string): boolean {
  return pathname === ROUTES.plateCalculator || pathname.startsWith(`${ROUTES.plateCalculator}/`);
}

/** True for `/tools/one-rm` 1RM calculator. */
export function isOneRmCalculatorRoutePath(pathname: string): boolean {
  return pathname === ROUTES.oneRmCalculator || pathname.startsWith(`${ROUTES.oneRmCalculator}/`);
}
