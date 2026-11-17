/**
 * Stable content stamp for single-leaf selfie blob cache invalidation.
 * WHY: Aspect alone is not enough — flipping leaves at the same 9:16 must recompose.
 */
import type { SingleLeafId } from './singleLeafReport';

export interface SingleLeafContentHashInput {
  leaf: SingleLeafId;
  rawReading: string;
  heroScore: number;
  /** Body-norm fields that affect scoring. */
  profileKey: string;
  locale: string;
}

export function buildSingleLeafContentHash(input: SingleLeafContentHashInput): string {
  return [
    input.leaf,
    input.rawReading,
    input.heroScore.toFixed(2),
    input.profileKey,
    input.locale,
  ].join('|');
}

export function buildPhysicalProfileHashKey(profile: {
  gender?: string | null;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
} | null): string {
  if (!profile) return 'none';
  return [
    profile.gender ?? '',
    profile.age ?? '',
    profile.heightCm ?? '',
    profile.weightKg ?? '',
  ].join(',');
}
