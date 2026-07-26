import { describe, expect, it } from 'vitest';
import {
  buildLadderTagsRehydrateAttempts,
  hasLocalLadderTags,
  isLadderSegmentFilterActive,
  ladderTagsNeedCloudSync,
} from '../ladderTagsCloudSync';
import type { PhysicalProfile } from '../../../types/userProfile';

const baseProfile = {
  gender: 'male' as const,
  age: 30,
  heightCm: 180,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('hasLocalLadderTags', () => {
  it('is false for empty optional tags', () => {
    expect(hasLocalLadderTags(baseProfile)).toBe(false);
    expect(hasLocalLadderTags(null)).toBe(false);
  });

  it('is true when any segmentation field is set', () => {
    expect(hasLocalLadderTags({ ...baseProfile, jobCategory: 'engineering' })).toBe(true);
    expect(hasLocalLadderTags({ ...baseProfile, countryCode: 'TW' })).toBe(true);
    expect(hasLocalLadderTags({ ...baseProfile, region: 'CA' })).toBe(true);
  });
});

describe('ladderTagsNeedCloudSync', () => {
  const local: PhysicalProfile = {
    ...baseProfile,
    jobCategory: 'engineering',
    countryCode: 'TW',
    city: 'Taipei',
    district: 'Xinyi',
  };

  it('needs sync when cloud row is missing', () => {
    expect(ladderTagsNeedCloudSync(local, null)).toBe(true);
  });

  it('needs sync when cloud tags differ', () => {
    expect(
      ladderTagsNeedCloudSync(local, {
        jobCategory: 'engineering',
        countryCode: 'TW',
        city: '',
        district: '',
      })
    ).toBe(true);
  });

  it('does not need sync when cloud matches', () => {
    expect(
      ladderTagsNeedCloudSync(local, {
        jobCategory: 'engineering',
        countryCode: 'TW',
        city: 'Taipei',
        district: 'Xinyi',
      })
    ).toBe(false);
  });
});

describe('buildLadderTagsRehydrateAttempts', () => {
  it('includes a Job/Country-only fallback when TW locality is present', () => {
    const attempts = buildLadderTagsRehydrateAttempts(baseProfile, {
      jobCategory: 'engineering',
      countryCode: 'TW',
      city: '台北市',
      district: '大安區',
    });
    expect(attempts).toHaveLength(2);
    expect(attempts[0].city).toBe('台北市');
    expect(attempts[1].city).toBe('');
    expect(attempts[1].jobCategory).toBe('engineering');
  });

  it('returns a single attempt when there is no locality to fall back from', () => {
    const attempts = buildLadderTagsRehydrateAttempts(baseProfile, {
      jobCategory: 'coach',
      countryCode: 'JP',
    });
    expect(attempts).toHaveLength(1);
    expect(attempts[0].countryCode).toBe('JP');
  });
});

describe('isLadderSegmentFilterActive', () => {
  const idle = {
    gender: 'all' as const,
    ageBucket: 'all' as const,
    heightBucket: 'all' as const,
    weightBucket: 'all' as const,
    jobCategory: 'all' as const,
    countryCode: 'all' as const,
    city: 'all' as const,
    district: 'all' as const,
  };

  it('ignores non-segment profile buckets', () => {
    expect(isLadderSegmentFilterActive({ ...idle, gender: 'male' })).toBe(false);
  });

  it('detects job / locality filters', () => {
    expect(isLadderSegmentFilterActive({ ...idle, jobCategory: 'engineering' })).toBe(true);
    expect(isLadderSegmentFilterActive({ ...idle, countryCode: 'TW' })).toBe(true);
    expect(isLadderSegmentFilterActive({ ...idle, city: 'Taipei' })).toBe(true);
  });
});
