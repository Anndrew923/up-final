import type { LadderCountryCode } from '../../types/ladderProfile';

/**
 * Normalize ladder UI filter state when option lists change (e.g. city list
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

type RowWithLocation = {
  countryCode?: string;
  city?: string;
  district?: string;
};

/**
 * When no country is selected, city/district filters are ignored (UI should reset them to "all").
 * When a country is selected, city/district options are derived only from rows in that country.
 */
export function normalizeLocationFiltersForLadderDataset(
  rows: readonly RowWithLocation[],
  countryFilter: 'all' | LadderCountryCode,
  city: string | 'all',
  district: string | 'all'
): { city: string | 'all'; district: string | 'all' } {
  if (countryFilter === 'all') {
    return { city: 'all', district: 'all' };
  }

  const scoped = rows.filter((r) => r.countryCode === countryFilter);
  const cityKeys = [...new Set(scoped.map((r) => r.city).filter((c): c is string => Boolean(c)))];
  const effectiveCity = resolveEffectiveLadderCityFilter(city, cityKeys);
  const base = effectiveCity === 'all' ? scoped : scoped.filter((r) => r.city === effectiveCity);
  const districtKeys = [
    ...new Set(base.map((r) => r.district).filter((d): d is string => Boolean(d))),
  ];
  const effectiveDistrict = resolveEffectiveLadderDistrictFilter(district, districtKeys);
  return { city: effectiveCity, district: effectiveDistrict };
}

/**
 * @deprecated Prefer `normalizeLocationFiltersForLadderDataset(rows, 'TW', city, district)`.
 * Legacy TW-only normalization used before country filter existed.
 */
export function normalizeTwCityDistrictForLadderDataset(
  rows: readonly RowWithLocation[],
  city: string | 'all',
  district: string | 'all'
): { city: string | 'all'; district: string | 'all' } {
  return normalizeLocationFiltersForLadderDataset(rows, 'TW', city, district);
}
