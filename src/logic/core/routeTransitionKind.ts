import { NAV_ITEMS } from '../../config/nav.config';

/** Bottom-tab route paths — single source aligned with `NAV_ITEMS`. */
export const TAB_ROUTE_PATHS: readonly string[] = NAV_ITEMS.map((item) => item.path);

const TAB_ROUTE_PATH_SET = new Set<string>(TAB_ROUTE_PATHS);

export type TabSlideDirection = 'forward' | 'backward';

export type RouteTransitionKind = 'none' | 'tab-parallax' | 'reduced-tab-fade';

export function isTabRoutePath(pathname: string): boolean {
  return TAB_ROUTE_PATH_SET.has(pathname);
}

export function resolveTabRouteIndex(pathname: string): number | null {
  const index = NAV_ITEMS.findIndex((item) => item.path === pathname);
  return index >= 0 ? index : null;
}

/**
 * Tab bar order drives parallax direction (WHY: forward = new tab to the right in NAV_ITEMS).
 */
export function resolveTabSlideDirection(fromPath: string, toPath: string): TabSlideDirection {
  const fromIndex = resolveTabRouteIndex(fromPath);
  const toIndex = resolveTabRouteIndex(toPath);
  if (fromIndex == null || toIndex == null) return 'forward';
  return toIndex >= fromIndex ? 'forward' : 'backward';
}

/**
 * Pure transition classifier — only bottom-tab ↔ bottom-tab switches animate in P1.
 */
export function resolveRouteTransitionKind(
  fromPath: string,
  toPath: string,
  reducedMotion: boolean,
): RouteTransitionKind {
  if (fromPath === toPath) return 'none';
  if (!isTabRoutePath(fromPath) || !isTabRoutePath(toPath)) return 'none';
  return reducedMotion ? 'reduced-tab-fade' : 'tab-parallax';
}
