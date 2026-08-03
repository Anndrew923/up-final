/**
 * Map service-layer purchase failure reasons to JoinArena / paywall UI buckets.
 * WHY: Keep store/SDK reason strings out of presentational components.
 */
export type PurchaseProUiFailureReason =
  | 'billing'
  | 'auth'
  | 'core'
  | 'no-receipt'
  | 'invalid-expiry'
  | 'sync-failed';

export function mapPurchaseProFailureToUi(
  reason:
    | 'core-required'
    | 'already-pro'
    | 'auth-required'
    | 'billing-unavailable'
    | 'no-receipt'
    | 'invalid-expiry'
    | 'sync-failed'
    | 'failed'
): PurchaseProUiFailureReason {
  switch (reason) {
    case 'auth-required':
      return 'auth';
    case 'core-required':
      return 'core';
    case 'no-receipt':
      return 'no-receipt';
    case 'invalid-expiry':
      return 'invalid-expiry';
    case 'sync-failed':
      return 'sync-failed';
    default:
      return 'billing';
  }
}
