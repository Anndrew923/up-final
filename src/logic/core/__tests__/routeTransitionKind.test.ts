import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../config/routes';
import {
  isTabRoutePath,
  isTabRouteTransition,
  resolveRouteTransitionKind,
  resolveTabRouteIndex,
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

  it('detects tab-to-tab transitions regardless of reduced motion', () => {
    expect(isTabRouteTransition(ROUTES.home, ROUTES.ladder)).toBe(true);
    expect(isTabRouteTransition(ROUTES.home, ROUTES.home)).toBe(false);
    expect(isTabRouteTransition(ROUTES.home, ROUTES.settings)).toBe(false);
  });

  it('classifies tab-to-tab as crossfade and skips reduced motion (Strategy A)', () => {
    expect(resolveRouteTransitionKind(ROUTES.home, ROUTES.ladder, false)).toBe('tab-crossfade');
    expect(resolveRouteTransitionKind(ROUTES.home, ROUTES.ladder, true)).toBe('none');
    expect(resolveRouteTransitionKind(ROUTES.home, ROUTES.settings, false)).toBe('none');
    expect(resolveRouteTransitionKind(ROUTES.strength, ROUTES.home, false)).toBe('none');
    expect(resolveRouteTransitionKind(ROUTES.home, ROUTES.home, false)).toBe('none');
  });
});
