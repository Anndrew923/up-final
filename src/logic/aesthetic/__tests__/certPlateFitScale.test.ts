import { describe, expect, it } from 'vitest';
import { resolveCertPlateFitScale } from '../certPlateFitScale';

describe('resolveCertPlateFitScale', () => {
  it('fits 1080×1920 into a shorter viewport without cropping', () => {
    // Phone stage ≈ 360×640 — scale must be width-bound (360/1080).
    expect(resolveCertPlateFitScale(360, 640, 1080, 1920)).toBeCloseTo(360 / 1080, 6);
  });

  it('fits 1080×1350 into a width-limited feed viewport', () => {
    expect(resolveCertPlateFitScale(300, 500, 1080, 1350)).toBeCloseTo(300 / 1080, 6);
  });

  it('is height-bound when the viewport is wide but short', () => {
    expect(resolveCertPlateFitScale(900, 400, 1080, 1920)).toBeCloseTo(400 / 1920, 6);
  });

  it('returns 0 for non-positive dimensions', () => {
    expect(resolveCertPlateFitScale(0, 640, 1080, 1920)).toBe(0);
    expect(resolveCertPlateFitScale(360, 640, 0, 1920)).toBe(0);
  });
});
