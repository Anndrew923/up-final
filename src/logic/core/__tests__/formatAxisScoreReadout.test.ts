import { describe, expect, it } from 'vitest';
import { formatAxisScoreReadout } from '../formatAxisScoreReadout';

describe('formatAxisScoreReadout', () => {
  it('keeps HUD contract: bare integers, 2dp fractions, em dash empty', () => {
    expect(formatAxisScoreReadout(undefined)).toBe('—');
    expect(formatAxisScoreReadout(Number.NaN)).toBe('—');
    expect(formatAxisScoreReadout(91)).toBe('91');
    expect(formatAxisScoreReadout(81.57)).toBe('81.57');
    expect(formatAxisScoreReadout(84.8)).toBe('84.80');
  });
});
