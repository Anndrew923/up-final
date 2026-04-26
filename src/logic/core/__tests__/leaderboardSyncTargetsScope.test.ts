import { describe, expect, it } from 'vitest';
import {
  mergeLeaderboardSyncTargetsWithSupplemental,
  pickLeaderboardSyncTargetsForAssessmentScope,
  type LeaderboardSyncTarget,
} from '../leaderboardSyncTargets';

describe('pickLeaderboardSyncTargetsForAssessmentScope', () => {
  const mixed: LeaderboardSyncTarget[] = [
    { metric: 'explosive_composite', score: 80 },
    { metric: 'explosive_vertical', score: 70 },
    { metric: 'strength', score: 60 },
    { metric: 'cardio', score: 55 },
  ];

  it('keeps only explosive shards for explosivePower scope', () => {
    const picked = pickLeaderboardSyncTargetsForAssessmentScope(mixed, 'explosivePower');
    expect(picked.map((t) => t.metric).sort()).toEqual(['explosive_composite', 'explosive_vertical']);
  });

  it('keeps strength family for strength scope', () => {
    const strengthMix: LeaderboardSyncTarget[] = [
      { metric: 'strength', score: 10 },
      { metric: 'strength_bench', score: 11 },
      { metric: 'muscleMass', score: 12 },
    ];
    const picked = pickLeaderboardSyncTargetsForAssessmentScope(strengthMix, 'strength');
    expect(picked.map((t) => t.metric).sort()).toEqual(['strength', 'strength_bench']);
  });
});

describe('mergeLeaderboardSyncTargetsWithSupplemental', () => {
  it('returns base when supplemental is empty', () => {
    const base: LeaderboardSyncTarget[] = [{ metric: 'armSize', score: 40 }];
    expect(mergeLeaderboardSyncTargetsWithSupplemental(base, undefined)).toEqual(base);
    expect(mergeLeaderboardSyncTargetsWithSupplemental(base, [])).toEqual(base);
  });

  it('adds supplemental when base lacks the metric', () => {
    const merged = mergeLeaderboardSyncTargetsWithSupplemental([], [{ metric: 'armSize', score: 42 }]);
    expect(merged).toEqual([{ metric: 'armSize', score: 42 }]);
  });

  it('supplemental overwrites same metric', () => {
    const merged = mergeLeaderboardSyncTargetsWithSupplemental(
      [{ metric: 'armSize', score: 40 }],
      [{ metric: 'armSize', score: 50 }]
    );
    expect(merged).toEqual([{ metric: 'armSize', score: 50 }]);
  });

  it('ignores non-positive supplemental scores', () => {
    const merged = mergeLeaderboardSyncTargetsWithSupplemental(
      [{ metric: 'armSize', score: 40 }],
      [{ metric: 'armSize', score: 0 }]
    );
    expect(merged).toEqual([{ metric: 'armSize', score: 40 }]);
  });
});
