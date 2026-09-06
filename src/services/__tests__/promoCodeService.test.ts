import { describe, expect, it } from 'vitest';
import { mapRedeemPromoCallableError } from '../promoCodeService';

describe('mapRedeemPromoCallableError', () => {
  it('maps rate-limit before resource-exhausted substring traps', () => {
    expect(
      mapRedeemPromoCallableError(
        'functions/resource-exhausted promo-redeem-rate-limited'
      )
    ).toBe('rate-limited');
  });

  it('maps promo-code-exhausted without matching resource-exhausted alone as exhausted', () => {
    expect(
      mapRedeemPromoCallableError('functions/resource-exhausted promo-code-exhausted')
    ).toBe('exhausted');
  });

  it('does not treat bare resource-exhausted as exhausted (substring collision)', () => {
    // WHY: "resource-exhausted" contains "exhausted" — must not false-positive.
    expect(mapRedeemPromoCallableError('functions/resource-exhausted')).toBe('failed');
  });

  it('maps auth / already / self / expired / invalid', () => {
    expect(mapRedeemPromoCallableError('functions/unauthenticated')).toBe('auth-required');
    expect(mapRedeemPromoCallableError('functions/already-exists already-redeemed')).toBe(
      'already-redeemed'
    );
    expect(
      mapRedeemPromoCallableError('functions/failed-precondition self-redeem-forbidden')
    ).toBe('self-redeem');
    expect(
      mapRedeemPromoCallableError('functions/failed-precondition promo-code-expired')
    ).toBe('expired');
    expect(mapRedeemPromoCallableError('functions/not-found invalid-promo-code')).toBe(
      'invalid'
    );
  });

  it('maps unauthenticated to app-check when the user is already signed in', () => {
    expect(
      mapRedeemPromoCallableError('functions/unauthenticated', {
        hasGoogleSignedInUser: true,
      })
    ).toBe('app-check');
  });

  it('maps explicit App Check messages to app-check', () => {
    expect(
      mapRedeemPromoCallableError('functions/failed-precondition App Check token is invalid.')
    ).toBe('app-check');
  });
});
