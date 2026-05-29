import { describe, expect, it } from 'vitest';
import { isPhysicalProfileAdvancedError } from '../homeProfileForm';

describe('isPhysicalProfileAdvancedError', () => {
  it('returns true for Taiwan location validation codes', () => {
    expect(isPhysicalProfileAdvancedError('invalid-city')).toBe(true);
    expect(isPhysicalProfileAdvancedError('invalid-district')).toBe(true);
  });

  it('returns false for core baseline codes and null', () => {
    expect(isPhysicalProfileAdvancedError('required-age')).toBe(false);
    expect(isPhysicalProfileAdvancedError(null)).toBe(false);
    expect(isPhysicalProfileAdvancedError(undefined)).toBe(false);
  });
});
