import { describe, expect, it } from 'vitest';
import {
  getDefaultProjectForDivision,
  getLeaderboardShardId,
  getProjectOptionsForDivision,
  isValidLeaderboardShardId,
} from '../ladderShards';

describe('ladderShards', () => {
  it('maps fitness strength subdivisions to shard ids (legacy total → strength)', () => {
    expect(getLeaderboardShardId('stats_sbdTotal', 'total')).toBe('strength');
    expect(getLeaderboardShardId('stats_sbdTotal', 'total_five')).toBe('strength_totalFive');
    expect(getLeaderboardShardId('stats_sbdTotal', 'squat')).toBe('strength_squat');
    expect(getLeaderboardShardId('stats_sbdTotal', 'bench')).toBe('strength_bench');
    expect(getLeaderboardShardId('stats_sbdTotal', 'deadlift')).toBe('strength_deadlift');
    expect(getLeaderboardShardId('stats_sbdTotal', 'ohp')).toBe('strength_ohp');
    expect(getLeaderboardShardId('stats_sbdTotal', 'latPull')).toBe('strength_latPull');
  });

  it('maps cardio cooper vs 5km (legacy cooper → cardio)', () => {
    expect(getLeaderboardShardId('stats_cooper', 'cooper')).toBe('cardio');
    expect(getLeaderboardShardId('stats_cooper', '5km')).toBe('cardio_5km');
  });

  it('falls back to Cooper shard when cardio project is unknown', () => {
    expect(getLeaderboardShardId('stats_cooper', 'typo')).toBe('cardio');
  });

  it('maps explosive composite vs vertical vs broad vs sprint', () => {
    expect(getLeaderboardShardId('stats_vertical', 'composite')).toBe('explosive_composite');
    expect(getLeaderboardShardId('stats_vertical', 'vertical')).toBe('explosive_vertical');
    expect(getLeaderboardShardId('stats_vertical', 'broad')).toBe('explosive_broad');
    expect(getLeaderboardShardId('stats_vertical', 'sprint')).toBe('explosive_sprint');
  });

  it('maps body-fat zone (FFMI shard) and muscle smm modes', () => {
    expect(getLeaderboardShardId('stats_bodyFat', 'bodyFat')).toBe('bodyFat');
    expect(getLeaderboardShardId('stats_bodyFat', 'ffmi')).toBe('bodyFat_ffmi');
    expect(getLeaderboardShardId('stats_ffmi', 'score')).toBe('muscleMass');
    expect(getLeaderboardShardId('stats_ffmi', 'weight')).toBe('muscleMass_weightKg');
    expect(getLeaderboardShardId('stats_ffmi', 'ratio')).toBe('muscleMass_ratio');
  });

  it('resolves meta divisions and grip extension', () => {
    expect(getLeaderboardShardId('ladderScore', '__none__')).toBe('ladderScore');
    expect(getLeaderboardShardId('stats_totalLoginDays', '__none__')).toBe('totalLoginDays');
    expect(getLeaderboardShardId('armSize', '__none__')).toBe('armSize');
    expect(getLeaderboardShardId('stats_grip', 'grip')).toBe('gripStrength');
  });

  it('validates known shard ids', () => {
    expect(isValidLeaderboardShardId('strength_squat')).toBe(true);
    expect(isValidLeaderboardShardId('bogus')).toBe(false);
  });

  it('defaults projects per division', () => {
    expect(getDefaultProjectForDivision('stats_sbdTotal')).toBe('total');
    expect(getDefaultProjectForDivision('stats_cooper')).toBe('cooper');
    expect(getDefaultProjectForDivision('stats_vertical')).toBe('composite');
    expect(getDefaultProjectForDivision('stats_bodyFat')).toBe('ffmi');
    expect(getDefaultProjectForDivision('stats_ffmi')).toBe('score');
    expect(getDefaultProjectForDivision('stats_grip')).toBe('grip');
    expect(getDefaultProjectForDivision('ladderScore')).toBe('__none__');
  });

  it('exposes project option lists aligned with fitness sub-filters', () => {
    expect(getProjectOptionsForDivision('stats_sbdTotal').map((o) => o.value)).toEqual([
      'total_five',
      'total',
      'squat',
      'bench',
      'deadlift',
      'ohp',
      'latPull',
    ]);
    expect(getProjectOptionsForDivision('stats_cooper').map((o) => o.value)).toEqual(['cooper', '5km']);
    expect(getProjectOptionsForDivision('stats_bodyFat').map((o) => o.value)).toEqual(['ffmi']);
    expect(getProjectOptionsForDivision('stats_vertical').map((o) => o.value)).toEqual([
      'composite',
      'vertical',
      'broad',
      'sprint',
    ]);
    expect(getProjectOptionsForDivision('ladderScore')).toEqual([]);
  });
});
