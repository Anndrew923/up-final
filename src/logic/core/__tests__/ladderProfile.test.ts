import { describe, expect, it } from 'vitest';
import {
  deriveAgeBucket,
  deriveHeightBucket,
  deriveLadderProfileBuckets,
  deriveRegionScope,
  deriveWeightBucket,
} from '../ladderProfile';

describe('ladder profile bucket derivation', () => {
  it('derives age buckets on boundaries', () => {
    expect(deriveAgeBucket(19)).toBe('under-20');
    expect(deriveAgeBucket(20)).toBe('20-29');
    expect(deriveAgeBucket(70)).toBe('70+');
  });

  it('derives height and weight buckets deterministically', () => {
    expect(deriveHeightBucket(159.9)).toBe('<160');
    expect(deriveHeightBucket(190)).toBe('180-190');
    expect(deriveWeightBucket(49.9)).toBe('under-50kg');
    expect(deriveWeightBucket(110)).toBe('110kg+');
  });

  it('prefers deepest available region scope', () => {
    expect(deriveRegionScope({ countryCode: 'TW' })).toBe('country');
    expect(deriveRegionScope({ countryCode: 'TW', city: 'Taipei' })).toBe('city');
    expect(deriveRegionScope({ countryCode: 'TW', city: 'Taipei', district: 'Xinyi' })).toBe(
      'district'
    );
  });

  it('returns null when numeric inputs are invalid', () => {
    const buckets = deriveLadderProfileBuckets({
      age: '',
      heightCm: 170,
      weightKg: 70,
      countryCode: 'TW',
    });
    expect(buckets).toBeNull();
  });

  it('derives full bucket payload from valid profile primitives', () => {
    const buckets = deriveLadderProfileBuckets({
      age: 31,
      heightCm: 176.4,
      weightKg: 82,
      countryCode: 'TW',
      city: 'Taipei',
    });
    expect(buckets).toEqual({
      ageBucket: '30-39',
      heightBucket: '170-180',
      weightBucket: '80-90kg',
      regionScope: 'city',
    });
  });
});
