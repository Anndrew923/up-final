import { describe, expect, it } from 'vitest';
import { buildFocusAxisLexicon, getAxisSurfaceLabel } from '../dynoIntelAxisLexicon';

describe('buildFocusAxisLexicon', () => {
  it('maps bodyFat to FFMI surface label in zh-Hant', () => {
    expect(buildFocusAxisLexicon('bodyFat', 'zh-Hant')).toEqual({
      axis: 'bodyFat',
      telemetryKey: 'bodyFat',
      surfaceLabel: 'FFMI / 引擎排量 (bodyFat 軸分數)',
    });
  });

  it('returns null when focus axis is absent', () => {
    expect(buildFocusAxisLexicon(null, 'en')).toBeNull();
    expect(buildFocusAxisLexicon(undefined, 'en')).toBeNull();
  });

  it('exposes English surface labels', () => {
    expect(getAxisSurfaceLabel('bodyFat', 'en')).toContain('FFMI');
  });
});
