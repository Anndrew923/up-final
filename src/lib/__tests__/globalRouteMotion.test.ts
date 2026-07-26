import { describe, expect, it } from 'vitest';
import {
  GLOBAL_TAB_ROUTE_DURATION_MS,
  GLOBAL_TAB_ROUTE_TRANSITION,
  TAB_ROUTE_INSTANT,
  globalTabRouteEnterVisible,
  globalTabRouteWillChange,
} from '../globalRouteMotion';

describe('globalRouteMotion', () => {
  it('locks tab enter to ≤120ms opacity-only tokens', () => {
    expect(GLOBAL_TAB_ROUTE_DURATION_MS).toBe(120);
    expect(GLOBAL_TAB_ROUTE_DURATION_MS).toBeLessThanOrEqual(120);
    expect(GLOBAL_TAB_ROUTE_TRANSITION).toContain('transition-opacity');
    expect(GLOBAL_TAB_ROUTE_TRANSITION).toContain('duration-[120ms]');
    expect(GLOBAL_TAB_ROUTE_TRANSITION).toContain('ease-report-ease');
  });

  it('defaults instant switch off (opt-in via TAB_ROUTE_INSTANT)', () => {
    expect(TAB_ROUTE_INSTANT).toBe(false);
  });

  it('maps enter to pure opacity classes', () => {
    expect(globalTabRouteEnterVisible(false)).toBe('opacity-0');
    expect(globalTabRouteEnterVisible(true)).toBe('opacity-100');
  });

  it('limits compositor hints to opacity only', () => {
    expect(globalTabRouteWillChange(true)).toBe('will-change-opacity');
    expect(globalTabRouteWillChange(false)).toBe('');
  });
});
