import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { resolveHomeSubsectionString } from '../resolveHomeBundleCopy';

describe('resolveHomeSubsectionString interpolation fallback', () => {
  it('manual-interpolates template when dotted t() returns unresolved key', () => {
    const mockT = ((key: string, opts?: Record<string, unknown>) => {
      if (opts?.returnObjects === true && key === 'home.profile') {
        return {
          collapsedSummary: '{{gender}} · {{age}} 歲 · {{height}} cm · {{weight}} kg',
        };
      }
      if (key === 'home.profile.collapsedSummary') {
        return 'home.profile.collapsedSummary';
      }
      return key;
    }) as TFunction;

    const summary = resolveHomeSubsectionString(mockT, 'profile', 'collapsedSummary', {
      gender: '男',
      age: '39',
      height: '180',
      weight: '92.8',
    });

    expect(summary).toBe('男 · 39 歲 · 180 cm · 92.8 kg');
    expect(summary).not.toContain('home.profile');
  });
});
