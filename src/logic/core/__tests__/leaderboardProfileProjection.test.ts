import { describe, expect, it } from 'vitest';
import { buildLeaderboardProfileProjection } from '../leaderboardProfileProjection';

describe('buildLeaderboardProfileProjection', () => {
  it('returns null for null profile', () => {
    expect(buildLeaderboardProfileProjection(null)).toBeNull();
  });

  it('returns projection with normalized optional defaults and derived buckets', () => {
    const projection = buildLeaderboardProfileProjection({
      gender: 'female',
      age: 28,
      heightCm: 165.2,
      weightKg: 54.8,
      updatedAt: new Date().toISOString(),
      countryCode: 'TW',
      city: 'Taipei',
    });

    expect(projection).toMatchObject({
      gender: 'female',
      age: 28,
      heightCm: 165.2,
      weightKg: 54.8,
      countryCode: 'TW',
      city: 'Taipei',
      region: '',
      district: '',
      jobCategory: '',
      weeklyTrainingHours: null,
      trainingYears: null,
      isAnonymousInLadder: false,
      ageBucket: '20-29',
      heightBucket: '160-170',
      weightBucket: '50-60kg',
      regionScope: 'city',
    });
  });
});

