import { describe, expect, it } from 'vitest';
import {
  GLOBAL_TAB_ROUTE_DURATION_MS,
  GLOBAL_TAB_ROUTE_TRANSITION,
  globalTabRouteEnterVisible,
  globalTabRouteExitVisible,
  globalTabRouteWillChange,
} from '../globalRouteMotion';

describe('globalRouteMotion', () => {
  it('locks tab crossfade to 150ms opacity-only tokens', () => {
    expect(GLOBAL_TAB_ROUTE_DURATION_MS).toBe(150);
    expect(GLOBAL_TAB_ROUTE_TRANSITION).toContain('transition-opacity');
    expect(GLOBAL_TAB_ROUTE_TRANSITION).toContain('duration-150');
    expect(GLOBAL_TAB_ROUTE_TRANSITION).toContain('ease-report-ease');
  });

  it('maps exit and enter to pure opacity classes', () => {
    expect(globalTabRouteExitVisible(false)).toBe('opacity-100');
    expect(globalTabRouteExitVisible(true)).toBe('opacity-0');
    expect(globalTabRouteEnterVisible(false)).toBe('opacity-0');
    expect(globalTabRouteEnterVisible(true)).toBe('opacity-100');
  });

  it('limits compositor hints to opacity only', () => {
    expect(globalTabRouteWillChange(true)).toBe('will-change-opacity');
    expect(globalTabRouteWillChange(false)).toBe('');
  });
});
