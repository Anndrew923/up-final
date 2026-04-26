import { describe, expect, it } from 'vitest';
import {
  LEADERBOARD_SHARD_EXPLOSIVE_COMPOSITE,
  LEADERBOARD_SHARD_FFMI,
  LEADERBOARD_SHARD_OVERALL,
  LEADERBOARD_SHARD_STRENGTH_TOTAL_FIVE,
  leaderboardShardForArmSize,
  leaderboardShardForCardioTab,
  leaderboardShardForSixAxisMetric,
  leaderboardShardForStrengthLift,
} from '../assessmentLeaderboardShards';

describe('assessmentLeaderboardShards', () => {
  it('maps six-axis metrics to expected shards', () => {
    expect(leaderboardShardForSixAxisMetric('gripStrength')).toBe('gripStrength');
    expect(leaderboardShardForSixAxisMetric('strength')).toBe('strength');
    expect(leaderboardShardForSixAxisMetric('cardio')).toBe('cardio');
    expect(leaderboardShardForSixAxisMetric('explosivePower')).toBe('explosive_composite');
    expect(leaderboardShardForSixAxisMetric('muscleMass')).toBe('muscleMass');
    expect(leaderboardShardForSixAxisMetric('bodyFat')).toBe('bodyFat_ffmi');
  });

  it('resolves cardio tab shards', () => {
    expect(leaderboardShardForCardioTab('cooper')).toBe('cardio');
    expect(leaderboardShardForCardioTab('5km')).toBe('cardio_5km');
  });

  it('exposes overall and FFMI shard constants', () => {
    expect(LEADERBOARD_SHARD_OVERALL).toBe('ladderScore');
    expect(LEADERBOARD_SHARD_FFMI).toBe('bodyFat_ffmi');
    expect(LEADERBOARD_SHARD_STRENGTH_TOTAL_FIVE).toBe('strength_totalFive');
    expect(LEADERBOARD_SHARD_EXPLOSIVE_COMPOSITE).toBe('explosive_composite');
  });

  it('resolves arm size shard', () => {
    expect(leaderboardShardForArmSize()).toBe('armSize');
  });

  it('maps each SBD lift to its detail ladder shard', () => {
    expect(leaderboardShardForStrengthLift('benchPress')).toBe('strength_bench');
    expect(leaderboardShardForStrengthLift('squat')).toBe('strength_squat');
  });
});
