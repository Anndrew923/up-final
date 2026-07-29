import { describe, expect, it } from 'vitest';
import {
  HEALTH_TERMS_VERSION,
  isTermsAcceptedFlag,
  termsAcceptedStorageKey,
} from '../termsAcceptance';

describe('termsAcceptance', () => {
  it('builds versioned storage key', () => {
    expect(termsAcceptedStorageKey('v1')).toBe('up.termsAccepted.v1');
    expect(termsAcceptedStorageKey(HEALTH_TERMS_VERSION)).toBe('up.termsAccepted.v1');
  });

  it('treats only "1" as accepted', () => {
    expect(isTermsAcceptedFlag('1')).toBe(true);
    expect(isTermsAcceptedFlag(null)).toBe(false);
    expect(isTermsAcceptedFlag('0')).toBe(false);
  });
});
