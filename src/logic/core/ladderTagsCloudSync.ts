import type { PhysicalProfile } from '../../types/userProfile';
import type { LadderProfileFilterShape } from './ladderFilteredRank';

/** Cloud row fields used to detect stale ladder tags after local profile edits. */
export type LadderTagsCloudSnapshot = {
  jobCategory?: string | null;
  countryCode?: string | null;
  city?: string | null;
  district?: string | null;
} | null;

function norm(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** True when the local profile has any ladder-segmentation tag worth syncing. */
export function hasLocalLadderTags(profile: PhysicalProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    norm(profile.jobCategory) ||
      norm(profile.countryCode) ||
      norm(profile.city) ||
      norm(profile.district) ||
      norm(profile.region)
  );
}

/**
 * True when local tags differ from the public ladder row (or there is no cloud row yet).
 * WHY: Soft-prompt Save only writes local storage — filtered ranks read shard fields from sync.
 */
export function ladderTagsNeedCloudSync(
  local: PhysicalProfile | null | undefined,
  cloud: LadderTagsCloudSnapshot
): boolean {
  if (!hasLocalLadderTags(local)) return false;
  if (!cloud) return true;

  const localJob = norm(local?.jobCategory);
  const localCountry = norm(local?.countryCode);
  // WHY: Non-TW free-text `region` is not on shard rows — compare locality only for TW.
  // Still treat leftover cloud city/district as stale when local country is not TW.
  const localCity = localCountry === 'TW' ? norm(local?.city) : '';
  const localDistrict = localCountry === 'TW' ? norm(local?.district) : '';

  return (
    localJob !== norm(cloud.jobCategory) ||
    localCountry !== norm(cloud.countryCode) ||
    localCity !== norm(cloud.city) ||
    localDistrict !== norm(cloud.district)
  );
}

/** Job / country / locality filters only (not gender/age/size buckets). */
export function isLadderSegmentFilterActive(filters: LadderProfileFilterShape): boolean {
  return (
    filters.jobCategory !== 'all' ||
    filters.countryCode !== 'all' ||
    filters.city !== 'all' ||
    filters.district !== 'all'
  );
}
