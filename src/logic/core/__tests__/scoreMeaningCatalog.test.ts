import { describe, expect, it } from 'vitest';
import { resolveScoreBand, SCORE_MEANING_CATALOG } from '../scoreMeaningCatalog';

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

describe('resolveScoreBand(strength)', () => {
  it('keeps the full 13-tier racing spec map', () => {
    const ids = SCORE_MEANING_CATALOG.strength.map((band) => band.id);
    expect(ids).toEqual([
      'BASE',
      'TIER_41',
      'TIER_51',
      'TIER_61',
      'TIER_71',
      'TIER_81',
      'TIER_91',
      'TIER_101',
      'TIER_111',
      'TIER_121',
      'TIER_131',
      'TIER_141',
      'LEGEND',
    ]);
  });

  it('maps all requested boundary checkpoints to expected tiers', () => {
    const checkpoints: Array<[number, string]> = [
      [40, 'BASE'],
      [41, 'TIER_41'],
      [50, 'TIER_41'],
      [51, 'TIER_51'],
      [60, 'TIER_51'],
      [61, 'TIER_61'],
      [70, 'TIER_61'],
      [71, 'TIER_71'],
      [80, 'TIER_71'],
      [81, 'TIER_81'],
      [90, 'TIER_81'],
      [91, 'TIER_91'],
      [100, 'TIER_91'],
      [101, 'TIER_101'],
      [110, 'TIER_101'],
      [111, 'TIER_111'],
      [120, 'TIER_111'],
      [121, 'TIER_121'],
      [130, 'TIER_121'],
      [131, 'TIER_131'],
      [140, 'TIER_131'],
      [141, 'TIER_141'],
      [150, 'TIER_141'],
      [151, 'LEGEND'],
    ];

    for (const [score, expectedBand] of checkpoints) {
      expect(resolveScoreBand('strength', score).id).toBe(expectedBand);
    }
  });

  it('bridges decimal gaps correctly around transitions', () => {
    expect(resolveScoreBand('strength', 40.9).id).toBe('BASE');
    expect(resolveScoreBand('strength', 50.9).id).toBe('TIER_41');
    expect(resolveScoreBand('strength', 150.5).id).toBe('TIER_141');
  });
});
