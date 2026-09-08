import { describe, expect, it } from 'vitest';
import { normalizePromoCode, parseRedeemedReferrerCode } from '../promoCode';

describe('normalizePromoCode', () => {
  it('trims and uppercases', () => {
    expect(normalizePromoCode('  fin_s0  ')).toBe('FIN_S0');
  });

  it('returns empty for non-strings', () => {
    expect(normalizePromoCode('')).toBe('');
    expect(normalizePromoCode('   ')).toBe('');
    expect(normalizePromoCode(null)).toBe('');
  });
});

describe('parseRedeemedReferrerCode', () => {
  it('prefers referrer over redeemedCode', () => {
    expect(parseRedeemedReferrerCode({ referrer: ' fin ', redeemedCode: 'OTHER' })).toBe('FIN');
  });

  it('falls back to redeemedCode', () => {
    expect(parseRedeemedReferrerCode({ redeemedCode: 'fin_s0' })).toBe('FIN_S0');
  });

  it('returns null when neither is present', () => {
    expect(parseRedeemedReferrerCode({})).toBeNull();
    expect(parseRedeemedReferrerCode(null)).toBeNull();
  });
});
