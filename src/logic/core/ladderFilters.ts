import type { LadderCountryCode } from '../../types/ladderProfile';
import type { LadderFilterValues } from '../../types/ladderFilters';
import { getDefaultProjectForDivision } from './ladderShards';

/**
 * WHY: Single source of truth for "full global ladder" — Clear must reset here so
 * draft/applied/badge never diverge across hook, page, and tests.
 */
export const DEFAULT_LADDER_FILTERS: Readonly<LadderFilterValues> = Object.freeze({
  division: 'ladderScore',
  filterProject: getDefaultProjectForDivision('ladderScore'),
  gender: 'all',
  ageBucket: 'all',
  heightBucket: 'all',
  weightBucket: 'all',
  jobCategory: 'all',
  countryCode: 'all',
  city: 'all',
  district: 'all',
});

/** Demographic / location tags that Clear zeroes (and badge counts when ≠ all). */
export const LADDER_FILTER_TAG_KEYS = [
  'gender',
  'ageBucket',
  'heightBucket',
  'weightBucket',
  'jobCategory',
  'countryCode',
  'city',
  'district',
] as const satisfies ReadonlyArray<keyof LadderFilterValues>;

/** Fresh mutable copy — never hand the frozen SSOT into React state. */
export function cloneLadderFilterValues(
  values: LadderFilterValues = DEFAULT_LADDER_FILTERS
): LadderFilterValues {
  return { ...values };
}

export function isSameLadderFilterValues(
  a: LadderFilterValues,
  b: LadderFilterValues
): boolean {
  if (a.division !== b.division || a.filterProject !== b.filterProject) return false;
  for (const key of LADDER_FILTER_TAG_KEYS) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Applied-filter badge count: each non-`all` tag + non-default division.
 * WHY: Staying on a single-event shard with tags cleared still must show "filtered"
 * so Clear → total board remains discoverable.
 */
export function countActiveLadderAppliedFilters(values: LadderFilterValues): number {
  let count = 0;
  for (const key of LADDER_FILTER_TAG_KEYS) {
    if (values[key] !== 'all') count += 1;
  }
  if (values.division !== DEFAULT_LADDER_FILTERS.division) count += 1;
  return count;
}

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
