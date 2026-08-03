import { describe, expect, it } from 'vitest';
import { isProductAlreadyPurchasedError } from '../revenueCatPurchaseErrors';

describe('isProductAlreadyPurchasedError', () => {
  it('detects RC product-already-purchased code strings', () => {
    expect(
      isProductAlreadyPurchasedError({ code: 'PRODUCT_ALREADY_PURCHASED_ERROR' })
    ).toBe(true);
    expect(isProductAlreadyPurchasedError({ code: 6 })).toBe(true);
  });

  it('detects Play-style already owned messages', () => {
    expect(
      isProductAlreadyPurchasedError({ message: 'Item already owned by user.' })
    ).toBe(true);
  });

  it('normalizes hyphenated / compacted already-owned codes', () => {
    expect(isProductAlreadyPurchasedError({ code: 'ITEM_ALREADY_OWNED' })).toBe(true);
    expect(isProductAlreadyPurchasedError({ code: 'item-already-owned' })).toBe(true);
    expect(isProductAlreadyPurchasedError({ code: 'ITEMAREADYOWNED' })).toBe(true);
  });

  it('rejects unrelated billing errors', () => {
    expect(isProductAlreadyPurchasedError({ code: 'PURCHASE_CANCELLED' })).toBe(false);
    expect(isProductAlreadyPurchasedError(null)).toBe(false);
  });
});
