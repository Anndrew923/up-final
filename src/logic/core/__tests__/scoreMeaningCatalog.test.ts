import { describe, expect, it } from 'vitest';
import { resolveScoreBand } from '../scoreMeaningCatalog';

describe('resolveScoreBand(cardio)', () => {
  it('maps boundary and float gap around 41 correctly', () => {
    expect(resolveScoreBand('cardio', 40.0).id).toBe('BASE');
    expect(resolveScoreBand('cardio', 40.1).id).toBe('BASE');
    expect(resolveScoreBand('cardio', 40.9).id).toBe('BASE');
    expect(resolveScoreBand('cardio', 41.0).id).toBe('TIER_41');
  });

  it('maps overflow values to LEGEND', () => {
    expect(resolveScoreBand('cardio', 151.0).id).toBe('LEGEND');
    expect(resolveScoreBand('cardio', 160.0).id).toBe('LEGEND');
  });

  it('maps 5km-mid benchmark score 80 to TIER_81', () => {
    expect(resolveScoreBand('cardio', 79.9).id).toBe('TIER_71');
    expect(resolveScoreBand('cardio', 80.0).id).toBe('TIER_81');
  });

  it('maps zero to BASE', () => {
    expect(resolveScoreBand('cardio', 0).id).toBe('BASE');
  });

  it('bridges high-end float gap before LEGEND', () => {
    expect(resolveScoreBand('cardio', 150.5).id).toBe('TIER_141');
  });
});
