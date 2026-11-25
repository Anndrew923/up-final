import { describe, expect, it } from 'vitest';
import {
  cloneLadderFilterValues,
  countActiveLadderAppliedFilters,
  DEFAULT_LADDER_FILTERS,
  isSameLadderFilterValues,
  normalizeLocationFiltersForLadderDataset,
  normalizeTwCityDistrictForLadderDataset,
  resolveEffectiveLadderCityFilter,
  resolveEffectiveLadderDistrictFilter,
} from '../ladderFilters';
import { getDefaultProjectForDivision } from '../ladderShards';

describe('DEFAULT_LADDER_FILTERS / isSameLadderFilterValues', () => {
  it('anchors total-board defaults on ladderScore + all tags', () => {
    expect(DEFAULT_LADDER_FILTERS.division).toBe('ladderScore');
    expect(DEFAULT_LADDER_FILTERS.filterProject).toBe(
      getDefaultProjectForDivision('ladderScore')
    );
    expect(DEFAULT_LADDER_FILTERS.gender).toBe('all');
    expect(DEFAULT_LADDER_FILTERS.countryCode).toBe('all');
    expect(isSameLadderFilterValues(DEFAULT_LADDER_FILTERS, { ...DEFAULT_LADDER_FILTERS })).toBe(
      true
    );
  });

  it('detects field-level divergence', () => {
    expect(
      isSameLadderFilterValues(DEFAULT_LADDER_FILTERS, {
        ...DEFAULT_LADDER_FILTERS,
        gender: 'male',
      })
    ).toBe(false);
  });

  it('cloneLadderFilterValues returns a mutable copy of the frozen SSOT', () => {
    const copy = cloneLadderFilterValues();
    expect(copy).not.toBe(DEFAULT_LADDER_FILTERS);
    expect(isSameLadderFilterValues(copy, DEFAULT_LADDER_FILTERS)).toBe(true);
    copy.gender = 'female';
    expect(DEFAULT_LADDER_FILTERS.gender).toBe('all');
  });
});

describe('countActiveLadderAppliedFilters', () => {
  it('is zero for DEFAULT', () => {
    expect(countActiveLadderAppliedFilters(DEFAULT_LADDER_FILTERS)).toBe(0);
  });

  it('counts tags and non-default division', () => {
    expect(
      countActiveLadderAppliedFilters({
        ...DEFAULT_LADDER_FILTERS,
        gender: 'male',
        division: 'stats_sbdTotal',
        filterProject: 'deadlift',
      })
    ).toBe(2);
  });
});


describe('resolveEffectiveLadderCityFilter', () => {
  it('returns all when filter is all', () => {
    expect(resolveEffectiveLadderCityFilter('all', ['台北市'])).toBe('all');
  });

  it('returns the city when it exists in the list', () => {
    expect(resolveEffectiveLadderCityFilter('台北市', ['台北市', '新北市'])).toBe('台北市');
  });

  it('returns all when city is not in the current list', () => {
    expect(resolveEffectiveLadderCityFilter('已下架', ['台北市'])).toBe('all');
  });
});

describe('resolveEffectiveLadderDistrictFilter', () => {
  it('returns all when filter is all', () => {
    expect(resolveEffectiveLadderDistrictFilter('all', ['大安區'])).toBe('all');
  });

  it('returns the district when it exists', () => {
    expect(resolveEffectiveLadderDistrictFilter('大安區', ['大安區', '信義區'])).toBe('大安區');
  });

  it('returns all when district is not in the current list', () => {
    expect(resolveEffectiveLadderDistrictFilter('幽靈區', ['大安區'])).toBe('all');
  });
});

describe('normalizeTwCityDistrictForLadderDataset', () => {
  const rows = [
    { countryCode: 'TW', city: '台北市', district: '大安區' },
    { countryCode: 'TW', city: '台北市', district: '信義區' },
    { countryCode: 'US', city: '', district: '' },
  ] as const;

  it('falls back to all when city is not in TW dataset', () => {
    expect(normalizeTwCityDistrictForLadderDataset(rows, '高雄市', 'all')).toEqual({
      city: 'all',
      district: 'all',
    });
  });

  it('keeps city and resolves district against that city subset', () => {
    expect(normalizeTwCityDistrictForLadderDataset(rows, '台北市', '幽靈區')).toEqual({
      city: '台北市',
      district: 'all',
    });
  });
});

describe('normalizeLocationFiltersForLadderDataset', () => {
  const rows = [
    { countryCode: 'TW', city: '台北市', district: '大安區' },
    { countryCode: 'US', city: 'Los Angeles', district: 'Downtown' },
  ] as const;

  it('ignores city/district when country filter is all', () => {
    expect(normalizeLocationFiltersForLadderDataset(rows, 'all', '台北市', '大安區')).toEqual({
      city: 'all',
      district: 'all',
    });
  });

  it('resolves city/district within selected country only', () => {
    expect(normalizeLocationFiltersForLadderDataset(rows, 'US', 'Los Angeles', 'Nope')).toEqual({
      city: 'Los Angeles',
      district: 'all',
    });
  });
});
