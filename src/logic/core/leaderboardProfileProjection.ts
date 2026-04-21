import { deriveLadderProfileBuckets } from './ladderProfile';
import type { PhysicalProfile } from '../../types/userProfile';
import type { LadderProfileProjection } from '../../types/ladderProfile';

/**
 * Builds leaderboard summary profile fields from local physical profile.
 * Returns `null` when required baseline fields are invalid/incomplete.
 */
export function buildLeaderboardProfileProjection(
  profile: PhysicalProfile | null | undefined
): Partial<LadderProfileProjection> | null {
  if (!profile) return null;

  const buckets = deriveLadderProfileBuckets({
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    countryCode: profile.countryCode ?? '',
    city: profile.city ?? '',
    district: profile.district ?? '',
  });

  if (!buckets) return null;

  return {
    gender: profile.gender,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    jobCategory: profile.jobCategory ?? '',
    weeklyTrainingHours: profile.weeklyTrainingHours ?? null,
    trainingYears: profile.trainingYears ?? null,
    countryCode: profile.countryCode ?? '',
    region: profile.region ?? '',
    city: profile.city ?? '',
    district: profile.district ?? '',
    isAnonymousInLadder: profile.isAnonymousInLadder === true,
    ...buckets,
  };
}

