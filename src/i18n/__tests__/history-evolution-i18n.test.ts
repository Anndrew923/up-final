import { describe, expect, it } from 'vitest';
import enHistory from '../locales/en/common/history.json';
import zhHistory from '../locales/zh-Hant/common/history.json';

function sectionKeys(
  bundle: { history?: Record<string, unknown> },
  section: 'evolution' | 'archive'
): string[] {
  const block = bundle.history?.[section];
  if (!block || typeof block !== 'object') return [];
  return Object.keys(block as Record<string, unknown>).sort();
}

describe('history.evolution / archive i18n parity', () => {
  it('keeps zh-Hant and en evolution key sets identical', () => {
    expect(sectionKeys(zhHistory, 'evolution')).toEqual(sectionKeys(enHistory, 'evolution'));
  });

  it('keeps zh-Hant and en archive key sets identical', () => {
    expect(sectionKeys(zhHistory, 'archive')).toEqual(sectionKeys(enHistory, 'archive'));
  });

  it('exposes legend, collapse, shareButton, and archive copy for both locales', () => {
    for (const bundle of [zhHistory, enHistory]) {
      const evo = bundle.history.evolution;
      const archive = bundle.history.archive;
      expect(evo.legendBaseline).toContain('{{date}}');
      expect(evo.legendCurrent).toContain('{{date}}');
      expect(evo.collapsedOverall).toContain('{{from}}');
      expect(evo.collapsedBaseline).toContain('{{label}}');
      expect(evo.day1BaselineShort).toBe('DAY 1');
      expect(typeof evo.shareButton).toBe('string');
      expect(evo.shareButton.length).toBeGreaterThan(0);
      expect(archive.kicker).toBe('DYNO ARCHIVE');
      expect(archive.collapsedCount).toContain('{{count}}');
      expect(archive.collapsedBest).toContain('{{bestScore}}');
    }
    expect(enHistory.history.evolution.shareButton).toBe('Share evolution');
    expect(zhHistory.history.evolution.shareButton).toBe('分享進化');
    expect('shareShort' in enHistory.history.evolution).toBe(false);
    expect('share' in enHistory.history.evolution).toBe(false);
    expect('shareShort' in zhHistory.history.evolution).toBe(false);
    expect('share' in zhHistory.history.evolution).toBe(false);
  });
});
