/**
 * Normalize ladder UI filter state when option lists change (e.g. TW city list
 * shrinks after refresh). Keeps `useLadderLeaderboard` filters aligned with what
 * the sheet displays as selected.
 */

export function resolveEffectiveLadderCityFilter(
  cityFilter: string | 'all',
  availableCities: readonly string[]
): string | 'all' {
  if (cityFilter === 'all') return 'all';
  return availableCities.includes(cityFilter) ? cityFilter : 'all';
}

export function resolveEffectiveLadderDistrictFilter(
  districtFilter: string | 'all',
  availableDistricts: readonly string[]
): string | 'all' {
  if (districtFilter === 'all') return 'all';
  return availableDistricts.includes(districtFilter) ? districtFilter : 'all';
}

type RowWithTwLocation = {
  countryCode?: string;
  city?: string;
  district?: string;
};

/**
 * Align city/district filters with cities & districts present in the current dataset.
 * TW-only option lists on the ladder page — derive keys from TW rows so normalization
 * matches what the user can pick.
 */
export function normalizeTwCityDistrictForLadderDataset(
  rows: readonly RowWithTwLocation[],
  city: string | 'all',
  district: string | 'all'
): { city: string | 'all'; district: string | 'all' } {
  const twRows = rows.filter((r) => r.countryCode === 'TW');
  const cityKeys = [...new Set(twRows.map((r) => r.city).filter((c): c is string => Boolean(c)))];
  const effectiveCity = resolveEffectiveLadderCityFilter(city, cityKeys);
  const base =
    effectiveCity === 'all' ? twRows : twRows.filter((r) => r.city === effectiveCity);
  const districtKeys = [...new Set(base.map((r) => r.district).filter((d): d is string => Boolean(d)))];
  const effectiveDistrict = resolveEffectiveLadderDistrictFilter(district, districtKeys);
  return { city: effectiveCity, district: effectiveDistrict };
}
