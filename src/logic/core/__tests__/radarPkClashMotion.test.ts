import { describe, expect, it } from 'vitest';
import {
  RADAR_PK_CLASH_MOTION,
  resolveRadarPkCompareExitMs,
  resolveRadarPkScanMs,
} from '../radarPkClashMotion';

describe('resolveRadarPkCompareExitMs', () => {
  it('keeps the soft-exit hold when motion is allowed', () => {
    expect(resolveRadarPkCompareExitMs(false)).toBe(RADAR_PK_CLASH_MOTION.compareExitMs);
  });

  it('skips exit hold under prefers-reduced-motion', () => {
    expect(resolveRadarPkCompareExitMs(true)).toBe(0);
  });
});

describe('resolveRadarPkScanMs', () => {
  it('keeps the diagnostic scan veil when motion is allowed', () => {
    expect(resolveRadarPkScanMs(false)).toBe(RADAR_PK_CLASH_MOTION.scanMs);
  });

  it('skips scan veil under prefers-reduced-motion', () => {
    expect(resolveRadarPkScanMs(true)).toBe(0);
  });
});
