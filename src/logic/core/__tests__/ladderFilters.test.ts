import { describe, expect, it } from 'vitest';
import {
  normalizeTwCityDistrictForLadderDataset,
  resolveEffectiveLadderCityFilter,
  resolveEffectiveLadderDistrictFilter,
} from '../ladderFilters';

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
