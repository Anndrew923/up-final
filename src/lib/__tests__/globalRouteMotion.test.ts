import { describe, expect, it } from 'vitest';
import {
  globalTabRouteEnterVisible,
  globalTabRouteExitVisible,
  globalTabRouteReducedVisible,
} from '../globalRouteMotion';

describe('globalRouteMotion', () => {
  it('maps forward parallax to left exit and right enter', () => {
    expect(globalTabRouteExitVisible(true, 'forward')).toContain('-translate-x-[10%]');
    expect(globalTabRouteExitVisible(true, 'forward')).toContain('opacity-30');
    expect(globalTabRouteEnterVisible(false, 'forward')).toContain('translate-x-[12%]');
    expect(globalTabRouteEnterVisible(true, 'forward')).toContain('opacity-100');
  });

  it('mirrors parallax for backward tab navigation', () => {
    expect(globalTabRouteExitVisible(true, 'backward')).toContain('translate-x-[10%]');
    expect(globalTabRouteEnterVisible(false, 'backward')).toContain('-translate-x-[12%]');
  });

  it('reduced motion uses opacity-only classes', () => {
    expect(globalTabRouteReducedVisible(false)).toBe('opacity-0');
    expect(globalTabRouteReducedVisible(true)).toBe('opacity-100');
  });
});
