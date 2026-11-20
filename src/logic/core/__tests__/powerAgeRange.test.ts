import { describe, expect, it } from 'vitest';
import { getPowerAgeRange } from '../powerAgeRange';

describe('getPowerAgeRange', () => {
  it('maps boundary ages into the expected buckets', () => {
    expect(getPowerAgeRange(12)).toBe('12-15');
    expect(getPowerAgeRange(15)).toBe('12-15');
    expect(getPowerAgeRange(16)).toBe('16-20');
    expect(getPowerAgeRange(20)).toBe('16-20');
    expect(getPowerAgeRange(21)).toBe('21-30');
    expect(getPowerAgeRange(30)).toBe('21-30');
    expect(getPowerAgeRange(31)).toBe('31-40');
    expect(getPowerAgeRange(40)).toBe('31-40');
    expect(getPowerAgeRange(41)).toBe('41-50');
    expect(getPowerAgeRange(50)).toBe('41-50');
    expect(getPowerAgeRange(51)).toBe('51-60');
    expect(getPowerAgeRange(60)).toBe('51-60');
    expect(getPowerAgeRange(61)).toBe('61-70');
    expect(getPowerAgeRange(70)).toBe('61-70');
    expect(getPowerAgeRange(71)).toBe('71-80');
    expect(getPowerAgeRange(80)).toBe('71-80');
  });

  it('returns null outside the table', () => {
    expect(getPowerAgeRange(null)).toBeNull();
    expect(getPowerAgeRange(0)).toBeNull();
    expect(getPowerAgeRange(11)).toBeNull();
    expect(getPowerAgeRange(81)).toBeNull();
  });
});
