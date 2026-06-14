import { NAV_ITEMS } from '../../config/nav.config';

/** Bottom-tab route paths — single source aligned with `NAV_ITEMS`. */
export const TAB_ROUTE_PATHS: readonly string[] = NAV_ITEMS.map((item) => item.path);

const TAB_ROUTE_PATH_SET = new Set<string>(TAB_ROUTE_PATHS);

export type RouteTransitionKind = 'none' | 'tab-crossfade';

export function isTabRoutePath(pathname: string): boolean {
  return TAB_ROUTE_PATH_SET.has(pathname);
}

/** True when both endpoints are bottom tabs and the path actually changes. */
export function isTabRouteTransition(fromPath: string, toPath: string): boolean {
  if (fromPath === toPath) return false;
  return isTabRoutePath(fromPath) && isTabRoutePath(toPath);
}

export function resolveTabRouteIndex(pathname: string): number | null {
  const index = NAV_ITEMS.findIndex((item) => item.path === pathname);
  return index >= 0 ? index : null;
}

/**
 * Pure transition classifier — only bottom-tab ↔ bottom-tab switches animate in P1.
 * Reduced motion (Strategy A): instant swap, no fade.
 */
export function resolveRouteTransitionKind(
  fromPath: string,
  toPath: string,
  reducedMotion: boolean,
): RouteTransitionKind {
  if (reducedMotion) return 'none';
  if (fromPath === toPath) return 'none';
  if (!isTabRoutePath(fromPath) || !isTabRoutePath(toPath)) return 'none';
  return 'tab-crossfade';
}
