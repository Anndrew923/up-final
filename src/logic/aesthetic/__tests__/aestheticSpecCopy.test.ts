import { describe, expect, it, vi } from 'vitest';
import {
  formatAestheticBfPct,
  resolveAestheticBandCopy,
  resolveAestheticVisualLine,
} from '../aestheticSpecCopy';

describe('aestheticSpecCopy', () => {
  it('formats body-fat to one decimal', () => {
    expect(formatAestheticBfPct(8)).toBe('8.0');
    expect(formatAestheticBfPct(12.34)).toBe('12.3');
  });

  it('resolves band copy and visual line with shared keys', () => {
    const t = vi.fn((key: string, opts?: { bf?: string; subtitle?: string; note?: string }) => {
      if (key === 'aesthetic.labels.bodyFatValue') return `BF ${opts?.bf}%`;
      if (key === 'aesthetic.labels.visualLineWithNote') {
        return `${opts?.subtitle} · ${opts?.note}`;
      }
      return key;
    }) as unknown as typeof import('i18next').t;

    expect(resolveAestheticBandCopy(t, 'force', 'male', '80').title).toBe(
      'aesthetic.force.m.80.title'
    );
    expect(
      resolveAestheticVisualLine(t, {
        visualSubtitle: 'Assassin',
        unmeasured: false,
        bodyFatMissing: false,
        bodyFatPct: 10,
      })
    ).toBe('Assassin · BF 10.0%');
  });
});
