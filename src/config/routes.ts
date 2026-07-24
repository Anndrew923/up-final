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

/** Routes that use `spacing.shell-top-compact` on `#layer-shell-scroll` (home / arena / tools tab). */
export function isCompactShellRoutePath(pathname: string): boolean {
  return (
    isHomeRoutePath(pathname) ||
    isLadderRoutePath(pathname) ||
    pathname === ROUTES.joinArena ||
    pathname.startsWith(`${ROUTES.joinArena}/`) ||
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
 * so their top-right「返回」clears the fixed HUD avatar row (no overlap).
 */
export function isToolsTabRoutePath(pathname: string): boolean {
  return pathname === ROUTES.tools || pathname.startsWith(`${ROUTES.tools}/`);
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
