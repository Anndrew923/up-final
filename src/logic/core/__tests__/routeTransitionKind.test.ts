import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../config/routes';
import {
  isTabRoutePath,
  resolveRouteTransitionKind,
  resolveTabRouteIndex,
  resolveTabSlideDirection,
  TAB_ROUTE_PATHS,
} from '../routeTransitionKind';

describe('routeTransitionKind', () => {
  it('lists exactly five bottom-tab paths from NAV_ITEMS', () => {
    expect(TAB_ROUTE_PATHS).toHaveLength(5);
    expect(isTabRoutePath(ROUTES.home)).toBe(true);
    expect(isTabRoutePath(ROUTES.settings)).toBe(false);
  });

  it('resolves tab indices in nav order', () => {
    expect(resolveTabRouteIndex(ROUTES.home)).toBe(0);
    expect(resolveTabRouteIndex(ROUTES.tools)).toBe(1);
    expect(resolveTabRouteIndex(ROUTES.assessment)).toBe(2);
    expect(resolveTabRouteIndex(ROUTES.ladder)).toBe(3);
    expect(resolveTabRouteIndex(ROUTES.history)).toBe(4);
    expect(resolveTabRouteIndex(ROUTES.strength)).toBeNull();
  });

  it('derives forward/backward slide from tab index delta', () => {
    expect(resolveTabSlideDirection(ROUTES.home, ROUTES.ladder)).toBe('forward');
    expect(resolveTabSlideDirection(ROUTES.history, ROUTES.home)).toBe('backward');
    expect(resolveTabSlideDirection(ROUTES.ladder, ROUTES.ladder)).toBe('forward');
  });

  it('classifies only tab-to-tab transitions', () => {
    expect(resolveRouteTransitionKind(ROUTES.home, ROUTES.ladder, false)).toBe('tab-parallax');
    expect(resolveRouteTransitionKind(ROUTES.home, ROUTES.ladder, true)).toBe('reduced-tab-fade');
    expect(resolveRouteTransitionKind(ROUTES.home, ROUTES.settings, false)).toBe('none');
    expect(resolveRouteTransitionKind(ROUTES.strength, ROUTES.home, false)).toBe('none');
    expect(resolveRouteTransitionKind(ROUTES.home, ROUTES.home, false)).toBe('none');
  });
});
