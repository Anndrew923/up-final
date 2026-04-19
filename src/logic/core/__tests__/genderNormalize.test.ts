import { describe, expect, it } from 'vitest';
import { normalizeGenderForNormTables } from '../genderNormalize';

describe('normalizeGenderForNormTables', () => {
  it('maps known tokens', () => {
    expect(normalizeGenderForNormTables('male')).toBe('male');
    expect(normalizeGenderForNormTables('female')).toBe('female');
    expect(normalizeGenderForNormTables('男性')).toBe('male');
    expect(normalizeGenderForNormTables('女性')).toBe('female');
  });
  it('returns null for empty', () => {
    expect(normalizeGenderForNormTables(null)).toBeNull();
    expect(normalizeGenderForNormTables('')).toBeNull();
  });
});
