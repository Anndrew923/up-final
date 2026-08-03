import { describe, expect, it } from 'vitest';
import { mapPurchaseProFailureToUi } from '../purchaseProUiFailure';

describe('mapPurchaseProFailureToUi', () => {
  it('maps restore / sync failures to precise UI buckets', () => {
    expect(mapPurchaseProFailureToUi('no-receipt')).toBe('no-receipt');
    expect(mapPurchaseProFailureToUi('invalid-expiry')).toBe('invalid-expiry');
    expect(mapPurchaseProFailureToUi('sync-failed')).toBe('sync-failed');
  });

  it('keeps auth / core / generic billing buckets', () => {
    expect(mapPurchaseProFailureToUi('auth-required')).toBe('auth');
    expect(mapPurchaseProFailureToUi('core-required')).toBe('core');
    expect(mapPurchaseProFailureToUi('billing-unavailable')).toBe('billing');
    expect(mapPurchaseProFailureToUi('failed')).toBe('billing');
    expect(mapPurchaseProFailureToUi('already-pro')).toBe('billing');
  });
});
